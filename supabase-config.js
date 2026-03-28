// Supabase 配置 - 调试版本
console.log('加载 Supabase 配置...');

const SUPABASE_URL = 'https://bfgdwbkpjfhyossyojyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ2R3YmtwamZoeW9zc3lvanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTEyNzAsImV4cCI6MjA5MDI4NzI3MH0.iRe_lKMspgMEiYT0sCkQp7SiItqOmVOG7_Ljj317im4';

// 检查 Supabase SDK 是否加载
if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase SDK 未加载！请检查网络连接');
    alert('错误：Supabase SDK 未加载，请刷新页面或检查网络');
} else {
    console.log('✅ Supabase SDK 已加载');
}

try {
    // 初始化 Supabase
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase 初始化成功');
    
    // 导出配置
    window.supabaseClient = supabase;
    console.log('✅ Supabase 配置已导出');
} catch (error) {
    console.error('❌ Supabase 初始化失败:', error);
    alert('Supabase 初始化失败: ' + error.message);
}
