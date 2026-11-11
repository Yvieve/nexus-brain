const {collect}=require('./lib/trending.cjs');
exports.config={schedule:'10 1 * * *'}; // 09:10 Asia/Shanghai, production Netlify deploys only.
exports.handler=async()=>{
 const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
 if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)return{statusCode:503,body:'Daily discovery storage is not configured'};
 try{
  const payload=await collect();
  const response=await fetch(new URL('/rest/v1/github_daily_digest?on_conflict=day',SUPABASE_URL),{method:'POST',headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({day:payload.day,generated_at:payload.generatedAt,payload}),signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('storage');
  return{statusCode:200,body:'Daily discovery snapshot stored'};
 }catch{return{statusCode:502,body:'Daily discovery failed; previous snapshot preserved'};}
};
