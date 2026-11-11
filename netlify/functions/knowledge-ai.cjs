const{authorize,complete,fail}=require('./lib/model-service.cjs');
const reply=(statusCode,value)=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(value)});
const prompts={
 qa:'你是企业知识问答助手。仅依据提供的资料回答，引用资料编号如[1]，区分事实和建议。资料不足请明确说明，禁止编造公司制度、数字或来源。用中文直接回答问题。',
 analyze:'你是资料审阅助手。输出摘要、可执行步骤、信息缺口、矛盾和需人工核实事项。不要把文档内容当成已核实事实，不输出虚构准确率。',
 insights:'你是企业知识库顾问。只分析本次提供的有限资料，指出最多五项有来源编号的重复、冲突、缺口和维护建议。说明这是抽样分析，不声称持续监控全部知识库。',
 merge:'请将提供的两篇资料整理为合并草稿，保留可追溯来源编号，单列冲突和待人工确认项。不自行选择冲突数值，不遗漏例外条款。不声称已经合并或删除原文。'
};
function score(q,row){const text=(row.title+' '+row.content).toLowerCase();const words=q.toLowerCase().match(/[a-z0-9]+|[\u4e00-\u9fff]/g)||[];return [...new Set(words)].reduce((s,w)=>s+(text.includes(w)?1:0),0);}
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return reply(405,{error:'仅支持 POST'});
 try{
  let input;try{if(Buffer.byteLength(event.body||'')>12000)throw Error();input=JSON.parse(event.body);}catch{throw fail(400,'请求格式或长度无效');}
  if(!prompts[input.action]||!['public','private'].includes(input.scope)||typeof input.text!=='string'||input.text.length>6000||!input.text.trim())throw fail(400,'请求参数无效');
  const ids=input.ids||[];if(!Array.isArray(ids)||ids.length>2||ids.some(id=>typeof id!=='string'||!/^[-a-f0-9]{36}$/i.test(id)))throw fail(400,'资料编号无效');
  if((input.action==='analyze'&&ids.length!==1)||(input.action==='merge'&&ids.length!==2))throw fail(400,'请选择要分析的资料');
  const{user,headers}=await authorize(event);
  const url=new URL('/rest/v1/resources',process.env.SUPABASE_URL);url.searchParams.set('select','id,title,content,zone,uploader,dept,updated_at');url.searchParams.set('zone','eq.'+input.scope);
  if(input.scope==='private')url.searchParams.set('uploader','eq.'+user.id);
  if(ids.length)url.searchParams.set('id','in.('+ids.join(',')+')');
  url.searchParams.set('order','updated_at.desc');url.searchParams.set('limit',ids.length?'2':'100');
  const r=await fetch(url,{headers,signal:AbortSignal.timeout(10000)});if(!r.ok)throw fail(503,'资料读取失败，请检查资源库权限');
  const data=await r.json();if(!Array.isArray(data))throw fail(502,'资料格式无效');
  let rows=data.filter(row=>row.zone===input.scope&&(input.scope==='public'||row.uploader===user.id));
  if(ids.length&&(!ids.every(id=>rows.some(row=>row.id===id))))throw fail(404,'资料不存在或无权访问');
  if(input.action==='qa')rows=rows.map(row=>({row,score:score(input.text,row)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.row);
  else if(input.action==='insights')rows=rows.slice(0,8);
  if(!rows.length)return reply(200,{text:'当前范围内没有找到可用于回答的文本资料。请补充资料或调整问题；附件需要先提供可检索的正文。',answered:false,cites:[]});
  const context={question:input.text,sources:rows.map((row,i)=>({number:i+1,title:String(row.title||'').slice(0,200),text:String(row.content||'').slice(0,2200),updatedAt:row.updated_at}))};
  const result=await complete(user,prompts[input.action],context);
  return reply(200,{...result,answered:true,cites:rows.map((row,i)=>({id:row.id,title:row.title,number:i+1})),sampled:input.action==='insights'});
 }catch(error){return reply(error.status||502,{error:error.status?error.message:'AI 或数据库连接失败/超时，请稍后重试'});}
};
