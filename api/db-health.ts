import { rows } from '../src/db.js';
export default async function handler(req:any,res:any) {
  if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  res.setHeader('Cache-Control','no-store');
  try{
    const products=await rows('products','product_id');
    return res.status(200).json({ok:true,source:'supabase',product_count:products.length});
  }catch(err:any){
    console.error('Database connectivity check failed:',err?.code||'UNAVAILABLE');
    return res.status(503).json({ok:false,error:'DATABASE_UNAVAILABLE'});
  }
}
