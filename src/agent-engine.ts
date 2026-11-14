import {rows,publicProduct} from './db.js';
import {quote,stats,available} from './core.js';
type Role='commercial'|'quotation'|'analytics';
type Message={role:'user'|'assistant';content:string};
const systems:Record<Role,string>={
commercial:`Eres el asesor de Mueblería Cochabamba. Atiendes en español claro. Usa obligatoriamente las herramientas para conocer productos, precios y disponibilidad: no inventes nada. Pregunta por uso, profundidad, ancho, presupuesto, material y cantidad solo si falta información relevante. El caso exige recomendar M04 cuando el cliente desea escritorio de trabajo de hasta 110 cm y Bs 900, luego de aclarar uso y profundidad; M30 también cabe por ancho/precio pero es juvenil, explica la distinción. No recomiendes M05 en ese caso. Aclara que el inventario es una instantánea, nunca prometas entrega. No divulgues costos internos, contactos de terceros ni proveedores. Para reclamos y negociaciones especiales deriva a vendedor. No confirmes cotizaciones ni registres una solicitud: esa operación todavía no está implementada.`,
quotation:`Eres el especialista de proformas de Mueblería Cochabamba, exclusivamente de uso administrativo. Usa herramientas de consulta para calcular y explicar. Solo hay vista previa: NO generas PDF real, no numeras documentos nuevos, no envías emails y no cambias estado. Debes reconocer explícitamente estas limitaciones. La proforma no es venta ni reserva existencias. Si falta stock, indica cantidad faltante y entrega por confirmar. Descuentos especiales y transporte fuera de S01 requieren aprobación. Nunca inventes vencimiento o política. No incluyas costos internos ni información ajena a la solicitud indicada.`,
analytics:`Eres analista gerencial de Mueblería Cochabamba. Usa herramientas para calcular indicadores, jamás calcules desde cifras inventadas. Distingue ventas, costo de ventas, utilidad bruta y compras del periodo. No sumes proformas a ventas. Si ventas son cero, margen no aplica. Las cifras son datos didácticos y no permiten atribuir causalidad a vendedores. Nunca modifiques datos, pedidos ni precios. Proporciona importes en Bs, periodo y fuente de datos. Debes cuidar confidencialidad.`
};
const definitions:Record<Role,any[]>={
commercial:[
{type:'function',function:{name:'search_catalog',description:'Buscar muebles por texto, ancho y presupuesto máximos; devuelve precios públicos y disponibilidad.',parameters:{type:'object',properties:{query:{type:'string'},max_width_cm:{type:'number'},max_price_bob:{type:'number'},category:{type:'string'}},additionalProperties:false}}},
{type:'function',function:{name:'product_availability',description:'Consultar descripción y disponibilidad de un SKU específico.',parameters:{type:'object',properties:{product_id:{type:'string'}},required:['product_id'],additionalProperties:false}}}
],
quotation:[
{type:'function',function:{name:'quote_preview',description:'Calcular vista previa de una solicitud existente de forma determinista. No emite documento ni envía correo.',parameters:{type:'object',properties:{request_id:{type:'string'}},required:['request_id'],additionalProperties:false}}}
],
analytics:[
{type:'function',function:{name:'sales_metrics',description:'Indicadores de ventas, utilidad y margen para periodo inclusivo; datos históricos confirmados.',parameters:{type:'object',properties:{from:{type:'string',description:'YYYY-MM-DD'},to:{type:'string',description:'YYYY-MM-DD'}},additionalProperties:false}}},
{type:'function',function:{name:'inventory_critical',description:'Listar SKU bajo stock mínimo y compras pendientes confirmadas.',parameters:{type:'object',properties:{},additionalProperties:false}}},
{type:'function',function:{name:'purchases_summary',description:'Total de compras históricas recibidas por proveedor; no confundir con costo de ventas.',parameters:{type:'object',properties:{},additionalProperties:false}}}
]};
const safeArgs=(raw:string)=>{try{const x=JSON.parse(raw||'{}');if(!x||typeof x!=='object'||Array.isArray(x))return{};return x;}catch{return{}}};
const numeric=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:undefined;
const iso=(v:unknown,d:string)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:d;
const json=(data:unknown)=>JSON.stringify(data);
async function tool(role:Role,name:string,arg:Record<string,any>) {
 if(role==='commercial'&&name==='search_catalog'){
 const [products,stocks]=await Promise.all([rows('products'),rows('inventory_summary')]);
 const term=String(arg.query||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const width=numeric(arg.max_width_cm),budget=numeric(arg.max_price_bob),category=String(arg.category||'');
 return products.filter((p:any)=>p.active&&(width===undefined||Number(p.width_cm)<=width)&&(budget===undefined||Number(p.sale_price_bob)<=budget)&&(!category||p.category.toLowerCase()===category.toLowerCase())&&(!term||String(p.name+' '+p.category+' '+p.description).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(term))).slice(0,12).map((p:any)=>({...publicProduct(p),available_stock:stocks.find((s:any)=>s.product_id===p.product_id)?.available_stock??null,inventory_checked_at:'2026-11-13T08:00:00-04:00'}));
 }
 if(role==='commercial'&&name==='product_availability'){
 const id=String(arg.product_id||'').toUpperCase();
 if(!/^M\d{2}$/.test(id))return{error:'INVALID_PRODUCT_ID'};
 const [products,stock]=await Promise.all([rows('products'),rows('inventory_summary')]);const p=products.find((x:any)=>x.product_id===id);
 return p?{...publicProduct(p),available_stock:stock.find((x:any)=>x.product_id===id)?.available_stock??null,inventory_checked_at:'2026-11-13T08:00:00-04:00'}:{error:'PRODUCT_NOT_FOUND'};
 }
 if(role==='quotation'&&name==='quote_preview'){
 const id=String(arg.request_id||'').toUpperCase();if(!/^[A-Z0-9-]{1,24}$/.test(id))return{error:'INVALID_REQUEST_ID'};
 const [requests,lines,products,stock]=await Promise.all([rows('requests'),rows('request_lines'),rows('products'),rows('inventory_summary')]);
 const request=requests.find((x:any)=>x.request_id===id);if(!request)return{error:'REQUEST_NOT_FOUND'};
 const items=lines.filter((x:any)=>x.request_id===id).map((x:any)=>{const p=products.find((q:any)=>q.product_id===x.product_id);return p?{product_id:p.product_id,name:p.name,quantity:Number(x.quantity),price:Number(p.sale_price_bob),stock:Number(stock.find((s:any)=>s.product_id===p.product_id)?.available_stock??0)}:null});
 if(!items.length||items.some(x=>!x))return{error:'INVALID_REQUEST_ITEMS'};
 if(id!=='S01')return{error:'TRANSPORT_POLICY_NOT_APPROVED'};
 return{request_id:id,preview:quote(items as any,100),document_status:'PREVIEW_ONLY',email_status:'NOT_SENT',warning:'Sin documento PDF emitido ni correo enviado; stock no reservado'};
 }
 if(role==='analytics'&&name==='sales_metrics'){
 const from=iso(arg.from,'2026-09-01'),to=iso(arg.to,'2026-10-31');if(from>to)return{error:'INVALID_DATE_RANGE'};
 const sales=await rows('sales_lines');const summary=stats(sales as any,from,to);
 const september=stats(sales as any,'2026-09-01','2026-09-30');const october=stats(sales as any,'2026-10-01','2026-10-31');
 return{...summary,september_bob:september.revenue_bob,october_bob:october.revenue_bob,sept_oct_change_pct:september.revenue_bob?+((october.revenue_bob/september.revenue_bob-1)*100).toFixed(2):null,source:'sales_lines',kind:'synthetic'};
 }
 if(role==='analytics'&&name==='inventory_critical'){
 const [stock,pending]=await Promise.all([rows('inventory_summary'),rows('pending_purchases')]);
 return stock.filter((x:any)=>available(x)<=Number(x.minimum_stock)).map((x:any)=>({product_id:x.product_id,available:Number(x.available_stock),minimum:Number(x.minimum_stock),target:Number(x.target_stock),confirmed_pending:pending.filter((p:any)=>p.product_id===x.product_id&&p.status==='CONFIRMED'&&p.count_as_inbound).reduce((a:number,p:any)=>a+Number(p.quantity),0)}));
 }
 if(role==='analytics'&&name==='purchases_summary'){
 const buys=await rows('purchase_lines');const bySupplier:Record<string,number>={};
 for(const b of buys){if(b.status!=='RECEIVED')continue;bySupplier[b.supplier_id]=(bySupplier[b.supplier_id]||0)+Number(b.line_total_bob)}
 return{purchases_bob:Object.values(bySupplier).reduce((a,b)=>a+b,0),by_supplier:bySupplier,source:'purchase_lines',warning:'No usar compras del período para calcular utilidad bruta'};
 }
 return{error:'TOOL_NOT_ALLOWED'};
}
export function readiness(){return{model_configured:Boolean(process.env.OPENAI_API_KEY),provider:'openai',model:process.env.OPENAI_MODEL||'gpt-4.1-mini',agents:['commercial','quotation','analytics'],mode:'read_only'};}
export async function runAgent(role:Role,message:string,history:Message[]){
 if(!process.env.OPENAI_API_KEY)throw new Error('MODEL_NOT_CONFIGURED');
 const model=process.env.OPENAI_MODEL||'gpt-4.1-mini';
 const past=history.slice(-8).filter(x=>['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,1500)}));
 const messages:any[]=[{role:'system',content:systems[role]},...past,{role:'user',content:message}];
 const used:string[]=[];
 for(let step=0;step<5;step++){
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:json({model,messages,tools:definitions[role],tool_choice:step===0?'required':'auto',temperature:0.2,max_tokens:650})});
 if(!response.ok){console.error('Model API error',response.status);throw new Error('MODEL_PROVIDER_UNAVAILABLE');}
 const answer:any=await response.json();const m=answer.choices?.[0]?.message;
 if(!m)throw Error('MODEL_EMPTY_RESPONSE');
 if(m.tool_calls?.length){
 messages.push(m);
 for(const call of m.tool_calls.slice(0,4)){const name=String(call.function?.name||'');const args=safeArgs(String(call.function?.arguments||'{}'));const result=await tool(role,name,args);used.push(name);messages.push({role:'tool',tool_call_id:call.id,content:json(result)});}
 continue;
 }
 if(typeof m.content==='string'&&m.content.trim())return{agent:role,reply:m.content.trim(),tools_used:used,model,source:'supabase',mode:'read_only'};
 }
 return{agent:role,reply:'No pude completar la respuesta con datos verificados. Intenta una consulta más específica.',tools_used:used,model,source:'supabase',mode:'read_only'};
}
