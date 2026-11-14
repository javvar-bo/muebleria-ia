import { createClient } from '@supabase/supabase-js';
export function db() {
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key) throw new Error('SUPABASE_NOT_CONFIGURED');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function rows(table:string,select='*') {
  const allowed=new Set(['products','warehouse_stock','inventory_summary','requests','request_lines','quotes','customers','sales_lines','purchase_lines','pending_purchases','supplier_offers','suppliers']);
  if(!allowed.has(table)) throw new Error('TABLE_NOT_ALLOWED');
  const {data,error}=await db().from(table).select(select).limit(1000);
  if(error) throw error;return data??[];
}
export function publicProduct(p:any){const {product_id,name,category,material,description,width_cm,depth_cm,height_cm,sale_price_bob,active}=p;return{product_id,name,category,material,description,width_cm,depth_cm,height_cm,sale_price_bob,active};}
