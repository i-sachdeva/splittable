import test from 'node:test';
import assert from 'node:assert/strict';
import {allocate,calculate,makeBill,parseMoney,UNASSIGNED} from '../lib/split.ts';

test('splits a dollar three ways without losing a cent',()=>{assert.deepEqual(allocate(100,[1,1,1]),[34,33,33]);});
test('allocates proportionally by largest remainder',()=>{assert.deepEqual(allocate(10,[1,2,3]),[2,3,5]);});
test('zero-weight allocations stay zero',()=>{assert.deepEqual(allocate(0,[0,0]),[0,0]);assert.deepEqual(allocate(5,[0,1]),[0,5]);});
test('demo totals and unassigned amounts are exact',()=>{const c=calculate(makeBill('test',true));assert.equal(c.subtotal,6700);assert.equal(c.tax,871);assert.equal(c.tip,1206);assert.equal(c.total,8777);assert.equal(c.unassignedCount,1);assert.equal(c.shares.reduce((n,s)=>n+s.total,0),8777);assert.equal(c.shares.at(-1)?.id,UNASSIGNED);});
test('discount reduces both tax and pre-tax tip bases',()=>{const b=makeBill('test');b.items=[{id:'a',name:'Meal',cents:10000,people:['p1']}];b.discount=2000;const c=calculate(b);assert.equal(c.tax,1040);assert.equal(c.tip,1440);assert.equal(c.total,10480);});
test('full discount leaves everyone owing zero',()=>{const b=makeBill('test',true);b.discount=999999;const c=calculate(b);assert.equal(c.total,0);assert.ok(c.shares.every(s=>s.total===0));});
test('empty bills have zero totals',()=>{assert.equal(calculate(makeBill('test')).total,0);});
test('monetary input is exact and rejects malformed or negative values',()=>{assert.equal(parseMoney('1.01'),101);assert.equal(parseMoney('1.1'),110);assert.equal(parseMoney('0'),0);for(const s of ['-1','1.001','NaN','Infinity','1e3',''])assert.throws(()=>parseMoney(s));});
test('1000 deterministic mixed bills reconcile all monetary components',()=>{
 let seed=42;const rand=(max:number)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%max;};
 for(let t=0;t<1000;t++){
  const b=makeBill('test',true);b.items=Array.from({length:rand(30)},(_,i)=>({id:String(i),name:'Item',cents:rand(100000),people:b.people.filter(()=>rand(2)).map(p=>p.id)}));b.discount=rand(300000);b.taxBps=rand(10001);b.tipBps=rand(10001);
  const c=calculate(b);for(const key of ['total','tax','tip','discount'] as const)assert.equal(c.shares.reduce((a,s)=>a+s[key],0),c[key]);assert.equal(c.shares.reduce((a,s)=>a+s.base,0),c.subtotal);assert.ok(c.shares.every(s=>Number.isSafeInteger(s.total)&&s.total>=0));
 }
});
