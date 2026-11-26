import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL;
async function req(path,body){const res=await fetch(base+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};}
test('saved bills, concurrent claims, validation and removals',{skip:!base},async()=>{
 const created=await req('/api/bills',{title:'API integration test'});assert.equal(created.status,201);const url='/api/bills/'+created.data.id;
 const participants=await Promise.all(['alex','sam','jamie'].map(id=>req(url,{type:'person.add',id,name:id})));participants.forEach(r=>assert.equal(r.status,200));
 let saved=await req(url);assert.equal(saved.data.people.length,4);assert.equal(saved.data.revision,3);
 const item=await req(url,{type:'item.add',id:'meal',name:'Shared meal',cents:100});assert.equal(item.status,200);
 const claims=await Promise.all(['p1','alex','sam','jamie'].map(person=>req(url,{type:'claim',id:'meal',person,selected:true})));claims.forEach(r=>assert.equal(r.status,200));
 saved=await req(url);assert.equal(saved.data.items[0].people.length,4);assert.equal(saved.data.revision,8);
 const invalid=await req(url,{type:'item.add',id:'bad',name:'Invalid',cents:-100});assert.equal(invalid.status,400);
 const remove=await req(url,{type:'person.remove',id:'jamie'});assert.equal(remove.status,200);assert.equal(remove.data.items[0].people.length,3);assert.ok(!remove.data.items[0].people.includes('jamie'));
 const missing=await req('/api/bills/00000000-0000-4000-8000-000000000001');assert.equal(missing.status,404);
});
