import { env } from 'cloudflare:workers';
import { actionSchema,applyAction } from '@/lib/actions';
import type { Bill } from '@/lib/split';
type Context={params:Promise<{id:string}>};
const valid=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(_:Request,context:Context){
 const {id}=await context.params;if(!valid(id))return json({error:'Invalid bill link.'},400);
 try{const row=await env.DB!.prepare('SELECT data FROM bills WHERE id=?').bind(id).first<{data:string}>();return row?json(JSON.parse(row.data)):json({error:'This bill could not be found.'},404);}
 catch{return json({error:'Could not load this bill.'},500);}
}
export async function POST(request:Request,context:Context){
 const {id}=await context.params;if(!valid(id))return json({error:'Invalid bill link.'},400);
 if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid request origin.'},403);
 let action;
 try{action=actionSchema.parse(await request.json());}catch{return json({error:'Please check your input and try again.'},400);}
 try{
  for(let attempt=0;attempt<8;attempt++){
   const row=await env.DB!.prepare('SELECT data,revision FROM bills WHERE id=?').bind(id).first<{data:string;revision:number}>();
   if(!row)return json({error:'This bill could not be found.'},404);
   let bill:Bill;try{bill=applyAction(JSON.parse(row.data),action);}catch(e){return json({error:(e as Error).message},400);}
   const result=await env.DB!.prepare('UPDATE bills SET data=?,revision=? WHERE id=? AND revision=?').bind(JSON.stringify(bill),bill.revision,id,row.revision).run();
   if(result.meta.changes===1)return json(bill);
  }
  return json({error:'The bill is busy. Please try that change again.'},409);
 }catch(e){console.error(e);return json({error:'Your change could not be saved. Please try again.'},500);}
}
