"""Import the supplied XLSX and coordinates from a downloaded My Maps viewer page.
Usage: python3 scripts/import_technicians.py workbook.xlsx /path/to/viewer.html
Only Python standard library is required. Original workbook is never modified.
"""
import sys, json, re, zipfile, collections, xml.etree.ElementTree as ET
from pathlib import Path
book, html = sys.argv[1:]
page = Path(html).read_text()
data = json.loads(json.loads(re.search(r'var _pageData = (".*?");', page)[1]))
records=[]
def walk(v):
    if not isinstance(v,list): return
    if len(v)>5 and isinstance(v[0],str) and re.match(r'^[A-F0-9]{16}$', v[0]) and isinstance(v[5],list):
        fields={}
        def fields_walk(x):
            if not isinstance(x,list): return
            if len(x)==3 and isinstance(x[0],str) and isinstance(x[1],list): fields[x[0].lstrip('\ufeff').lower()]='; '.join(str(t) for t in x[1])
            else:
                for y in x: fields_walk(y)
        fields_walk(v[5])
        try: fields['lat'],fields['lng']=v[1][0][0]
        except (TypeError,IndexError,ValueError): return
        if fields.get('name'): records.append(fields)
        return
    for x in v: walk(x)
walk(data)
normalize=lambda s: re.sub(r'[^a-z0-9]','',str(s).lower())
byphone=collections.defaultdict(list)
byname=collections.defaultdict(list)
for r in records:
    byname[normalize(r['name'])].append(r)
    if len(normalize(r.get('phone','')))>=10: byphone[normalize(r['phone'])].append(r)
z=zipfile.ZipFile(book); ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
shared=[''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
rows=[]
for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:row',ns)[1:]:
    cells={}
    for c in row:
        val=c.find('m:v',ns)
        cells[re.sub(r'\d','',c.attrib['r'])]=shared[int(val.text)] if c.attrib.get('t')=='s' else (val.text if val is not None else ''.join(c.itertext()))
    if not cells.get('A'): continue
    matches=byname[normalize(cells['A'])]
    exact=[r for r in matches if normalize(r.get('phone',''))==normalize(cells.get('B',''))]
    phone_matches=byphone.get(normalize(cells.get('B','')),[])
    match=(exact or matches or (phone_matches if len(phone_matches)==1 else []) or [None])[0]
    trade=cells.get('D','').strip()
    if trade.lower() in ('','not provided in map'): trade='Unspecified'
    categories=[]
    for label, pattern in [('Handyman',r'handyman|carpenter'),('Plumbing',r'plumb'),('HVAC',r'hvac|heating|cooling|refrig'),('Electrical',r'electri|electici'),('Locksmith',r'locksmith'),('Glass',r'glass|glaz'),('Doors',r'door'),('Appliances',r'appliance'),('Backflow',r'backflow'),('General contractor',r'all trades|general contractor|contruction|construction'),('Landscaping',r'landscap|paving|asphalt|snow'),('Cleaning',r'clean|janitor|washing'),('Flooring',r'floor|carpet'),('Painting',r'paint|drywall'),('Fire & safety',r'fire'),('Welding',r'weld')]:
        if re.search(pattern,trade,re.I): categories.append(label)
    if not categories: categories=['Unspecified']
    rows.append(dict(id=len(rows)+1,name=cells['A'].strip(),phone=cells.get('B','').strip(),location=cells.get('C','').strip(),trade=trade,trades=categories,lat=match['lat'] if match else None,lng=match['lng'] if match else None,state=match.get('state','') if match else '',coordinate_source='Google My Maps' if match else None))
Path('storage/app').mkdir(parents=True,exist_ok=True)
Path('storage/app/technicians.json').write_text(json.dumps(rows,ensure_ascii=False))
print(json.dumps({'technicians':len(rows),'mapped':sum(r['lat'] is not None for r in rows),'trades':collections.Counter(t for r in rows for t in r['trades'])},indent=2))
