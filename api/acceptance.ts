import {rows,publicProduct} from '../src/db.js';
import {quote,stats,reorder} from '../src/core.js';
type Test={case:string;passed:boolean};
export default async function handler(req:any,res:any){
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 res.setHeader('Cache-Control','no-store');
 try{
 const [products,inventory,requests,requestLines,sales,offers,pending]=await Promise.all([
  rows('products'),rows('inventory_summary'),rows('requests'),rows('request_lines'),rows('sales_lines'),rows('supplier_offers'),rows('pending_purchases')
 ]);
 const lookup=(id:string)=>products.find((p:any)=>p.product_id===id);
 const inv=(id:string)=>inventory.find((p:any)=>p.product_id===id);
 const tests:Test[]=[];
 const check=(name:string,passed:boolean)=>tests.push({case:name,passed:Boolean(passed)});
 const matches=products.filter((p:any)=>p.active&&p.category==='Escritorios'&&Number(p.width_cm)<=110&&Number(p.sale_price_bob)<=900).map((p:any)=>p.product_id);
 check('commercial.width_budget',matches.includes('M04')&&!matches.includes('M05')&&matches.includes('M30')&&lookup('M04')?.width_cm===100&&Number(lookup('M04')?.sale_price_bob)===850);
 check('commercial.stock',Number(inv('M04')?.available_stock)===4);
 check('commercial.public_projection',!Object.prototype.hasOwnProperty.call(publicProduct(lookup('M04')),'unit_cogs_bob')&&Object.prototype.hasOwnProperty.call(publicProduct(lookup('M04')),'sale_price_bob'));
 const lines=requestLines.filter((l:any)=>l.request_id==='S01').map((l:any)=>({product_id:l.product_id,quantity:Number(l.quantity),price:Number(lookup(l.product_id)?.sale_price_bob),stock:Number(inv(l.product_id)?.available_stock)}));
 const q=quote(lines,100);
 check('quotation.S01',requests.some((r:any)=>r.request_id==='S01')&&q.subtotal_bob===2480&&q.transport_bob===100&&q.total_bob===2580&&q.lines.find(x=>x.product_id==='M01')?.shortage===2&&q.delivery_status==='TO_CONFIRM'&&!q.is_sale);
 const monthly=stats(sales as any,'2026-09-01','2026-09-30');
 const oct=stats(sales as any,'2026-10-01','2026-10-31');
 const total=stats(sales as any);
 check('analytics.revenue_monthly',monthly.revenue_bob===9170&&oct.revenue_bob===6660&&+((oct.revenue_bob/monthly.revenue_bob-1)*100).toFixed(2)===-27.37);
 check('analytics.gross_margin',total.revenue_bob===15830&&total.cogs_bob===10660&&total.gross_profit_bob===5170&&total.gross_margin_percent===32.66);
 check('analytics.empty_period',stats(sales as any,'2025-01-01','2025-01-31').gross_margin_percent===null);
 const asOf='2026-11-13';
 const order=(id:string)=>{const v=inv(id);const inbound=pending.filter((x:any)=>x.product_id===id&&x.status==='CONFIRMED'&&x.count_as_inbound&&x.expected_arrival>=asOf&&x.expected_arrival<='2026-11-18').reduce((s:number,x:any)=>s+Number(x.quantity),0);return reorder(v,inbound,offers,asOf)};
 const m01=order('M01'),m03=order('M03'),m06=order('M06'),m08=order('M08');
 check('replenishment.M01',m01?.quantity===8&&m01?.supplier_id==='P02'&&m01?.total_bob===1780);
 check('replenishment.M03',m03?.quantity===6&&m03?.supplier_id==='P01'&&m03?.total_bob===2640);
 check('replenishment.M06',m06?.quantity===0);
 check('replenishment.M08',m08?.quantity===3&&m08?.supplier_id==='P02'&&m08?.total_bob===2670);
 check('replenishment.total',Number(m01?.total_bob)+Number(m03?.total_bob)+Number(m08?.total_bob)===7090);
 const ok=tests.every(x=>x.passed);
 return res.status(ok?200:409).json({ok,mode:'read_only',fixtures:'2026-11-13',tests,passed:tests.filter(x=>x.passed).length,total:tests.length});
 }catch(e:any){console.error('Acceptance check failed',e?.code||'UNAVAILABLE');return res.status(503).json({ok:false,error:'ACCEPTANCE_CHECK_UNAVAILABLE'});}
}
