import { env } from 'cloudflare:workers';
import { makeBill } from '@/lib/split';
export async function POST(request:Request){
 try {
  if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid request origin.'},{status:403});
  const payload=await request.json() as {demo?:boolean;title?:string};
  const title=typeof payload.title==='string'?payload.title.trim().slice(0,80):'Untitled dinner';
  const bill=makeBill(crypto.randomUUID(),payload.demo===true,title||'Untitled dinner');
  await env.DB!.prepare('INSERT INTO bills (id,data,revision,created_at) VALUES (?,?,?,?)').bind(bill.id,JSON.stringify(bill),0,bill.createdAt).run();
  return Response.json(bill,{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Could not create the bill. Please try again.'},{status:500});}
}
