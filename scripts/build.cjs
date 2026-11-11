const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');fs.rmSync(out,{force:true,recursive:true});fs.mkdirSync(out);
for(const file of ['index.html','config.js','department-skills.js','department-skills.css','studio-core.js','curated-skills.js','github-rules.js','account-recovery.js','image-tool.js','trending-snapshot.json','hero.jpg','logo.png'])fs.copyFileSync(path.join(root,file),path.join(out,file));
console.log('Built public assets only. Netlify bundles functions separately.');
// Separate, explicit demo entry. Never changes the production configuration.
let demo=fs.readFileSync(path.join(root,'index.html'),'utf8');
demo=demo.replace(/<script src="https:\/\/cdn.jsdelivr.net\/npm\/@supabase\/supabase-js@2"><\/script>/,'');
demo=demo.replace(/<link[^>]+(?:fonts.googleapis.com|fonts.gstatic.com)[^>]*>/g,'');
demo=demo.replace('src="config.js"','src="demo-config.js"');
demo=demo.replace('<body id="top">','<body id="top"><div class="ns-demo-banner">比赛演示模式 · 示例数据 · 不连接真实账号或数据库 · 未调用大模型 <a href="#personal-studio">开始体验个人工坊 →</a></div>');
demo=demo.replace('if(!done){ setTimeout', 'if(!done&&!SUP.DEMO_MODE){ setTimeout');
demo=demo.replace('  await load();','  if(!SUP.DEMO_MODE)await load();').replace('if(u){ CURRENT_USER=u;', 'if(u&&!SUP.DEMO_MODE){ CURRENT_USER=u;');
fs.writeFileSync(path.join(out,'demo.html'),demo);
fs.writeFileSync(path.join(out,'demo-config.js'),'window.NEXUS_CONFIG={DEMO_MODE:true,DEMO_SEED_ENABLED:false,AI_API_ENABLED:false,SUPABASE_URL:"",SUPABASE_ANON_KEY:""};');
