import {readiness,runAgent} from '../src/agent-engine.js';
export default async function handler(req:any,res:any){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return res.status(200).json(readiness());
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const role=String(req.body?.agent||'');
 if(!['commercial','quotation','analytics'].includes(role))return res.status(400).json({error:'INVALID_AGENT'});
 if(role!=='commercial'&&(!process.env.ADMIN_API_KEY||req.headers['x-admin-key']!==process.env.ADMIN_API_KEY))return res.status(403).json({error:'FORBIDDEN'});
 const message=req.body?.message;
 if(typeof message!=='string'||!message.trim()||message.length>2500)return res.status(400).json({error:'INVALID_MESSAGE'});
 const history=Array.isArray(req.body?.history)?req.body.history.slice(-8):[];
 if(history.some((h:any)=>!h||!['user','assistant'].includes(h.role)||typeof h.content!=='string'))return res.status(400).json({error:'INVALID_HISTORY'});
 try{return res.status(200).json(await runAgent(role as any,message.trim(),history));}
 catch(e:any){const err=String(e?.message||'');if(err==='MODEL_NOT_CONFIGURED')return res.status(503).json({error:err,setup:'Configure OPENAI_API_KEY as a sensitive server-only environment variable in Vercel, then redeploy.'});return res.status(503).json({error:'AGENT_UNAVAILABLE'});}
}
