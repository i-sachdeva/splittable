import type { Bill } from './split';
import { z } from 'zod';
const id=z.string().min(1).max(80);
const name=z.string().trim().min(1).max(80);
export const actionSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('person.add'),id,name}),
 z.object({type:z.literal('person.remove'),id}),
 z.object({type:z.literal('item.add'),id,name,cents:z.number().int().min(1).max(9999999)}),
 z.object({type:z.literal('item.remove'),id}),
 z.object({type:z.literal('claim'),id,person:id,selected:z.boolean()}),
 z.object({type:z.literal('all'),id}),
 z.object({type:z.literal('settings'),taxBps:z.number().int().min(0).max(10000),tipBps:z.number().int().min(0).max(10000),discount:z.number().int().min(0).max(9999999)}),
 z.object({type:z.literal('title'),title:name}),
 z.object({type:z.literal('currency'),currency:z.enum(['CAD','USD'])})
]);
export type Action=z.infer<typeof actionSchema>;
export function applyAction(input:Bill,a:Action):Bill {
 const b=structuredClone(input);
 if(a.type==='person.add'){
  if(b.people.length>=20)throw new Error('A bill can have up to 20 people.');
  if(b.people.some(p=>p.name.toLowerCase()===a.name.toLowerCase()))throw new Error('That name is already at the table.');
  if(!b.people.some(p=>p.id===a.id))b.people.push({id:a.id,name:a.name});
 } else if(a.type==='person.remove'){
  if(b.people.length<=1)throw new Error('Keep at least one person at the table.');
  b.people=b.people.filter(p=>p.id!==a.id);b.items.forEach(i=>i.people=i.people.filter(p=>p!==a.id));
 } else if(a.type==='item.add'){
  if(b.items.length>=100)throw new Error('A bill can have up to 100 items.');
  if(!b.items.some(i=>i.id===a.id))b.items.push({id:a.id,name:a.name,cents:a.cents,people:[]});
 } else if(a.type==='item.remove')b.items=b.items.filter(i=>i.id!==a.id);
 else if(a.type==='claim'||a.type==='all'){
  const item=b.items.find(i=>i.id===a.id);if(!item)throw new Error('This item was removed. Refresh and try again.');
  if(a.type==='all')item.people=b.people.map(p=>p.id);
  else {if(!b.people.some(p=>p.id===a.person))throw new Error('This person is no longer on the bill.');item.people=item.people.filter(p=>p!==a.person);if(a.selected)item.people.push(a.person);}
 } else if(a.type==='settings'){b.taxBps=a.taxBps;b.tipBps=a.tipBps;b.discount=a.discount;}
 else if(a.type==='title')b.title=a.title;
 else if(a.type==='currency')b.currency=a.currency;
 b.revision++;return b;
}
