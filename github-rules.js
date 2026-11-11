(function(root,factory){const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;else root.NexusGitHubRules=value;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 const VERSION=2,MIN_STARS=1000,ACTIVE_DAYS=180,LIMIT=15;
 const categories={all:{label:'全部',topics:[]},skills:{label:'Skill',topics:['agent-skills','claude-skills']},agents:{label:'Agent',topics:['ai-agents','llm-agent']},automation:{label:'工作流自动化',topics:['workflow-automation','n8n']}};
 function day(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
 function queries(now=new Date()){const since=new Date(now.getTime()-ACTIVE_DAYS*86400000).toISOString().slice(0,10);return [...new Set(Object.values(categories).flatMap(x=>x.topics))].map(topic=>'topic:'+topic+' stars:>='+MIN_STARS+' archived:false fork:false is:public pushed:>='+since);}
 function eligible(r,now=new Date()){
  if(!r||!Number.isSafeInteger(r.id)||r.id<=0||typeof r.full_name!=='string'||!/^[-\w.]+\/[-\w.]+$/.test(r.full_name)||r.archived!==false||r.fork!==false||r.private!==false)return false;
  if(!Number.isSafeInteger(r.stargazers_count)||r.stargazers_count<MIN_STARS)return false;
  const pushed=Date.parse(r.pushed_at);if(!Number.isFinite(pushed)||pushed>now.getTime()||pushed<now.getTime()-ACTIVE_DAYS*86400000)return false;
  return Array.isArray(r.topics)&&r.topics.some(t=>Object.values(categories).some(c=>c.topics.includes(t)));
 }
 function buildPayload(repositories,now=new Date()){
  const byName=new Map();for(const r of repositories){if(!r||!Number.isSafeInteger(r.id)||r.id<=0||typeof r.full_name!=='string')continue;byName.set(r.id,r);}
  const sorted=[...byName.values()].filter(r=>eligible(r,now)).sort((a,b)=>b.stargazers_count-a.stargazers_count||Date.parse(b.pushed_at)-Date.parse(a.pushed_at)||a.full_name.localeCompare(b.full_name));
  const convert=r=>({id:r.id,name:r.full_name,url:'https://github.com/'+r.full_name,description:String(r.description||'').slice(0,1000),stars:r.stargazers_count,updatedAt:r.pushed_at,license:r.license?.spdx_id||null,topics:r.topics.slice(0,20),reason:'累计 Star '+r.stargazers_count.toLocaleString('en-US')+' · 近 '+ACTIVE_DAYS+' 天有代码提交',status:'按公开指标筛选，未验证业务效果'});
  return {ruleVersion:VERSION,source:'GitHub Search API',generatedAt:now.toISOString(),day:day(now),rules:{minStars:MIN_STARS,activeDays:ACTIVE_DAYS,sort:'累计 Star 降序；同数按最近代码提交排序',scope:'固定 Topic 查询返回的候选集合',starMeaning:'累计关注度，不是今日/本周增量，不是 GitHub Trending'},categories:Object.fromEntries(Object.entries(categories).map(([key,c])=>[key,sorted.filter(r=>key==='all'||r.topics.some(t=>c.topics.includes(t))).slice(0,LIMIT).map(convert)]))};
 }
 return Object.freeze({VERSION,MIN_STARS,ACTIVE_DAYS,LIMIT,categories,day,queries,eligible,buildPayload});
});
