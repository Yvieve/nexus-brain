// ============================================
// Nexus Brain 连接配置
// 从 Supabase 控制台 → Project Settings → API 获取
// ============================================
window.NEXUS_CONFIG = {
  SUPABASE_URL: "https://tmqtlvjpftqfvcblearm.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_G8vvJj6hQJcAW2Oj3TYnaA_gzi99Ioo",

  // ============================================
  // AI 智能层接口（预留）
  // 当前 AI_API_ENABLED=false → 平台使用【本地启发式】运行
  // 所有 AI 功能（主动洞察 / 可信度 / 过期 / 合并 / 成长 / 学习沉淀），
  // 无需任何外部 API 即可演示。
  // —— 后续接入真实大模型（如自建/第三方 LLM）：
  //   1) 把 AI_API_ENABLED 改为 true
  //   2) 填入 AI_API_URL 与 AI_API_KEY
  //   3) 在 index.html 的 AIEngine 各方法中，
  //      将标注 `// LOCAL_FALLBACK` 的分支替换为对 AI_API_URL 的调用即可，
  //      UI 与数据流无需改动。
  // ============================================
  DEMO_SEED_ENABLED: false, // 不自动写入演示资料；不影响现有资料
  STUDIO_AI_UI_ENABLED: false, // 接入服务端并完成验收后再启用
  GITHUB_DISCOVERY_URL: "/.netlify/functions/github-discover",
  AI_API_ENABLED: false,
  AI_API_URL: "",   // 例如 "https://your-llm-endpoint/v1/chat/completions"
  AI_API_KEY: ""    // 仅在 AI_API_ENABLED=true 时使用，切勿提交到公开仓库
};
