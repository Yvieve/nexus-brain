const response=data=>({statusCode:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify({service:'nexus-studio',...data})});
exports.handler=async event=>{
 if(event.httpMethod!=='GET')return{statusCode:405,body:'Method not allowed'};
 const required=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','MODEL_API_BASE','MODEL_API_KEY','MODEL_NAME','AI_DEMO_USER_IDS'];
 if(process.env.STUDIO_AI_ENABLED!=='true'||required.some(k=>!process.env[k]))return response({enabled:false,message:'AI 尚未接入'});
 const auth=event.headers?.authorization||event.headers?.Authorization||'';if(!/^Bearer \S+$/.test(auth))return response({enabled:false,message:'请先登录'});
 try{const r=await fetch(new URL('/auth/v1/user',process.env.SUPABASE_URL),{headers:{apikey:process.env.SUPABASE_ANON_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});if(!r.ok)return response({enabled:false,message:'请重新登录'});const user=await r.json();const allowed=process.env.AI_DEMO_USER_IDS.split(',').map(s=>s.trim()).includes(user.id);return response({enabled:allowed,message:allowed?'AI 已配置，首次调用待验证':'当前账号未开通 AI 演示权限'});}catch{return response({enabled:false,message:'AI 连接检查暂不可用'});}
};
