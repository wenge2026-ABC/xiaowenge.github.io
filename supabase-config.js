// Supabase 配置
console.log('加载 Supabase 配置...');

const SUPABASE_URL = 'https://bfgdwbkpjfhyossyojyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ2R3YmtwamZoeW9zc3lvanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTEyNzAsImV4cCI6MjA5MDI4NzI3MH0.iRe_lKMspgMEiYT0sCkQp7SiItqOmVOG7_Ljj317im4';

// 检查 Supabase SDK 是否加载
let supabase;
try {
    // 尝试不同的全局变量名（不同CDN可能不同）
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase;
    } else if (typeof window.supabaseClient !== 'undefined') {
        supabase = window.supabaseClient;
    } else {
        throw new Error('Supabase SDK 未找到，请检查网络连接');
    }
    
    console.log('✅ Supabase SDK 已加载');
    
    // 初始化 Supabase
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase 初始化成功');
    
    // 导出配置
    window.supabaseClient = supabaseClient;
    console.log('✅ Supabase 配置已导出');
} catch (error) {
    console.error('❌ Supabase 初始化失败:', error);
    console.error('详细信息:', error.message);
    alert('Supabase 初始化失败: ' + error.message + '\n\n请检查网络连接，或刷新页面重试');
}
