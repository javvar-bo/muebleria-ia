export function available(stock:{physical_stock:number,reserved_stock:number}) {return Number(stock.physical_stock)-Number(stock.reserved_stock);}
export function quote(items:Array<{product_id:string,quantity:number,price:number,stock:number}>,transport:number){
 if(!Number.isFinite(transport)||transport<0)throw Error('INVALID_TRANSPORT');
 let subtotal=0;const lines=items.map(i=>{if(!Number.isInteger(i.quantity)||i.quantity<=0||!Number.isFinite(i.price)||i.price<0)throw Error('INVALID_LINE');const total=+(i.quantity*i.price).toFixed(2);subtotal+=total;return {...i,line_total_bob:total,shortage:Math.max(0,i.quantity-i.stock)};});
 return {lines,subtotal_bob:+subtotal.toFixed(2),transport_bob:transport,total_bob:+(subtotal+transport).toFixed(2),delivery_status:lines.some(i=>i.shortage>0)?'TO_CONFIRM':'STOCK_AVAILABLE',is_sale:false};
}
export function stats(sales:Array<{sale_date:string,line_revenue_bob:number,line_cogs_bob:number,quantity:number}>,from='2026-09-01',to='2026-10-31') {
 const filtered=sales.filter(x=>x.sale_date>=from&&x.sale_date<=to);const revenue=filtered.reduce((a,x)=>a+ +x.line_revenue_bob,0);const cogs=filtered.reduce((a,x)=>a+ +x.line_cogs_bob,0);const units=filtered.reduce((a,x)=>a+ +x.quantity,0);return{from,to,units,revenue_bob:revenue,cogs_bob:cogs,gross_profit_bob:revenue-cogs,gross_margin_percent:revenue?+((revenue-cogs)*100/revenue).toFixed(2):null};
}
export function reorder(inv:{product_id:string,physical_stock:number,reserved_stock:number,minimum_stock:number,target_stock:number},inbound:number,offers:Array<any>,asOf='2026-11-13') {
 const a=available(inv); if(a>inv.minimum_stock)return null;
 const quantity=Math.max(0,inv.target_stock-a-inbound);
 if(!quantity)return{product_id:inv.product_id,quantity:0,reason:'PENDING_COVERS_TARGET'};
 const eligible=offers.filter(o=>o.product_id===inv.product_id&&o.quality_approved&&o.equivalence_approved&&o.delivery_days<=5&&o.available_quantity>=quantity&&o.min_order_quantity<=quantity&&o.valid_from<=asOf&&o.valid_until>=asOf).map(o=>({...o,total_bob:+(quantity* +o.unit_price_bob - +o.discount_bob + +o.freight_bob).toFixed(2)})).sort((a,b)=>a.total_bob-b.total_bob||a.delivery_days-b.delivery_days||a.supplier_id.localeCompare(b.supplier_id));
 return eligible.length?{product_id:inv.product_id,quantity,supplier_id:eligible[0].supplier_id,total_bob:eligible[0].total_bob,status:'PENDING_APPROVAL'}:{product_id:inv.product_id,quantity,status:'NO_ELIGIBLE_SUPPLIER'};
}
