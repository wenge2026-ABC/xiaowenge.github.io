// Supabase 配置
console.log('加载 Supabase 配置...');

const SUPABASE_URL = 'https://bfgdwbkpjfhyossyojyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ2R3YmtwamZoeW9zc3lvanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTEyNzAsImV4cCI6MjA5MDI4NzI3MH0.iRe_lKMspgMEiYT0sCkQp7SiItqOmVOG7_Ljj317im4';

// 检查 Supabase SDK 是否加载
let supabase;
let retryCount = 0;
const maxRetries = 3;

function initSupabase() {
    try {
        // 尝试不同的全局变量名（不同CDN可能不同）
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase;
        } else if (typeof window.supabaseClient !== 'undefined') {
            supabase = window.supabaseClient;
        } else {
            throw new Error('Supabase SDK 未加载，请刷新页面重试');
        }
        
        console.log('✅ Supabase SDK 已加载');
        
        // 初始化 Supabase
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase 初始化成功');
        
        // 导出配置
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase 配置已导出');
        
        // 移除错误提示（如果存在）
        const errorDiv = document.getElementById('supabase-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        // 触发初始化事件
        if (typeof window.initApp === 'function') {
            window.initApp();
        }
        
    } catch (error) {
        console.error('❌ Supabase 初始化失败:', error);
        retryCount++;
        
        if (retryCount < maxRetries) {
            console.log(`⏳ 正在重试 (${retryCount}/${maxRetries})...`);
            setTimeout(initSupabase, 1000 * retryCount); // 递增延迟
        } else {
            console.error('详细信息:', error.message);
            // 显示错误信息但不阻塞页面
            showSupabaseError(error.message);
        }
    }
}

function showSupabaseError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'supabase-error';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        text-align: center;
        max-width: 90%;
    `;
    errorDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Supabase 加载失败</div>
        <div style="font-size: 14px; margin-bottom: 12px;">${message}</div>
        <button onclick="location.reload()" style="background: white; color: #ef4444; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;">
            刷新页面
        </button>
    `;
    document.body.appendChild(errorDiv);
}

// 延迟初始化，确保SDK加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initSupabase, 100);
    });
} else {
    setTimeout(initSupabase, 100);
}
