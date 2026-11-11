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
 let deploy=await request('/sites/'+encodeURIComponent(site.id)+'/deploys?draft=false','POST',fs.readFileSync('delivery/nexus-login.zip'),'application/zip');
 if(!deploy.id)throw Error('Missing deployment ID');record.deployId=deploy.id;
 for(let i=0;i<60&&deploy.state!=='ready';i++){if(deploy.state==='error')throw Error('Netlify deployment failed');await new Promise(r=>setTimeout(r,2000));deploy=await request('/deploys/'+encodeURIComponent(deploy.id));}
 if(deploy.state!=='ready')throw Error('Deployment not ready within verification window');
 const check=await request('/sites/'+encodeURIComponent(site.id));
 if(check.published_deploy?.id!==deploy.id)throw Error('Draft uploaded but production publication not confirmed; check deploy lock');
 const response=await fetch('https://'+TARGET+'.netlify.app/?verify='+deploy.id,{signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache'}});
 const html=await response.text();if(!response.ok||!html.includes('GitHub 热门')||!html.includes('创建我的 Skill / Agent'))throw Error('Published page did not pass content verification');
 record.status='published';record.url='https://'+TARGET+'.netlify.app/';console.log('Independent competition preview published and verified');
 }catch(error){record.status='failed';record.error=error.message;console.error(error.message);process.exitCode=1;}finally{record.finishedAt=new Date().toISOString();fs.writeFileSync('delivery/deployment-result.json',JSON.stringify(record,null,2));}})();

// Retry after repository credential update: 2026-11-11T11:55:21.693858+00:00
