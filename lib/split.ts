export type Person = { id: string; name: string };
export type Item = { id: string; name: string; cents: number; people: string[] };
export type Bill = { id: string; title: string; currency: 'CAD'|'USD'; people: Person[]; items: Item[]; taxBps: number; tipBps: number; discount: number; revision: number; createdAt: string };
export const UNASSIGNED = '__unassigned';
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a,b)=>a+b,0);
  if (!sum) return weights.map(()=>0);
  const denominator=BigInt(sum);
  const products=weights.map(w=>BigInt(total)*BigInt(w));
  const amounts = products.map(p=>Number(p/denominator));
  let remaining = total-amounts.reduce((a,b)=>a+b,0);
  const order = products.map((p,i)=>({i,remainder:Number(p%denominator)})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
  for (let i=0;i<remaining;i++) amounts[order[i].i]++;
  return amounts;
}
export function calculate(bill: Bill) {
  const ids = [...bill.people.map(p=>p.id),UNASSIGNED];
  const bases = ids.map(()=>0);
  for (const item of bill.items) {
    const selected = item.people.filter(p=>ids.includes(p));
    const owners = selected.length ? selected : [UNASSIGNED];
    const shares = allocate(item.cents,owners.map(()=>1));
    owners.forEach((p,i)=>bases[ids.indexOf(p)]+=shares[i]);
  }
  const subtotal=bases.reduce((a,b)=>a+b,0);
  const discount=Math.min(bill.discount,subtotal);
  const discounts=allocate(discount,bases);
  const net=bases.map((b,i)=>b-discounts[i]);
  const tax=Math.round((subtotal-discount)*bill.taxBps/10000);
  const tip=Math.round((subtotal-discount)*bill.tipBps/10000);
  const taxes=allocate(tax,net),tips=allocate(tip,net);
  return {subtotal,discount,tax,tip,total:subtotal-discount+tax+tip,
    shares:ids.map((id,i)=>({id,base:bases[i],discount:discounts[i],tax:taxes[i],tip:tips[i],total:net[i]+taxes[i]+tips[i]})),
    unassignedCount:bill.items.filter(i=>i.people.length===0).length};
}
export function money(cents:number,currency='CAD') {return new Intl.NumberFormat('en-CA',{style:'currency',currency}).format(cents/100);}
export function parseMoney(value:string):number { if(!/^\d{1,5}(\.\d{1,2})?$/.test(value))throw new Error('Enter an amount with up to 2 decimal places.');const [a,b='']=value.split('.');return Number(a)*100+Number(b.padEnd(2,'0'));}
export function makeBill(id:string,demo=false,title='Untitled dinner'):Bill {
 return {id,title:demo?'Friday night favourites':title,currency:'CAD',taxBps:1300,tipBps:1800,discount:0,revision:0,createdAt:new Date().toISOString(),
 people:demo?[{id:'p1',name:'You'},{id:'p2',name:'Alex'},{id:'p3',name:'Sam'}]:[{id:'p1',name:'You'}],
 items:demo?[
 {id:'i1',name:'Margherita pizza',cents:1850,people:['p1','p2']},
 {id:'i2',name:'Spicy rigatoni',cents:2200,people:['p3']},
 {id:'i3',name:'Truffle fries',cents:900,people:['p1','p2','p3']},
 {id:'i4',name:'Peach iced tea',cents:550,people:['p1']},
 {id:'i5',name:'Tiramisu',cents:1200,people:[]}]:[]};
}
