> 最新 AI 接入说明见 [AI-INTEGRATION.md](AI-INTEGRATION.md)。问答、悬浮助手、资料分析、知识库建议、合并草稿与个人助手执行已使用服务端模型接口。后文早期“预留接口/非 AI”描述属于历史阶段，以此文档为准；模型密钥禁止填写到前端配置。

# Nexus Brain：每日 GitHub 精选与个人 Skill / Agent 工坊

本轮直接修改原仓库 `/workspace/nexus-brain`，保留原首页、顶部导航、内联 CSS、Supabase 邮箱登录和已有资料功能。只新增首页跳转入口和两个板块；未推送或部署线上。

## 1. 每日 GitHub 精选

- `#skill-discovery`：原有各部门 + 独立站运营，可筛选仓库、查看 Star / 许可证 / 推荐原因 / 来源链接。
- `github-daily.cjs`：Netlify 定时任务，每天 UTC 01:10 / 北京时间 09:10，执行 4 次固定公开搜索，再对所有部门进行关键词匹配，去重、排序、选最多 8 项。
- 仅搜索公开名称、简介、topics，不访问内部文件、个人对话，也不抓取或执行仓库指令。
- 搜索范围：近 180 天活跃、非 fork/归档、至少 5 Stars 的 agent / agent-skills / automation / llm topic。不是 GitHub Trending 官方榜、人工审核或 Star 日增长榜。
- 完整结果以单行快照写入新表。失败不发布部分结果；页面可显示上次成功快照并明确标记过期。无结果、未初始化、失效登录和网络失败都有明确提示，不用演示项目冒充实时推荐。
- 员工刷新只读取快照，不能触发 GitHub 抓取或写共享表。只有服务端定时任务使用 service_role 写入。

## 2. 个人 Skill / Agent 工坊

- `#personal-studio`：使用原 Supabase 会话，不另做账号、不用 localStorage 昵称冒充身份。
- 通过目标、输入、步骤、输出、边界和脱敏示例的多轮对话整理经验；至少完成前 5 项后可以总结。
- 创建个人记录，逐轮云端保存，修改名称/类型/部门，撤回上一轮，追加改进意见，再次总结，重新打开或导出 JSON，删除自己的记录。
- 本轮为规则引导和结构化总结，不调用大模型，不微调模型，也不自主执行 Agent。原 AI_API_ENABLED=false 保持不变。
- 真实云端表 `personal_agents` 绑定 auth.users，RLS 限制仅本人读写；不是此前副本中的本地发布预览。账号切换/退出立即清空前一个人的界面，不把对话缓存在浏览器。
- 保存失败保留输入且不显示成功；revision 乐观并发校验防止静默覆盖另一设备的修改。展示 vN 是当前记录的修订号，不是完整历史版本列表。
- 导出含个人经验和示例，需妥善保存。请勿输入密码、密钥或无权处理的资料。

## 启用前需要完成的实际步骤

### A. Supabase 新增表

在你现有项目的 SQL Editor 执行：
`supabase/migrations/20261110_department_skills.sql`

只新增 `github_daily_digest`、`personal_agents`、对应索引/策略和 revision 触发器；不修改原 resources/profiles、原账号、存储桶或原资料。迁移包含事务，可重复执行。先在测试项目验证，再应用正式项目。当前没有数据库管理凭据，本轮未向线上执行迁移，亦未做线上数据库备份。

### B. Netlify 服务端环境变量

见 `.env.example`：

| 名称 | 用途 |
| --- | --- |
| SUPABASE_URL | 与 config.js 同一个项目地址 |
| SUPABASE_ANON_KEY | 同项目 publishable/anon key，读取时仍附带员工会话 |
| SUPABASE_SERVICE_ROLE_KEY | 只在每日任务服务端使用，绝不能写进 config.js 或网页 |
| GITHUB_READ_TOKEN | 可选，GitHub 公开仓库只读 token；不用时受匿名搜索速率限制 |

不要把私钥或 token 发到聊天。仅在 Netlify 环境变量安全填写。普通员工浏览器不接收 service_role 或 GitHub token。

### C. 部署与首次初始化

`node scripts/build.cjs` 仅构建 7 个公开资源到 dist。Netlify 按 netlify.toml 单独打包 functions，Node.js 22。不能只用 ZIP 静态上传而遗漏函数。

通过 Netlify Git 集成部署，或配置好授权的 Netlify CLI 使用 `deploy --build`。定时任务只有在 Netlify 正式部署才自动运行；预览部署不会启动日程。在 Netlify 定时函数管理中首次运行 `github-daily`，确认成功后登录查看每日快照。部署项目必须允许访问 api.github.com 及自己的 Supabase 域名。

原 GitHub Actions 的纯静态 ZIP 发布不能包含新函数，已改成 Netlify CLI 打包；同时改为 workflow_dispatch 手动发布，防止未来推送直接覆盖原网站。本轮没有推送、触发 workflow 或上线。

### 当前外部阻塞

云开发环境的 GitHub API 访问被代理以 403 拒绝，现已在环境配置草稿中追加 api.github.com（保留所有已有域名）。需在云环境设置中审阅、保存并发布环境配置后才能联调；这不是发布原网站。定时抓取和真实线上账号联调尚未验证。当前浏览器测试使用模拟服务，不将测试数据写到生产库。

## 验证

```
node --test tests/features.test.cjs
node scripts/build.cjs
python3 -m http.server 8003 --bind 127.0.0.1
node tests/browser.cjs
bash scripts/test-rls.sh
```

- 11 项 Node 逻辑/服务测试：对话总结、输入限制、上海日期、部门相关性/去重、固定公开查询、认证、过期快照和未配置状态。
- 浏览器：保留原首页，候选内容安全渲染，真实会话接口形状下的保存/总结/重开，失败输入保留、A/B 账号切换和登出清空、手机无横向溢出。身份和服务端均为模拟，并非线上登录测试。
- 隔离 PostgreSQL 16：实际执行迁移两次；验证本人 CRUD、跨用户读/改/删禁止、伪造 owner 禁止、匿名禁止、revision 冲突、员工只能读精选、服务端才能写精选。测试容器无网络/无发布端口，结束后自动移除；未操作线上 Supabase。
- 对比确认原 header、hero 标题、原内联 CSS 未变。

## 备份与恢复

恢复点：Git 标签 `backup/before-department-skills-20261110`，原提交 `4a323c27d951d5fba9e438e39bf1065f63b99487`。

完整 checkout（含 Git 元数据）和已验证 Git bundle 保存在 `/workspace/backups/nexus-brain-20261110/`。备份在任何修改之前创建；用户最初上传的压缩包也保留。

如需恢复，优先将 `checkout.tar.gz` 解压到一个新的空目录，核对后替换，避免覆盖当前有价值的修改；或基于恢复标签建立恢复分支。不要盲目 git reset --hard / git clean。数据库迁移当前未上线；未来如已上线，代码恢复并不会删除新表，新表可保留闲置。删除新表前必须先备份个人记录。代码回退不等于恢复线上数据库。

## 比赛体验入口（本轮新增）

构建后有两个完全分开的入口：

- `index.html`：原有登录和真实云端功能，原页面和 Supabase 账号体系不变。
- `demo.html`：免登录比赛体验。构建时使用单独的 `demo-config.js`，不加载 Supabase SDK、外部字体，不初始化真实账号、数据库或模型。页面固定显示演示标识。

体验页精选为明确标注的来源示例，不是今日实时结果；个人工坊可载入完整脱敏示例、逐轮补充、撤回、总结、改名、导出和删除。数据仅保存在当前浏览器的 sessionStorage，刷新可继续，关闭浏览器会话可能清除；不能跨设备共享，不代表正式账号。

`nexus-competition-preview.zip` 是独立静态演示发布包，其 index.html 即免登录体验页，可部署在新的静态站点，访客点链接即可操作。不包含原生产 config.js、API 密钥或数据库连接配置。部署时不要拖到原站点，否则会覆盖原站。正式项目仍需带服务端函数的完整部署。

`nexus-competition-demo.mp4` 是自动录制的无配音操作短视频，展示明确标注的演示流程，不是真实大模型调用。可作为比赛视频素材；旁白建议依次说明“保留原平台—按部门发现方法—载入个人复盘模板—补充自己的规则—总结并导出”。

新增测试：`PLAYWRIGHT_BROWSERS_PATH=/workspace/playwright-browser node tests/demo.cjs`。验证零外部请求、访客体验、示例标注、追加改进、JSON 导出、刷新保持和手机适配；同时生成 WebM 操作录屏。FFmpeg 路径是当前云环境的运行配置，不是产品依赖。

当前未部署：云环境没有 NETLIFY_AUTH_TOKEN。需要在安全环境设置中配置部署授权或由拥有站点权限的人上传独立静态包。不要将 token 发到聊天。原站未覆盖。

## 2026-11-11 真实 AI 联调准备

新增 `studio-ai.cjs`，前端可选择引导式/真实 AI（默认仍为引导式）。真实调用要求已登录、演示用户 UUID 白名单、发送内容确认；服务端只读取该用户自己的记录。模型通过服务端 OpenAI 兼容 Chat Completions 调用；密钥不进入页面。回复和总结仍通过原账号持久化。演示入口 demo.html 无论选择什么模式都不会调用模型。

新增 `20261111_ai_demo_quota.sql`：仅服务端可预留额度，3 次/分钟/人、全项目累计 60 次，失败也占名额。这不是人民币费用保证，仍应设置供应商预算。禁止普通员工直接调用额度 RPC。

今日详细操作、环境变量及录屏验收见 TODAY-CHECKLIST.md；一次性新增表脚本是 scripts/SETUP-TODAY.sql。当前尚未获得真实模型配置、未执行线上迁移、没有真实账号联调录像。不能将模拟测试视频当作真实 API 已接通的证据。

已验证 15 项 Node 测试、实际隔离 PostgreSQL 权限与额度测试、浏览器模拟供应商下的真实 AI 模式 UI 路径。未产生真实供应商费用。

## 邮件密码恢复

登录框新增忘记密码：先填写原账号邮箱，调用 Supabase resetPasswordForEmail，回跳本正式站根地址。需在 Supabase Authentication → URL Configuration → Redirect URLs 中允许 https://brilliant-blini-c611ea.netlify.app/，保留原有地址。收到 PASSWORD_RECOVERY 后显示新密码表单，要求两次一致且至少8位；通过有效恢复会话 updateUser 后清空密码字段。演示入口不发送邮件。真实邮件送达、限额及回跳仍需用户实际验证。不要共享恢复链接或密码。

## 精选推荐产品修正

原 GitHub 自动发现算法是公开元数据关键词匹配加 Star 排序，现明确归入“每日新发现”候选。默认改为“精选推荐”：curated-skills.js 中按岗位任务维护的场景清单，提供中文用途、输入、产出、开始步骤和接入条件。包括表格处理、SOP、课件、网站验收、工作流、文档解析和浏览器 Agent；不是已在本站安装的工具，也没有承诺完整安全/业务验证。已通过 HTTP HEAD 核验七个公开来源链接可访问，未下载或执行其代码。

静态站也可直接浏览精选，不需要登录、服务器函数或模型。每日候选仍需要正式后台任务；失败或返回 HTML 时只显示友好状态，不再把原始 JSON 解析错误、SQL 文件路径、RLS 术语或部署日程展示给普通用户。不会用静态精选假装今日实时数据。

新增 `tests/curated.cjs` 验证部门覆盖、排序、场景用法、筛选、HTML 错误友好处理、手机布局和开发文案清理。catalog 是编辑维护的推荐清单，不是自动阅读/运行仓库代码的评测系统。

## 当前生效：简化页面与 Trending（取代部门关键词 / Star 门槛榜）

前端“GitHub 热门”只保留搜索、刷新、原项目卡片和完整周榜链接。服务端 github-daily 现在使用 lib/trending.cjs 读取 https://github.com/trending?since=weekly，而不是旧搜索 API。筛选公开名称/简介中的 AI 相关关键词，保留原榜名次；累计 Star 与周增量分别显示，页面未提供的数据留空，不补造数字。不再强制 1000 Star。标签是“周榜中的 AI 相关项目”，不是 GitHub 官方 AI 专榜。

公开页面解析结构变化或读取失败时不覆盖数据库旧结果。数据格式版本升为3，旧版本快照不能冒充 Trending。trending-snapshot.json 为本次实际读取的公开周榜快照，含来源与采集时间，可在静态站读取；不是实时抓取承诺。正式后台快照优先，未部署时回退到包内真实来源快照。下一次公开数据更新需要重新采集打包，或完整部署每日任务。旧 github-rules.js 和 lib/discovery.cjs 为前一版实现，已不在当前每日任务链路中。

个人工坊改为聊天优先：可直接输入需求自动新建记录，发送和“生成并保存”是主操作；名称/类型/部门、指令和导出收进折叠区。真实 AI 模式为默认意图，但前端 STUDIO_AI_UI_ENABLED=false、服务端 STUDIO_AI_ENABLED 未配置时不会调用模型。用户可明确选择“体验引导式整理”，与真实 AI 区分。演示入口自动选择引导模式，不收费。后续联调通过后再启用前后端开关，不把预设问题当模型响应。

无需新数据库迁移；继续使用此前 personal_agents / github_daily_digest。实际 AI 与线上数据库联调状态仍以 TODAY-CHECKLIST 为准。

## 图片需求处理修正

固定问卷不再被描述为自然语言理解能力，入口明确标为“流程问卷（非 AI）”。对于已支持的图片压缩关键词，聊天发送直接打开本地图片工具，并提供独立按钮，不要求员工填写压缩步骤。其他任意工具仍不能靠固定问卷自动创建，真实模型和受控工具执行需要另行接通。

image-tool.js：浏览器本地处理，最多10MB/1600万像素。PNG像素保真模式将导出重新解码，与浏览器解码后的源像素逐字节比较，验证成功且文件更小才提供优化结果；不保证保留色彩配置、EXIF等全部原元数据，不保证每张图片均能缩小。JPG/WebP体积优先模式为有损WebP，不宣称质量完全不变；若结果更大则保留原文件。图片不进入对话记录或服务器。动画图片不属于此工具的预期使用范围。

测试 tests/image-tool.cjs 验证意图路由、PNG像素检查、有效减小、JPG保真请求拒绝、下载与零外部请求。
