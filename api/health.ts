export default function handler(_req:any,res:any){res.status(200).json({ok:true,service:'mueblegest-agents',version:'0.1.0',storage:process.env.SUPABASE_URL?'configured':'missing'});}
