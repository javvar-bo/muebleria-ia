import {rows,publicProduct} from '../src/db.js';
export default async function handler(req:any,res:any){if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});try{
 const p=req.body??{};const list=await rows('products');const stock=await rows('inventory_summary');
 const term=String(p.query??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const results=list.filter((x:any)=>x.active&&(!p.max_width_cm||x.width_cm<=p.max_width_cm)&&(!p.max_price_bob||x.sale_price_bob<=p.max_price_bob)&&(!p.category||x.category===p.category)&&(!term||String(x.name+' '+x.category+' '+x.description).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(term))).slice(0,12).map((x:any)=>({...publicProduct(x),available_stock:stock.find((s:any)=>s.product_id===x.product_id)?.available_stock??null}));
 return res.status(200).json({agent:'commercial',products:results,follow_up_questions:[...(!p.use?['¿Para qué lo utilizará?']:[]),...(!p.max_depth_cm?['¿Qué profundidad tiene el espacio?']:[])],data_source:'supabase',disclaimer:'La disponibilidad es una instantánea; confirmar antes de prometer entrega.'});
 }catch(e:any){return res.status(503).json({error:'DATA_UNAVAILABLE',detail:e.message});}}
