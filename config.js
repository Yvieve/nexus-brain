// ============================================
// Nexus Brain 连接配置
// 从 Supabase 控制台 → Project Settings → API 获取
// ============================================
window.NEXUS_CONFIG = {
  SUPABASE_URL: "https://tmqtlvjpftqfvcblearm.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_G8vvJj6hQJcAW2Oj3TYnaA_gzi99Ioo",

  // 模型密钥和供应商配置只存于 Netlify 服务端环境变量。
  DEMO_SEED_ENABLED: false,
  STUDIO_AI_UI_ENABLED: false, // 登录后由服务端状态检查更新
  GITHUB_DISCOVERY_URL: "/.netlify/functions/github-discover"
};
