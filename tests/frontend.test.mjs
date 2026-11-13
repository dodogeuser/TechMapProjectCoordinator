import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const source = fs.readFileSync('public/assets/app.js', 'utf8');
const html = fs.readFileSync('resources/views/map.blade.php', 'utf8');
const data = JSON.parse(fs.readFileSync('storage/app/technicians.json','utf8'));
function setup(){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost:8000'});
 const w=dom.window;w.technicians=structuredClone(data);
 const layer={items:[],clearLayers(){this.items=[];},addLayers(items){this.items=items;},zoomToShowLayer(marker,callback){callback();}};
 const tiles={};
 const map={addLayer(){},setView(){return this;},fitBounds(){},closePopup(){},invalidateSize(){}};
 w.L={map:()=>map,control:{zoom:()=>({addTo(){}})},tileLayer:(url,options)=>{tiles.url=url;tiles.options=options;return {addTo(){}};},markerClusterGroup:()=>layer,marker:()=>({on(){},bindPopup(){},openPopup(){}}),divIcon:x=>x,latLngBounds:x=>x};
 w.eval(source);
 return {w,d:w.document,layer,tiles,close:()=>w.close()};
}
test('imports all records and maps only valid locations',()=>{
 const {d,layer,close}=setup();
 assert.equal(d.querySelector('#result-count').textContent,'2,811 technicians');
 assert.equal(layer.items.length,2760);
 assert.equal(d.querySelector('#mapped-stat').textContent,'2,760');
 assert.match(d.querySelector('#unmapped-note').textContent,/51 records/);close();
});
test('trade filters clear, select and reset together with map layers',()=>{
 const {d,layer,close}=setup();d.querySelector('#all-trades').click();
 assert.equal(layer.items.length,0);assert.match(d.querySelector('#results').textContent,/No technicians/);
 const plumbing=d.querySelector('input[value="Plumbing"]');plumbing.click();
 assert.equal(d.querySelector('#result-count').textContent,'374 technicians');
 assert.equal(layer.items.length,data.filter(t=>t.trades.includes('Plumbing')&&t.lat!==null).length);
 d.querySelector('#reset').click();assert.equal(layer.items.length,2760);close();
});
test('state filtering and location-needed filtering preserve directory records',()=>{
 const {w,d,layer,close}=setup();const state=d.querySelector('#state');state.value='Alabama';state.dispatchEvent(new w.Event('change'));
 assert.ok(layer.items.length>0&&layer.items.length<2760);
 d.querySelector('#reset').click();const status=d.querySelector('#location-status');status.value='unmapped';status.dispatchEvent(new w.Event('change'));
 assert.equal(d.querySelector('#result-count').textContent,'51 technicians');assert.equal(layer.items.length,0);
 d.querySelector('#results button').click();assert.match(d.querySelector('#detail').textContent,/Location needed/);close();
});
test('search opens the correct phone contact and supports closing details',async()=>{
 const {w,d,close}=setup();const search=d.querySelector('#search');search.value='Miguel Gomez';search.dispatchEvent(new w.Event('input'));
 await new Promise(resolve=>setTimeout(resolve,200));
 assert.equal(d.querySelector('#result-count').textContent,'1 technicians');d.querySelector('#results button').click();
 assert.equal(d.querySelector('#detail h3').textContent,'Miguel Gomez');assert.equal(d.querySelector('a[href^="tel:"]').getAttribute('href'),'tel:2569601187');
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(d.querySelector('#detail').hidden,true);close();
});
test('pagination and directory view stay in sync',()=>{
 const {d,close}=setup();d.querySelector('#next').click();assert.match(d.querySelector('#page-info').textContent,/31–60/);
 d.querySelector('#list-view').click();assert.equal(d.querySelector('#directory').hidden,false);assert.equal(d.querySelectorAll('#directory tbody tr').length,30);
 d.querySelector('#map-view').click();assert.equal(d.querySelector('#directory').hidden,true);close();
});
test('contact names and locations are treated as text',()=>{
 const dom=new JSDOM(html,{runScripts:'outside-only'});const w=dom.window;
 w.technicians=[{id:1,name:'<img src=x onerror=alert(1)>',location:'<script>alert(1)</script>',phone:'Not provided in map',trades:['Unspecified'],lat:null,lng:null}];
 w.eval(source);const d=w.document;assert.equal(d.querySelectorAll('#results img').length,0);
 d.querySelector('#results button').click();assert.equal(d.querySelectorAll('#detail script').length,0);assert.equal(d.querySelectorAll('#detail a[href^="tel:"]').length,0);w.close();
});

test('basemap uses the standard OpenStreetMap endpoint with attribution',()=>{
 const {tiles,close}=setup();
 assert.equal(tiles.url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
 assert.match(tiles.options.attribution,/OpenStreetMap.*contributors/);
 assert.equal(tiles.options.maxZoom,19);
 close();
});
