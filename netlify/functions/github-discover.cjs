const{day}=require('./lib/discovery.cjs');
const{VERSION}=require('./lib/trending.cjs');
const reply=(statusCode,value)=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(value)});
exports.handler=async event=>{
 if(event.httpMethod!=='GET')return reply(405,{error:'仅支持 GET'});
 const category=event.queryStringParameters?.category||'all';
 if(category!=='all')return reply(400,{error:'未知分类'});
 const auth=event.headers?.authorization||event.headers?.Authorization||'';
 if(!/^Bearer \S+$/.test(auth))return reply(401,{error:'请先登录'});
 const{SUPABASE_URL,SUPABASE_ANON_KEY}=process.env;if(!SUPABASE_URL||!SUPABASE_ANON_KEY)return reply(503,{error:'服务未配置 Supabase 环境变量'});
 try{
  const headers={apikey:SUPABASE_ANON_KEY,Authorization:auth};
  const user=await fetch(new URL('/auth/v1/user',SUPABASE_URL),{headers,signal:AbortSignal.timeout(8000)});
  if(!user.ok)return reply(user.status===401||user.status===403?401:502,{error:'登录验证失败，请重新登录或稍后重试'});
  const url=new URL('/rest/v1/github_daily_digest',SUPABASE_URL);url.searchParams.set('select','day,generated_at,payload');url.searchParams.set('order','day.desc');url.searchParams.set('limit','1');url.searchParams.set('day','lte.'+day());
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(8000)});
  if(!response.ok)return reply(503,{error:'每日精选尚未初始化，请管理员执行新增数据库迁移并启用每日任务'});
  const rows=await response.json();const snapshot=rows[0];if(!snapshot)return reply(503,{error:'尚无每日快照，请管理员首次运行 github-daily；页面不会用演示数据代替真实推荐'});
  if(snapshot.payload?.ruleVersion!==VERSION)return reply(503,{error:'热门榜单正在更新，请稍后查看'});
  return reply(200,{category,ruleVersion:VERSION,source:snapshot.payload.source,period:'weekly',day:snapshot.day,generatedAt:snapshot.generated_at,stale:snapshot.day!==day(),items:snapshot.payload.items||[]});
 }catch{return reply(502,{error:'每日精选服务连接失败，请稍后重试'});}
};
