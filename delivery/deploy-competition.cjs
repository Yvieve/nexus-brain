const fs=require('node:fs');
const TARGET='brilliant-blini-c611ea';
const startedAt=new Date().toISOString();
const record={target:TARGET,startedAt,commit:process.env.GITHUB_SHA||null,status:'pending'};
async function request(path,method='GET',body,contentType='application/json'){
 const token=process.env.NETLIFY_AUTH_TOKEN;if(!token)throw Error('NETLIFY_AUTH_TOKEN is not configured in repository Actions secrets');
 const response=await fetch('https://api.netlify.com/api/v1'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':contentType},body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('Netlify API HTTP '+response.status);
 return response.json();
}
(async()=>{try{
 const site=await request('/sites/'+TARGET+'.netlify.app');
 if(site.name!==TARGET||new URL(site.ssl_url||site.url).hostname!==TARGET+'.netlify.app'||!site.id)throw Error('Target verification failed; no deployment made');
 record.siteId=site.id;
 const {execFileSync}=require('node:child_process');
 const output=execFileSync('npx',['--yes','netlify-cli@17','deploy','--build','--prod','--site',site.id,'--json'],{encoding:'utf8',maxBuffer:5000000,env:process.env});
 let result;for(let i=0;i<output.length;i++){if(output[i]==='{'){try{result=JSON.parse(output.slice(i));if(result.deploy_id)break;}catch{}}}
 if(!result?.deploy_id)throw Error('Deployment CLI did not return a verifiable deployment ID');
 const deploy=await request('/deploys/'+encodeURIComponent(result.deploy_id));record.deployId=deploy.id;
 if(deploy.state!=='ready')throw Error('Full deployment is not ready');
 const check=await request('/sites/'+encodeURIComponent(site.id));
 if(check.published_deploy?.id!==deploy.id)throw Error('Draft uploaded but production publication not confirmed; check deploy lock');
 const response=await fetch('https://'+TARGET+'.netlify.app/?verify='+deploy.id,{signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache'}});
 const html=await response.text();if(!response.ok||!html.includes('GitHub 热门')||!html.includes('创建我的 Skill / Agent')||!html.includes('image-tool.js'))throw Error('Published page did not pass content verification');
 const endpoint=await fetch('https://'+TARGET+'.netlify.app/.netlify/functions/studio-status',{signal:AbortSignal.timeout(20000)});const aiStatus=await endpoint.json();if(!endpoint.ok||aiStatus.service!=='nexus-studio')throw Error('Server function verification failed');record.aiStatusMessage=aiStatus.message;record.aiConfigurationPresent=aiStatus.message==='请先登录';
 for(const name of ['knowledge-ai','studio-ai']){const check=await fetch('https://'+TARGET+'.netlify.app/.netlify/functions/'+name,{signal:AbortSignal.timeout(20000)});const body=await check.json();if(check.status!==405||body.error!=='仅支持 POST')throw Error('AI endpoint deployment check failed: '+name);}record.knowledgeFunctionsVerified=true;
 record.functionsVerified=true;record.status='published';record.url='https://'+TARGET+'.netlify.app/';console.log('Independent competition preview published and verified');
 }catch(error){record.status='failed';record.error=error.message;console.error(error.message);process.exitCode=1;}finally{record.finishedAt=new Date().toISOString();fs.writeFileSync('delivery/deployment-result.json',JSON.stringify(record,null,2));}})();

// Retry after repository credential update: 2026-11-11T11:55:21.693858+00:00
