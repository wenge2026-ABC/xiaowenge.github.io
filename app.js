// ===== 纯前端版本 - 使用 localStorage =====
// 这个版本不依赖 Supabase 和 CDN，完全在本地运行

console.log('🚀 纯前端版本启动 - 使用 localStorage');

// ===== 全局状态 =====
const state = {
  currentPage: 'home',
  posts: [],
  photos: [],
  files: [],
  currentPhotoIndex: 0,
  tempCoverFile: null,
  currentUser: null,  // 模拟登录用户
  authMode: 'login'
};

// ===== 工具函数 =====
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const formatDate = date => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatFileSize = bytes => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (type, name) => {
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📄';
  if (type.includes('word')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
  if (type.includes('zip') || type.includes('compressed')) return '📦';
  const ext = name.split('.').pop().toLowerCase();
  if (['mp4', 'mov', 'avi', 'wmv'].includes(ext)) return '🎬';
  if (['mp3', 'wav', 'flac'].includes(ext)) return '🎵';
  if (['ppt', 'pptx'].includes(ext)) return '📊';
  return '📁';
};

// ===== 时间显示函数 =====
const updateDateTime = () => {
  const now = new Date();
  
  // 格式化时间（时:分:秒）
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;
  
  // 格式化日期（年月日 星期）
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[now.getDay()];
  const dateStr = `${year}年${month}月${day}日 ${weekday}`;
  
  // 更新显示
  const timeElement = $('#current-time');
  const dateElement = $('#current-date');
  
  if (timeElement) timeElement.textContent = timeStr;
  if (dateElement) dateElement.textContent = dateStr;
};

// 启动时间更新
const startClock = () => {
  updateDateTime(); // 立即更新一次
  setInterval(updateDateTime, 1000); // 每秒更新
};

const generateId = () => 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// ===== LocalStorage 数据库 =====
class LocalDatabase {
  constructor() {
    this.storageKey = 'wenge_website_data';
    this.initData();
  }

  // 初始化数据
  initData() {
    const existingData = localStorage.getItem(this.storageKey);
    if (!existingData) {
      const now = new Date().toISOString();
      const initialData = {
        posts: [
          {
            id: 'post_' + Date.now() + '_1',
            title: '坚持的力量',
            content: `
              <h3>名人名言</h3>
              <blockquote>
                <p>"成功不是终点，失败也不是终结：唯有勇气才是永恒。"</p>
                <footer>—— 温斯顿·丘吉尔</footer>
              </blockquote>
              
              <blockquote>
                <p>"不要等待机会，而要创造机会。"</p>
                <footer>—— 乔治·萧伯纳</footer>
              </blockquote>
              
              <h3>励志感悟</h3>
              <p>生活中，我们常常会遇到各种挑战和困难。但正是这些挑战，让我们变得更加强大。每一次跌倒，都是成长的机会；每一次失败，都是成功的垫脚石。</p>
              
              <p>记住，<strong>坚持</strong>是成功的关键。当你想要放弃的时候，想想当初为什么开始。成功不在于你走了多远，而在于你是否一直在前行。</p>
              
              <blockquote>
                <p>"最困难的时候，也就是离成功不远的时候。"</p>
                <footer>—— 拿破仑</footer>
              </blockquote>
              
              <p>让我们一起努力，用积极的态度面对每一天。相信自己，你一定可以创造属于自己的精彩人生！</p>
            `,
            excerpt: '生活充满挑战，但只要坚持，就一定能看到希望。让我们用积极的态度面对每一天！',
            tags: ['励志', '正能量', '成长'],
            cover: null,
            read_time: 3,
            status: 'published',
            created_at: now,
            updated_at: now,
            author_id: 'demo_user'
          },
          {
            id: 'post_' + Date.now() + '_2',
            title: '梦想与行动',
            content: `
              <h3>关于梦想</h3>
              <blockquote>
                <p>"梦想不会逃跑，逃跑的总是自己。"</p>
                <footer>—— 高桥步</footer>
              </blockquote>
              
              <p>每个人心中都有一个梦想，它或许是遥不可及的，但只要我们勇敢追逐，就一定能实现。</p>
              
              <h3>行动的力量</h3>
              <blockquote>
                <p>"行动是治愈恐惧的良药，而犹豫拖延将不断滋养恐惧。"</p>
                <footer>—— 戴尔·卡耐基</footer>
              </blockquote>
              
              <p>光有梦想是不够的，我们还需要付诸行动。每一小步的积累，终将带我们到达理想的彼岸。</p>
              
              <blockquote>
                <p>"千里之行，始于足下。"</p>
                <footer>—— 老子</footer>
              </blockquote>
              
              <h3>结语</h3>
              <p>梦想不会自动实现，但行动会让它越来越近。今天就开始行动吧，为了更好的明天！</p>
            `,
            excerpt: '梦想需要行动来实现。让我们从今天开始，为了梦想而努力奋斗！',
            tags: ['梦想', '行动', '励志'],
            cover: null,
            read_time: 2,
            status: 'published',
            created_at: now,
            updated_at: now,
            author_id: 'demo_user'
          },
          {
            id: 'post_' + Date.now() + '_3',
            title: '快乐生活的秘诀',
            content: `
              <h3>珍惜当下</h3>
              <blockquote>
                <p>"生活中最大的幸福是坚信有人爱我们。"</p>
                <footer>—— 维克多·雨果</footer>
              </blockquote>
              
              <p>我们常常追求更多，却忽略了已经拥有的。学会感恩，珍惜身边的人和事，这是快乐的源泉。</p>
              
              <h3>积极心态</h3>
              <blockquote>
                <p>"乐观的人在每个危机里看到机会，悲观的人在每个机会里看见危机。"</p>
                <footer>—— 温斯顿·丘吉尔</footer>
              </blockquote>
              
              <p>心态决定一切。用积极的眼光看待生活，你会发现世界变得更加美好。</p>
              
              <blockquote>
                <p>"笑口常开，好运自然来。"</p>
                <footer>—— 中国谚语</footer>
              </blockquote>
              
              <h3>简单生活</h3>
              <p>快乐其实很简单，一杯热茶、一本好书、一个温暖的拥抱，都是生活中的小确幸。</p>
              
              <blockquote>
                <p>"简单生活，高尚思想。"</p>
                <footer>—— 威廉·华兹华斯</footer>
              </blockquote>
              
              <p>让我们一起，用简单的心，过快乐的生活！</p>
            `,
            excerpt: '快乐其实很简单，学会感恩，珍惜当下，用积极的心态面对生活！',
            tags: ['快乐', '生活', '心态'],
            cover: null,
            read_time: 2,
            status: 'published',
            created_at: now,
            updated_at: now,
            author_id: 'demo_user'
          }
        ],
        photos: [
          {
            id: 'photo_' + Date.now() + '_1',
            name: '笑容灿烂的金毛',
            url: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=300&fit=crop',
            caption: '金毛灿烂的笑容太治愈了！阳光活泼的大宝贝 🐕😊',
            created_at: now
          },
          {
            id: 'photo_' + Date.now() + '_4',
            name: '憨笑的哈士奇',
            url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
            caption: '二哈憨憨的笑容，总是能带给人快乐！😂🐺',
            created_at: now
          }
        ],
        files: [],
        users: []
      };
      localStorage.setItem(this.storageKey, JSON.stringify(initialData));
    }
  }

  // 获取所有数据
  getAllData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : { posts: [], photos: [], files: [], users: [] };
  }

  // 保存所有数据
  saveAllData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // 用户认证（模拟）
  signUp(username, email, password) {
    return new Promise((resolve) => {
      const data = this.getAllData();
      
      // 检查用户是否已存在
      const existingUser = data.users.find(u => u.email === email);
      if (existingUser) {
        resolve({ error: { message: '用户已存在' }, data: null });
        return;
      }

      // 创建新用户
      const newUser = {
        id: generateId(),
        username,
        email,
        password,  // 注意：实际项目中不应该明文存储密码
        created_at: new Date().toISOString()
      };

      data.users.push(newUser);
      this.saveAllData(data);

      // 模拟延迟
      setTimeout(() => {
        resolve({ data: { user: newUser }, error: null });
      }, 500);
    });
  }

  signIn(email, password) {
    return new Promise((resolve) => {
      const data = this.getAllData();
      
      // 查找用户
      const user = data.users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        // 如果没有用户，创建默认用户（首次使用）
        if (data.users.length === 0) {
          const defaultUser = {
            id: generateId(),
            username: '管理员',
            email: email || 'admin@local.com',
            password: password || '123456',
            created_at: new Date().toISOString()
          };
          data.users.push(defaultUser);
          this.saveAllData(data);
          
          setTimeout(() => {
            resolve({ data: { user: defaultUser }, error: null });
          }, 500);
          return;
        }
        
        resolve({ error: { message: '邮箱或密码错误' }, data: null });
        return;
      }

      setTimeout(() => {
        resolve({ data: { user }, error: null });
      }, 500);
    });
  }

  signOut() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ error: null });
      }, 300);
    });
  }

  // 获取当前用户
  getCurrentUser() {
    return state.currentUser;
  }

  // Posts 操作
  fetchPosts() {
    return new Promise((resolve) => {
      const data = this.getAllData();
      setTimeout(() => {
        resolve(data.posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }, 200);
    });
  }

  createPost(post) {
    return new Promise((resolve) => {
      const data = this.getAllData();
      const newPost = {
        id: generateId(),
        ...post,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      data.posts.push(newPost);
      this.saveAllData(data);
      
      setTimeout(() => {
        resolve(newPost);
      }, 300);
    });
  }

  updatePost(id, updates) {
    return new Promise((resolve) => {
      const data = this.getAllData();
      const index = data.posts.findIndex(p => p.id === id);
      
      if (index === -1) {
        resolve(null);
        return;
      }
      
      data.posts[index] = {
        ...data.posts[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      this.saveAllData(data);
      
      setTimeout(() => {
        resolve(data.posts[index]);
      }, 300);
    });
  }

  deletePost(id) {
    return new Promise((resolve) => {
      const data = this.getAllData();
      data.posts = data.posts.filter(p => p.id !== id);
      this.saveAllData(data);
      
      setTimeout(() => {
        resolve({ error: null });
      }, 300);
    });
  }

  // Photos 操作
  async uploadPhoto(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = this.getAllData();
        const photo = {
          id: generateId(),
          url: e.target.result,
          name: file.name,
          type: file.type,
          size: file.size,
          created_at: new Date().toISOString()
        };
        
        data.photos.push(photo);
        this.saveAllData(data);
        
        setTimeout(() => {
          resolve(photo);
        }, 500);
      };
      reader.readAsDataURL(file);
    });
  }

  fetchPhotos() {
    return new Promise((resolve) => {
      const data = this.getAllData();
      setTimeout(() => {
        resolve(data.photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }, 200);
    });
  }

  deletePhoto(id) {
    return new Promise((resolve) => {
      const data = this.getAllData();
      data.photos = data.photos.filter(p => p.id !== id);
      this.saveAllData(data);
      
      setTimeout(() => {
        resolve({ error: null });
      }, 300);
    });
  }

  // Files 操作
  async uploadFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = this.getAllData();
        const fileData = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: e.target.result,
          created_at: new Date().toISOString()
        };
        
        data.files.push(fileData);
        this.saveAllData(data);
        
        setTimeout(() => {
          resolve(fileData);
        }, 500);
      };
      reader.readAsDataURL(file);
    });
  }

  fetchFiles() {
    return new Promise((resolve) => {
      const data = this.getAllData();
      setTimeout(() => {
        resolve(data.files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }, 200);
    });
  }

  deleteFile(id) {
    return new Promise((resolve) => {
      const data = this.getAllData();
      data.files = data.files.filter(f => f.id !== id);
      this.saveAllData(data);
      
      setTimeout(() => {
        resolve({ error: null });
      }, 300);
    });
  }
}

// ===== 初始化数据库 =====
const db = new LocalDatabase();

// ===== 初始化 =====
async function init() {
  console.log('🔧 开始初始化...');
  
  try {
    // 启动时钟
    console.log('1. 启动时钟...');
    startClock();
    console.log('✅ 时钟启动完成');
    
    // 加载数据
    console.log('2. 加载数据...');
    await loadAllData();
    console.log('✅ 数据加载完成');
    
    console.log('3. 绑定事件...');
    bindEvents();
    console.log('✅ 事件绑定完成');
    
    console.log('3. 导航到首页...');
    navigate('home');
    console.log('✅ 导航完成');
    
    // 检查是否有已登录用户
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      state.currentUser = JSON.parse(savedUser);
      updateAuthUI();
    }
    
    console.log('🎉 网站初始化全部完成！');
  } catch (error) {
    console.error('❌ 初始化过程出错:', error);
    alert('初始化失败: ' + error.message);
  }
}

// ===== 加载所有数据 =====
async function loadAllData() {
  try {
    const [posts, photos, files] = await Promise.all([
      db.fetchPosts(),
      db.fetchPhotos(),
      db.fetchFiles()
    ]);
    
    state.posts = posts;
    state.photos = photos;
    state.files = files;
    
    console.log(`📊 数据加载完成: ${posts.length} 篇文章, ${photos.length} 张照片, ${files.length} 个文件`);
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

// ===== 事件绑定 =====
function bindEvents() {
  // 侧边栏切换
  const navItems = $$('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigate(page);
      
      // 移动端关闭侧边栏
      if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-open');
      }
    });
  });

  // 移动端汉堡菜单
  $('#burger').addEventListener('click', () => {
    document.body.classList.toggle('sidebar-open');
  });

  // 遮罩层点击
  $('#sidebar-overlay').addEventListener('click', () => {
    document.body.classList.remove('sidebar-open');
  });

  // 窗口大小改变
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      document.body.classList.remove('sidebar-open');
    }
  });

  // 新建文章按钮
  $('#btn-new-post').addEventListener('click', () => openPostModal());
  $('#btn-new-post2').addEventListener('click', () => openPostModal());

  // 认证按钮
  $('#btn-auth').addEventListener('click', () => openAuthModal());

  // 模态框关闭
  $('#close-modal-post').addEventListener('click', () => closePostModal());
  $('#close-modal-view').addEventListener('click', () => closeViewModal());
  $('#close-modal-photo').addEventListener('click', () => closePhotoModal());
  $('#close-modal-auth').addEventListener('click', () => closeAuthModal());

  // 点击模态框背景关闭
  $('#modal-post').addEventListener('click', e => {
    if (e.target === $('#modal-post')) closePostModal();
  });
  $('#modal-view').addEventListener('click', e => {
    if (e.target === $('#modal-view')) closeViewModal();
  });
  $('#modal-photo').addEventListener('click', e => {
    if (e.target === $('#modal-photo')) closePhotoModal();
  });
  $('#modal-auth').addEventListener('click', e => {
    if (e.target === $('#modal-auth')) closeAuthModal();
  });

  // 文章表单
  $('#publish-post').addEventListener('click', () => publishPost());
  $('#save-draft').addEventListener('click', () => saveDraft());

  // 搜索
  $('#search-input').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filterPosts(query);
  });

  // 封面上传
  $('#cover-upload-area').addEventListener('click', () => {
    $('#cover-file').click();
  });
  
  $('#cover-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      state.tempCoverFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        $('#cover-preview').src = e.target.result;
        $('#cover-preview').style.display = 'block';
        $('#cover-upload-area').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  // 照片上传
  $('#photo-upload').addEventListener('change', (e) => {
    handlePhotoUpload(e.target.files);
  });

  // 文件上传
  $('#file-upload').addEventListener('change', (e) => {
    handleFileUpload(e.target.files);
  });

  // 拖拽上传
  setupDragAndDrop();

  // 认证
  $('#auth-submit').addEventListener('click', () => handleAuthSubmit());

  // 照片导航
  $('#photo-prev').addEventListener('click', () => navigatePhoto(-1));
  $('#photo-next').addEventListener('click', () => navigatePhoto(1));
  $('#photo-download').addEventListener('click', () => downloadPhoto());
}

// ===== 导航 =====
async function navigate(page) {
  // 检查登录状态（除了 home 和 about 页面）
  if (!state.currentUser && page !== 'home' && page !== 'about') {
    alert('请先登录！');
    openAuthModal();
    return;
  }

  // 更新导航状态
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  $(`[data-page="${page}"]`).classList.add('active');

  // 切换页面
  $$('.page').forEach(p => p.classList.remove('active'));
  $(`#page-${page}`).classList.add('active');

  state.currentPage = page;

  // 渲染页面内容
  await renderPage(page);
  
  // 更新统计
  updateStats();
}

// ===== 渲染页面 =====
async function renderPage(page) {
  switch (page) {
    case 'home':
      renderHomePage();
      break;
    case 'blog':
      renderBlogPage();
      break;
    case 'photos':
      renderPhotosPage();
      break;
    case 'files':
      renderFilesPage();
      break;
  }
}

// ===== 首页 =====
function renderHomePage() {
  // 最新文章
  const postsContainer = $('#home-posts');
  const recentPosts = state.posts.slice(0, 3);
  
  if (recentPosts.length === 0) {
    postsContainer.innerHTML = '<div class="empty-card">暂无文章，快去写第一篇吧！</div>';
  } else {
    postsContainer.innerHTML = recentPosts.map(post => `
      <div class="post-card" onclick="viewPost('${post.id}')">
        ${post.cover ? `<img src="${post.cover}" alt="${post.title}" class="post-cover">` : ''}
        <div class="post-card-content">
          <h3 class="post-card-title">${post.title}</h3>
          <div class="post-card-meta">
            <span>${formatDate(post.created_at)}</span>
            <span>${post.tags ? post.tags.join(', ') : ''}</span>
          </div>
          <div class="post-card-excerpt">${post.excerpt || '暂无摘要'}</div>
        </div>
      </div>
    `).join('');
  }

  // 最近照片
  const photosContainer = $('#home-photos');
  const recentPhotos = state.photos.slice(0, 10);
  
  if (recentPhotos.length === 0) {
    photosContainer.innerHTML = '<div class="empty-card">暂无照片</div>';
  } else {
    photosContainer.innerHTML = recentPhotos.map(photo => `
      <img src="${photo.url}" alt="${photo.name}" class="photo-thumb" onclick="viewPhoto('${photo.id}')">
    `).join('');
  }
}

// ===== 博客页面 =====
function renderBlogPage() {
  const container = $('#posts-list');
  
  if (state.posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-pen-nib fa-3x"></i>
        <p>还没有文章，点击右上角"新建文章"开始写作吧！</p>
      </div>
    `;
  } else {
    container.innerHTML = state.posts.map(post => `
      <div class="post-item" onclick="viewPost('${post.id}')">
        ${post.cover ? `<img src="${post.cover}" alt="${post.title}" class="post-item-cover">` : ''}
        <div class="post-item-content">
          <h3 class="post-item-title">${post.title}</h3>
          <div class="post-item-meta">
            <span><i class="far fa-calendar"></i> ${formatDate(post.created_at)}</span>
            <span><i class="far fa-clock"></i> ${post.read_time || '5'} 分钟阅读</span>
            ${post.tags ? `<span><i class="fas fa-tags"></i> ${post.tags.join(', ')}</span>` : ''}
          </div>
          <p class="post-item-excerpt">${post.excerpt || ''}</p>
        </div>
      </div>
    `).join('');
  }
}

// ===== 照片页面 =====
function renderPhotosPage() {
  const container = $('#photos-grid');
  
  if (state.photos.length === 0) {
    container.innerHTML = '<div class="empty-card">暂无照片，点击右上角上传照片</div>';
  } else {
    container.innerHTML = state.photos.map(photo => `
      <div class="photo-item">
        <img src="${photo.url}" alt="${photo.name}" onclick="viewPhoto('${photo.id}')">
        <div class="photo-item-overlay">
          <button class="photo-delete" onclick="deletePhoto('${photo.id}', event)">删除</button>
        </div>
      </div>
    `).join('');
  }
}

// ===== 文件页面 =====
function renderFilesPage() {
  const tbody = $('#files-tbody');
  const emptyState = $('#files-empty');
  
  if (state.files.length === 0) {
    $('#files-table').style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    $('#files-table').style.display = 'table';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = state.files.map(file => `
      <tr>
        <td>
          <span class="file-icon">${getFileIcon(file.type, file.name)}</span>
          <span class="file-name">${file.name}</span>
        </td>
        <td>${formatFileSize(file.size)}</td>
        <td>${file.type || '未知'}</td>
        <td>${formatDate(file.created_at)}</td>
        <td>
          <button class="btn-icon" onclick="downloadFile('${file.id}')" title="下载">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-icon" onclick="deleteFile('${file.id}')" title="删除">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }
}

// ===== 文章操作 =====
function openPostModal(post = null) {
  $('#modal-post').classList.add('active');
  
  if (post) {
    // 编辑模式
    $('#modal-post-title').textContent = '✍️ 编辑文章';
    $('#post-title').value = post.title;
    $('#post-content').innerHTML = post.content;
    
    // 标签
    $$('.tag-selector input').forEach(checkbox => {
      checkbox.checked = post.tags && post.tags.includes(checkbox.value);
    });
  } else {
    // 新建模式
    $('#modal-post-title').textContent = '✍️ 写新文章';
    $('#post-title').value = '';
    $('#post-content').innerHTML = '';
    $$('.tag-selector input').forEach(checkbox => checkbox.checked = false);
    $('#cover-preview').style.display = 'none';
    $('#cover-upload-area').style.display = 'block';
    state.tempCoverFile = null;
  }
}

function closePostModal() {
  $('#modal-post').classList.remove('active');
}

async function publishPost() {
  const title = $('#post-title').value.trim();
  const content = $('#post-content').innerHTML;
  
  if (!title || !content) {
    alert('请填写标题和内容！');
    return;
  }
  
  // 获取标签
  const tags = Array.from($$('.tag-selector input:checked')).map(cb => cb.value);
  
  // 处理封面
  let cover = null;
  if (state.tempCoverFile) {
    const reader = new FileReader();
    cover = await new Promise((resolve) => {
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(state.tempCoverFile);
    });
  }
  
  // 生成摘要
  const excerpt = content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  
  // 阅读时间（粗略计算）
  const readTime = Math.ceil(content.length / 500);
  
  const post = {
    title,
    content,
    excerpt,
    tags,
    cover,
    read_time: readTime,
    status: 'published'
  };
  
  try {
    await db.createPost(post);
    await loadAllData();
    closePostModal();
    navigate('blog');
    alert('文章发布成功！');
  } catch (error) {
    alert('发布失败: ' + error.message);
  }
}

function saveDraft() {
  alert('草稿功能开发中...');
}

async function viewPost(id) {
  const post = state.posts.find(p => p.id === id);
  if (!post) return;
  
  $('#view-post-title').textContent = post.title;
  $('#view-post-meta').innerHTML = `
    <span><i class="far fa-calendar"></i> ${formatDate(post.created_at)}</span>
    <span><i class="far fa-clock"></i> ${post.read_time || '5'} 分钟阅读</span>
    ${post.tags ? `<span><i class="fas fa-tags"></i> ${post.tags.join(', ')}</span>` : ''}
  `;
  
  if (post.cover) {
    $('#view-post-cover').innerHTML = `<img src="${post.cover}" alt="${post.title}" class="post-cover-view-img">`;
  } else {
    $('#view-post-cover').innerHTML = '';
  }
  
  $('#view-post-content').innerHTML = post.content;
  
  $('#modal-view').classList.add('active');
}

function closeViewModal() {
  $('#modal-view').classList.remove('active');
}

function filterPosts(query) {
  const container = $('#posts-list');
  const filteredPosts = state.posts.filter(post => 
    post.title.toLowerCase().includes(query) || 
    (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
  );
  
  if (filteredPosts.length === 0) {
    container.innerHTML = '<div class="empty-card">没有找到匹配的文章</div>';
  } else {
    container.innerHTML = filteredPosts.map(post => `
      <div class="post-item" onclick="viewPost('${post.id}')">
        ${post.cover ? `<img src="${post.cover}" alt="${post.title}" class="post-item-cover">` : ''}
        <div class="post-item-content">
          <h3 class="post-item-title">${post.title}</h3>
          <div class="post-item-meta">
            <span><i class="far fa-calendar"></i> ${formatDate(post.created_at)}</span>
            <span><i class="far fa-clock"></i> ${post.read_time || '5'} 分钟阅读</span>
            ${post.tags ? `<span><i class="fas fa-tags"></i> ${post.tags.join(', ')}</span>` : ''}
          </div>
          <p class="post-item-excerpt">${post.excerpt || ''}</p>
        </div>
      </div>
    `).join('');
  }
}

// ===== 照片操作 =====
async function handlePhotoUpload(files) {
  if (!state.currentUser) {
    alert('请先登录！');
    return;
  }
  
  const photoFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
  
  if (photoFiles.length === 0) {
    alert('请选择图片文件！');
    return;
  }
  
  try {
    for (const file of photoFiles) {
      await db.uploadPhoto(file);
    }
    
    await loadAllData();
    renderPhotosPage();
    alert(`成功上传 ${photoFiles.length} 张照片！`);
  } catch (error) {
    alert('上传失败: ' + error.message);
  }
}

function viewPhoto(id) {
  const photo = state.photos.find(p => p.id === id);
  if (!photo) return;
  
  state.currentPhotoIndex = state.photos.findIndex(p => p.id === id);
  
  $('#lightbox-img').src = photo.url;
  $('#photo-caption').textContent = photo.name;
  $('#modal-photo').classList.add('active');
}

function closePhotoModal() {
  $('#modal-photo').classList.remove('active');
}

function navigatePhoto(direction) {
  const newIndex = state.currentPhotoIndex + direction;
  
  if (newIndex >= 0 && newIndex < state.photos.length) {
    state.currentPhotoIndex = newIndex;
    const photo = state.photos[newIndex];
    $('#lightbox-img').src = photo.url;
    $('#photo-caption').textContent = photo.name;
  }
}

async function deletePhoto(id, event) {
  event.stopPropagation();
  
  if (!confirm('确定要删除这张照片吗？')) {
    return;
  }
  
  try {
    await db.deletePhoto(id);
    await loadAllData();
    renderPhotosPage();
    alert('照片已删除！');
  } catch (error) {
    alert('删除失败: ' + error.message);
  }
}

function downloadPhoto() {
  const photo = state.photos[state.currentPhotoIndex];
  if (!photo) return;
  
  const a = document.createElement('a');
  a.href = photo.url;
  a.download = photo.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ===== 文件操作 =====
async function handleFileUpload(files) {
  if (!state.currentUser) {
    alert('请先登录！');
    return;
  }
  
  try {
    for (const file of files) {
      await db.uploadFile(file);
    }
    
    await loadAllData();
    renderFilesPage();
    alert(`成功上传 ${files.length} 个文件！`);
  } catch (error) {
    alert('上传失败: ' + error.message);
  }
}

function downloadFile(id) {
  const file = state.files.find(f => f.id === id);
  if (!file) return;
  
  const a = document.createElement('a');
  a.href = file.url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function deleteFile(id) {
  if (!confirm('确定要删除这个文件吗？')) {
    return;
  }
  
  try {
    await db.deleteFile(id);
    await loadAllData();
    renderFilesPage();
    alert('文件已删除！');
  } catch (error) {
    alert('删除失败: ' + error.message);
  }
}

// ===== 拖拽上传 =====
function setupDragAndDrop() {
  // 照片拖拽
  const photoDropZone = $('#photo-drop-zone');
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    photoDropZone.addEventListener(eventName, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    photoDropZone.addEventListener(eventName, () => photoDropZone.classList.add('active'), false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    photoDropZone.addEventListener(eventName, () => photoDropZone.classList.remove('active'), false);
  });
  
  photoDropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    handlePhotoUpload(files);
  });

  // 文件拖拽
  const fileDropZone = $('#file-drop-zone');
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileDropZone.addEventListener(eventName, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    fileDropZone.addEventListener(eventName, () => fileDropZone.classList.add('active'), false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    fileDropZone.addEventListener(eventName, () => fileDropZone.classList.remove('active'), false);
  });
  
  fileDropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  });
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ===== 认证操作 =====
function openAuthModal() {
  $('#modal-auth').classList.add('active');
  $('#auth-title').textContent = '登录';
  $('#auth-username').value = '';
  $('#auth-email').value = '';
  $('#auth-password').value = '';
}

function closeAuthModal() {
  $('#modal-auth').classList.remove('active');
}

async function handleAuthSubmit() {
  const username = $('#auth-username').value.trim();
  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;
  
  if (!username || !email || !password) {
    alert('请填写完整信息！');
    return;
  }
  
  const submitBtn = $('#auth-submit');
  submitBtn.textContent = '处理中...';
  submitBtn.disabled = true;
  
  try {
    // 模拟登录/注册
    let user = null;
    
    // 尝试登录
    const { data, error } = await db.signIn(email, password);
    
    if (error) {
      // 如果登录失败且没有用户，创建新用户
      if (db.getAllData().users.length === 0) {
        const { data: signupData, error: signupError } = await db.signUp(username, email, password);
        if (signupError) {
          alert('登录失败: ' + signupError.message);
          return;
        }
        user = signupData.user;
      } else {
        alert('登录失败: ' + error.message);
        return;
      }
    } else {
      user = data.user;
    }
    
    // 登录成功
    state.currentUser = user;
    localStorage.setItem('current_user', JSON.stringify(user));
    
    closeAuthModal();
    updateAuthUI();
    
    // 加载数据
    await loadAllData();
    renderPage(state.currentPage);
    
    alert(`欢迎回来，${user.username}！`);
    
  } catch (error) {
    alert('登录过程出错: ' + error.message);
  } finally {
    submitBtn.textContent = '登录';
    submitBtn.disabled = false;
  }
}

function updateAuthUI() {
  const userInfo = $('#user-info');
  const authBtn = $('#btn-auth');
  const authText = $('#auth-text');
  
  if (state.currentUser) {
    userInfo.style.display = 'block';
    $('#user-email').textContent = state.currentUser.username;
    authText.textContent = '退出';
    authBtn.onclick = async () => {
      if (confirm('确定要退出登录吗？')) {
        await db.signOut();
        state.currentUser = null;
        localStorage.removeItem('current_user');
        updateAuthUI();
        navigate('home');
      }
    };
  } else {
    userInfo.style.display = 'none';
    authText.textContent = '登录';
    authBtn.onclick = () => openAuthModal();
  }
}

// ===== 统计更新 =====
function updateStats() {
  $('#stat-posts').textContent = state.posts.length;
  $('#stat-photos').textContent = state.photos.length;
  $('#stat-files').textContent = state.files.length;
}

// ===== 编辑器工具 =====
function fmt(cmd) {
  document.execCommand(cmd, false, null);
  $('#post-content').focus();
}

function insertHR() {
  document.execCommand('insertHTML', false, '<hr>');
}

// ===== 启动应用 =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM 加载完成，初始化应用...');
  init();
});

// ===== 全局错误处理 =====
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
  console.error('错误信息:', event.error.message);
  console.error('堆栈:', event.error.stack);
});

console.log('✅ app.js 加载完成');