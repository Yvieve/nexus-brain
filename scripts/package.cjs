// A reproducible ZIP creator using the environment's Python standard library.
const{execFileSync}=require('node:child_process');const path=require('node:path');
execFileSync('node',[path.join(__dirname,'build.cjs')],{stdio:'inherit'});
execFileSync('python3',['-c',String.raw`
from pathlib import Path
import zipfile
root=Path.cwd();dist=root/'dist';out=root.parent
with zipfile.ZipFile(out/'nexus-demo-polished.zip','w',zipfile.ZIP_DEFLATED) as z:
 z.write(dist/'demo.html','index.html')
 for name in ['demo-config.js','department-skills.js','department-skills.css','studio-core.js','curated-skills.js','github-rules.js','account-recovery.js','image-tool.js','trending-snapshot.json','hero.jpg','logo.png']:z.write(dist/name,name)
with zipfile.ZipFile(out/'nexus-account-preview.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in dist.iterdir():
  if p.is_file():z.write(p,p.name)
with zipfile.ZipFile(out/'nexus-delivery-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in root.rglob('*'):
  rel=p.relative_to(root)
  if p.is_file() and not any(x in rel.parts for x in ['.git','dist','node_modules','.netlify','__pycache__']) and (not p.name.startswith('.env') or p.name=='.env.example'):z.write(p,Path('nexus-brain')/rel)
print('Packaged demo-only, account-enabled static preview and full source separately.')
`],{cwd:path.resolve(__dirname,'..'),stdio:'inherit'});
