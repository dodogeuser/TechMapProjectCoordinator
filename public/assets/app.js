(() => {
'use strict';
const all = window.technicians.slice().sort((a,b)=>a.name.localeCompare(b.name));
const colors = {'Handyman':'#159779','Plumbing':'#3786d4','HVAC':'#e79a3e','Electrical':'#9469c8','Locksmith':'#d56277','Glass':'#42a8b4','Doors':'#976c51','Appliances':'#6b8fd5','Backflow':'#3b989b','General contractor':'#a38b2e','Landscaping':'#689945','Cleaning':'#c66cb7','Flooring':'#b27044','Painting':'#cf784f','Fire & safety':'#cc4949','Welding':'#586578','Unspecified':'#87958c'};
const $ = id=>document.getElementById(id);
const escape = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hasPoint=t=>Number.isFinite(t.lat)&&Number.isFinite(t.lng)&&Math.abs(t.lat)<=90&&Math.abs(t.lng)<=180;
const counts = Object.fromEntries(Object.keys(colors).map(k=>[k,all.filter(t=>t.trades.includes(k)).length]));
const categories=Object.keys(colors).filter(k=>counts[k]);
const selected=new Set(categories);
const stateNames={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',PR:'Puerto Rico'};
for(const t of all){
 const code=t.location.match(/,\s*([A-Z]{2})(?:\s+\d{5})?(?:,|\s|$)/)?.[1];
 t.stateName=stateNames[t.state] || (Object.values(stateNames).includes(t.state)?t.state:'') || stateNames[code] || '';
 t.searchText=[t.name,t.phone,t.location,t.stateName,...t.trades].join(' ').toLowerCase();
}
const states=[...new Set(all.map(t=>t.stateName).filter(Boolean))].sort();
$('state').innerHTML+=[...states.map(s=>`<option value="${escape(s)}">${escape(s)}</option>`)].join('');
$('mapped-stat').textContent=all.filter(hasPoint).length.toLocaleString();
$('trade-stat').textContent=categories.length;
$('trades').innerHTML=categories.map(k=>`<label class="trade" style="--color:${colors[k]}"><input type="checkbox" value="${escape(k)}" checked><i class="dot"></i><span>${escape(k)}</span><span class="count">${counts[k]}</span></label>`).join('');
let map, clusters;
const markers=new Map();
if(window.L){
 map=L.map('map',{zoomControl:false,minZoom:2,maxZoom:19}).setView([39.5,-98.4],4);
 L.control.zoom({position:'topright'}).addTo(map);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(map);
 clusters=L.markerClusterGroup({maxClusterRadius:35,showCoverageOnHover:false,spiderfyOnMaxZoom:true,iconCreateFunction:cluster=>L.divIcon({className:'cluster',html:`<span>${cluster.getChildCount()}</span>`,iconSize:[35,35]})});
 map.addLayer(clusters);
 for(const t of all.filter(hasPoint)){
  const color=colors[t.trades[0]];
  const marker=L.marker([t.lat,t.lng],{title:t.name,alt:t.name,icon:L.divIcon({className:'pin',html:`<span class="pin-shape" style="--color:${color}"></span>`,iconSize:[24,30],iconAnchor:[11,27]})});
  marker.on('click',()=>showDetail(t.id,false));
  marker.bindPopup(`<b>${escape(t.name)}</b>${escape(t.location)}`);
  markers.set(t.id,marker);
 }
}else{
 const warning=document.createElement('div'); warning.className='error-banner'; warning.textContent='Map library unavailable. You can still search and browse the directory.'; $('map').append(warning);
}
let filtered=all, page=0, activeId=null, directoryMode=false;
const pageSize=30;
function badge(t){return t.trades.map(k=>`<span class="badge"><i class="dot" style="--color:${colors[k]}"></i>${escape(k)}</span>`).join(' ');}
function showDetail(id,fly=true){
 const t=all.find(x=>x.id===id); if(!t)return;
 activeId=id;
 const phone=t.phone && !/not provided/i.test(t.phone) && /\d{3}/.test(t.phone);
 const google=hasPoint(t)?`https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.location)}`;
 $('detail').hidden=false;
 $('detail').innerHTML=`<button class="close" id="close-detail" aria-label="Close details">×</button><div class="eyebrow">TECHNICIAN DETAILS</div><h3>${escape(t.name)}</h3><div>${badge(t)}</div><p>⌖ &nbsp; ${escape(t.location)}</p><p>☎ &nbsp; ${escape(phone?t.phone:'Phone not provided')}</p><p style="font-size:10px">${hasPoint(t)?'Location from your Google My Maps. Some pins may represent a city rather than a street address.':'Location needed — no matching map coordinates.'}</p><div class="actions">${phone?`<a class="button primary" href="tel:${escape(t.phone.replace(/[^\d+]/g,''))}">Call technician</a>`:''}${t.location!=='USA'&&!/not provided/i.test(t.location)?`<a class="button" target="_blank" rel="noopener" href="${escape(google)}">Directions ↗</a>`:''}</div>`;
 $('close-detail').onclick=()=>{$('detail').hidden=true;activeId=null;map?.closePopup();renderList();};
 if(hasPoint(t)&&map&&fly){
  if(directoryMode)setView(false);
  const marker=markers.get(id);
  clusters.zoomToShowLayer(marker,()=>{marker.openPopup();});
 }
 renderList();
}
function renderList(){
 const rows=filtered.slice(page*pageSize,(page+1)*pageSize);
 $('results').innerHTML=rows.length?rows.map(t=>`<button class="tech ${activeId===t.id?'active':''}" data-id="${t.id}"><strong>${escape(t.name)}</strong><span class="place">⌖ &nbsp; ${escape(t.location)}</span><span class="tags"><i class="dot" style="--color:${colors[t.trades[0]]}"></i>${escape(t.trades.join(' · '))}${!hasPoint(t)?' · Location needed':''}</span></button>`).join(''):'<div class="empty">No technicians match these filters.<br>Try another search or reset your filters.</div>';
 $('result-count').textContent=`${filtered.length.toLocaleString()} technicians`;
 $('page-info').textContent=filtered.length?`${page*pageSize+1}–${Math.min((page+1)*pageSize,filtered.length)} of ${filtered.length.toLocaleString()}`:'0 results';
 $('previous').disabled=page===0; $('next').disabled=(page+1)*pageSize>=filtered.length;
 if(directoryMode)renderDirectory();
}
function renderDirectory(){
 $('directory').innerHTML=`<h2>Technician directory <span>${filtered.length.toLocaleString()} records</span></h2><table><thead><tr><th>Name</th><th>Location</th><th>Trade</th><th>Phone</th></tr></thead><tbody>${filtered.slice(page*pageSize,(page+1)*pageSize).map(t=>`<tr><td><button data-id="${t.id}">${escape(t.name)}</button></td><td>${escape(t.location)}</td><td>${escape(t.trades.join(', '))}</td><td>${escape(t.phone)}</td></tr>`).join('')}</tbody></table>${filtered.length?'':'<p>No technicians match these filters.</p>'}`;
}
function apply(){
 const q=$('search').value.trim().toLowerCase(); const state=$('state').value;const status=$('location-status').value;
 filtered=all.filter(t=>(!q||t.searchText.includes(q))&&(!state||t.stateName===state)&&t.trades.some(k=>selected.has(k))&&(status==='all'||(status==='mapped'?hasPoint(t):!hasPoint(t))));
 page=0;
 if(clusters){clusters.clearLayers();clusters.addLayers(filtered.filter(hasPoint).map(t=>markers.get(t.id)));}
 if(activeId&&!filtered.some(t=>t.id===activeId)){activeId=null;$('detail').hidden=true;map?.closePopup();}
 const pending=filtered.filter(t=>!hasPoint(t)).length;
 $('unmapped-note').textContent=pending?`${pending} records need a location to appear on the map.`:'All matching technicians have map locations.';
 $('all-trades').textContent=selected.size===categories.length?'Clear all':'Select all';
 renderList();
}
function fit(){if(map&&filtered.some(hasPoint))map.fitBounds(L.latLngBounds(filtered.filter(hasPoint).map(t=>[t.lat,t.lng])),{padding:[45,80],maxZoom:12});}
function setView(list){directoryMode=list;document.querySelector('.workspace').classList.toggle('directory-mode',list);$('directory').hidden=!list;for(const [id,enabled]of [['map-view',!list],['list-view',list]]){$(id).classList.toggle('active',enabled);$(id).setAttribute('aria-pressed',enabled); }if(list)renderDirectory();else map?.invalidateSize();}
$('trades').addEventListener('change',e=>{if(e.target.checked)selected.add(e.target.value);else selected.delete(e.target.value);apply();});
$('all-trades').onclick=()=>{const turnOn=selected.size!==categories.length;selected.clear();if(turnOn)categories.forEach(k=>selected.add(k));$('trades').querySelectorAll('input').forEach(c=>c.checked=turnOn);apply();};
let debounce;$('search').oninput=()=>{clearTimeout(debounce);debounce=setTimeout(apply,160);};
$('state').onchange=()=>{apply();fit();};$('location-status').onchange=apply;
$('reset').onclick=()=>{$('search').value='';$('state').value='';$('location-status').value='all';selected.clear();categories.forEach(k=>selected.add(k));$('trades').querySelectorAll('input').forEach(c=>c.checked=true);apply();map?.setView([39.5,-98.4],4);};
for(const id of ['results','directory'])$(id).addEventListener('click',e=>{const button=e.target.closest('[data-id]');if(button)showDetail(Number(button.dataset.id));});
$('previous').onclick=()=>{if(page>0){page--;renderList();$('results').scrollTop=0;}};
$('next').onclick=()=>{if((page+1)*pageSize<filtered.length){page++;renderList();$('results').scrollTop=0;}};
$('fit').onclick=fit;$('home').onclick=()=>map?.setView([39.5,-98.4],4);
$('map-view').onclick=()=>setView(false);$('list-view').onclick=()=>setView(true);
$('export').onclick=()=>{
 const cell=v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const rows=[['Name','Phone','Location','Trades','Latitude','Longitude'],...filtered.map(t=>[t.name,t.phone,t.location,t.trades.join('; '),t.lat,t.lng])];
 const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'})); const a=document.createElement('a');a.href=url;a.download='tech-atlas-technicians.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('detail').hidden)$('close-detail').click();});
apply();
})();
