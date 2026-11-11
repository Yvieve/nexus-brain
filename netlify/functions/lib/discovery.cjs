const rules=require('../../../github-rules.js');
async function collect(fetcher=fetch,now=new Date()){
 const deadline=AbortSignal.timeout(18000),repositories=[];
 for(const q of rules.queries(now)){
  const url=new URL('https://api.github.com/search/repositories');url.searchParams.set('q',q);url.searchParams.set('sort','stars');url.searchParams.set('order','desc');url.searchParams.set('per_page','100');
  const headers={Accept:'application/vnd.github+json','User-Agent':'Nexus-Brain-Discovery','X-GitHub-Api-Version':'2022-11-28'};
  if(process.env.GITHUB_READ_TOKEN)headers.Authorization='Bearer '+process.env.GITHUB_READ_TOKEN;
  const response=await fetcher(url,{headers,signal:AbortSignal.any([deadline,AbortSignal.timeout(6000)])});
  if(!response.ok)throw Error('GitHub discovery failed: HTTP '+response.status);
  const data=await response.json();if(data.incomplete_results||!Array.isArray(data.items))throw Error('GitHub returned incomplete search results');repositories.push(...data.items);
 }
 return rules.buildPayload(repositories,now);
}
module.exports={...rules,collect};
