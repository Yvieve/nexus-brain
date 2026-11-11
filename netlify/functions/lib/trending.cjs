const SOURCE='https://github.com/trending?since=weekly',VERSION=3;
function decode(text){return String(text||'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|apos|#39|#x[\da-f]+|#\d+);/gi,s=>{const known={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"};if(known[s])return known[s];const n=s.startsWith('&#x')?parseInt(s.slice(3,-1),16):parseInt(s.slice(2,-1),10);return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):s;}).replace(/\s+/g,' ').trim();}
function parseTrending(html,now=new Date()){
 if(typeof html!=='string'||html.length>2000000)throw Error('Invalid Trending response');
 const blocks=[...html.matchAll(/<article\b[^>]*class=["'][^"']*\bBox-row\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)];
 if(!blocks.length)throw Error('Trending structure changed');
 let valid=0;const items=[],seen=new Set();
 for(let i=0;i<blocks.length;i++){
  const block=blocks[i][1],heading=block.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1];const href=heading?.match(/href=["'](\/[-\w.]+\/[-\w.]+)["']/i)?.[1];
  if(!href)throw Error('Trending repository structure changed');valid++;if(seen.has(href.toLowerCase()))continue;seen.add(href.toLowerCase());
  const name=href.slice(1),description=decode(block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]);
  if(!/\b(ai|llms?|agents?|skills?|chatgpt|claude|gpt|mcp|copilot|generative)\b|人工智能|智能体|大模型/i.test(name+' '+description))continue;
  const starLink=[...block.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].find(x=>x[1]===href+'/stargazers');
  const starText=decode(starLink?.[2]),stars=/^[\d,]+$/.test(starText)?Number(starText.replaceAll(',','')):null;
  const gain=decode(block).match(/([\d,]+)\s+stars?\s+this\s+week/i);const weekStars=gain?Number(gain[1].replaceAll(',','')):null;
  items.push({name,url:'https://github.com'+href,description,rank:i+1,stars,weekStars,language:decode(block.match(/itemprop=["']programmingLanguage["'][^>]*>([^<]*)/i)?.[1])||null});
 }
 return {ruleVersion:VERSION,day:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),generatedAt:now.toISOString(),source:SOURCE,period:'weekly',totalRanked:valid,items,method:'GitHub Trending 周榜公开页面，按名称/简介关键词保留 AI 相关项目，维持原榜名次；不是 GitHub 官方 AI 专榜。'};
}
async function collect(fetcher=fetch){const r=await fetcher(SOURCE,{headers:{'User-Agent':'Nexus-Brain-Discovery',Accept:'text/html'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Trending HTTP '+r.status);return parseTrending(await r.text());}
module.exports={SOURCE,VERSION,parseTrending,collect};
