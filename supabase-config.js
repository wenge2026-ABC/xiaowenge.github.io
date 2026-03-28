// Supabase 配置
const SUPABASE_URL = 'https://bfgdwbkpjfhyossyojyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ2R3YmtwamZoeW9zc3lvanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTEyNzAsImV4cCI6MjA5MDI4NzI3MH0.iRe_lKMspgMEiYT0sCkQp7SiItqOmVOG7_Ljj317im4';

// 初始化 Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 导出配置
window.supabaseClient = supabase;
