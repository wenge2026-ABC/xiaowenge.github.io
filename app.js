// ===== 全局状态 =====
const state = {
  currentPage: 'home',
  posts: [],
  photos: [],
  files: [],
  currentPhotoIndex: 0,
  tempCoverFile: null,
  currentUser: null,
  authMode: 'login' // 'login' or 'register'
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

// ===== Supabase 数据库操作 =====
class Database {
  constructor() {
    this.client = supabaseClient;
  }

  // 用户认证
  async signUp(email, password, username) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });
    return { data, error };
  }

  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    return { error };
  }

  async getCurrentUser() {
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  }

  // Posts 操作
  async fetchPosts() {
    const user = await this.getCurrentUser();
    const { data, error } = await this.client
      .from('posts')
      .select('*')
      .or(`user_id.eq.${user?.id},status.eq.published`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取文章失败:', error);
      return [];
    }
    return data || [];
  }

  async createPost(post) {
    const { data, error } = await this.client
      .from('posts')
      .insert([post])
      .select()
      .single();
    
    return { data, error };
  }

  async updatePost(id, updates) {
    const { data, error } = await this.client
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }

  async deletePost(id) {
    const { error } = await this.client
      .from('posts')
      .delete()
      .eq('id', id);
    
    return { error };
  }

  // Photos 操作
  async fetchPhotos() {
    const { data, error } = await this.client
      .from('photos')
      .select('*')
      .eq('user_id', (await this.getCurrentUser())?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取照片失败:', error);
      return [];
    }
    return data || [];
  }

  async createPhoto(photo) {
    const { data, error } = await this.client
      .from('photos')
      .insert([photo])
      .select()
      .single();
    
    return { data, error };
  }

  async deletePhoto(id) {
    const { error } = await this.client
      .from('photos')
      .delete()
      .eq('id', id);
    
    return { error };
  }

  // Files 操作
  async fetchFiles() {
    const { data, error } = await this.client
      .from('files')
      .select('*')
      .eq('user_id', (await this.getCurrentUser())?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取文件失败:', error);
      return [];
    }
    return data || [];
  }

  async createFile(file) {
    const { data, error } = await this.client
      .from('files')
      .insert([file])
      .select()
      .single();
    
    return { data, error };
  }

  async deleteFile(id) {
    const { error } = await this.client
      .from('files')
      .delete()
      .eq('id', id);
    
    return { error };
  }

  // 订阅实时更新
  subscribeToChanges(table, callback) {
    return this.client
      .channel('public:' + table)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }
}

// 创建数据库实例
const db = new Database();

// ===== 初始化 =====
async function init() {
  console.log('🔧 开始初始化...');
  
  try {
    console.log('1. 检查认证状态...');
    await checkAuth(false); // 初始化时不加载数据，避免重复加载
    console.log('✅ 认证检查完成');
    
    console.log('2. 绑定事件...');
    bindEvents();
    console.log('✅ 事件绑定完成');
    
    console.log('3. 导航到首页...');
    navigate('home');
    console.log('✅ 导航完成');
    
    console.log('4. 更新统计...');
    updateStats();
    console.log('✅ 统计更新完成');
    
    console.log('5. 设置实时订阅...');
    // 订阅实时更新
    db.subscribeToChanges('posts', () => {
      if (state.currentPage === 'blog' || state.currentPage === 'home') {
        renderPage(state.currentPage);
      }
    });
    
    db.subscribeToChanges('photos', () => {
      if (state.currentPage === 'photos' || state.currentPage === 'home') {
        renderPage(state.currentPage);
      }
    });
    
    db.subscribeToChanges('files', () => {
      if (state.currentPage === 'files' || state.currentPage === 'home') {
        renderPage(state.currentPage);
      }
    });
    console.log('✅ 实时订阅设置完成');
    
    console.log('🎉 网站初始化全部完成！');
  } catch (error) {
    console.error('❌ 初始化过程出错:', error);
    alert('初始化失败: ' + error.message);
  }
}

// ===== 检查认证状态 =====
async function checkAuth(loadData = true) {
  const user = await db.getCurrentUser();
  state.currentUser = user;
  updateAuthUI();
  
  if (user && loadData) {
    await loadAllData();
  } else if (!user) {
    // 未登录，数据为空
    state.posts = [];
    state.photos = [];
    state.files = [];
  }
}

// ===== 加载所有数据（并行加载，提升速度）=====
async function loadAllData() {
  const [posts, photos, files] = await Promise.all([
    db.fetchPosts(),
    db.fetchPhotos(),
    db.fetchFiles()
  ]);
  state.posts = posts;
  state.photos = photos;
  state.files = files;
}

// ===== 更新认证UI =====
function updateAuthUI() {
  const userInfo = $('#user-info');
  const userEmail = $('#user-email');
  const authBtn = $('#btn-auth');
  const authText = $('#auth-text');
  const newPostBtn = $('#btn-new-post');
  const newPostBtn2 = $('#btn-new-post2');
  
  if (state.currentUser) {
    userInfo.style.display = 'block';
    userEmail.textContent = state.currentUser.email;
    authText.textContent = '退出';
    authBtn.onclick = () => signOut();
    
    // 显示新建文章按钮
    if (newPostBtn) newPostBtn.style.display = 'flex';
    if (newPostBtn2) newPostBtn2.style.display = 'inline-flex';
  } else {
    userInfo.style.display = 'none';
    authText.textContent = '登录';
    authBtn.onclick = () => openAuthModal();
    
    // 隐藏新建文章按钮
    if (newPostBtn) newPostBtn.style.display = 'none';
    if (newPostBtn2) newPostBtn2.style.display = 'none';
  }
}

// ===== 事件绑定 =====
function bindEvents() {
  console.log('🎯 开始绑定事件...');
  
  // 导航菜单
  const navItems = $$('.nav-item');
  console.log(`找到 ${navItems.length} 个导航菜单项`);
  
  navItems.forEach((item, index) => {
    console.log(`绑定第 ${index + 1} 个菜单: ${item.dataset.page}`);
    item.addEventListener('click', e => {
      console.log(`点击菜单: ${item.dataset.page}`);
      e.preventDefault();
      const page = item.dataset.page;
      navigate(page);
    });
  });
  
  console.log('✅ 导航菜单事件绑定完成');

  // 移动端菜单
  $('#burger').addEventListener('click', () => {
    $('#sidebar').classList.add('active');
    $('#sidebar-overlay').classList.add('active');
  });
  $('#sidebar-overlay').addEventListener('click', () => {
    $('#sidebar').classList.remove('active');
    $('#sidebar-overlay').classList.remove('active');
  });

  // 新建文章按钮
  $('#btn-new-post').addEventListener('click', () => openPostModal());
  $('#btn-new-post2').addEventListener('click', () => openPostModal());

  // 文章模态框
  $('#close-modal-post').addEventListener('click', () => closePostModal());
  $('#modal-post').addEventListener('click', e => {
    if (e.target === $('#modal-post')) closePostModal();
  });

  // 保存/发布文章
  $('#save-draft').addEventListener('click', () => savePost('draft'));
  $('#publish-post').addEventListener('click', () => savePost('published'));

  // 封面图上传
  $('#cover-upload-area').addEventListener('click', () => $('#cover-file').click());
  $('#cover-file').addEventListener('change', handleCoverChange);

  // 搜索
  $('#search-input').addEventListener('input', handleSearch);

  // 查看文章模态框
  $('#close-modal-view').addEventListener('click', () => closeViewModal());
  $('#modal-view').addEventListener('click', e => {
    if (e.target === $('#modal-view')) closeViewModal();
  });
  $('#edit-post-btn').addEventListener('click', editPost);

  // 照片上传
  $('#photo-upload').addEventListener('change', e => handlePhotoUpload(e.target.files));
  const photoDropZone = $('#photo-drop-zone');
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    photoDropZone.addEventListener(eventName, preventDefaults, false);
  });
  photoDropZone.addEventListener('drop', e => handlePhotoUpload(e.dataTransfer.files));
  photoDropZone.addEventListener('click', () => $('#photo-upload').click());

  // 照片查看器
  $('#close-modal-photo').addEventListener('click', () => closePhotoModal());
  $('#modal-photo').addEventListener('click', e => {
    if (e.target === $('#modal-photo')) closePhotoModal();
  });
  $('#photo-prev').addEventListener('click', () => navigatePhoto(-1));
  $('#photo-next').addEventListener('click', () => navigatePhoto(1));
  $('#photo-download').addEventListener('click', () => downloadCurrentPhoto());

  // 文件上传
  $('#file-upload').addEventListener('change', e => handleFileUpload(e.target.files));
  const fileDropZone = $('#file-drop-zone');
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileDropZone.addEventListener(eventName, preventDefaults, false);
  });
  fileDropZone.addEventListener('drop', e => handleFileUpload(e.dataTransfer.files));
  fileDropZone.addEventListener('click', () => $('#file-upload').click());

  // 认证
  $('#close-modal-auth').addEventListener('click', () => closeAuthModal());
  $('#modal-auth').addEventListener('click', e => {
    if (e.target === $('#modal-auth')) closeAuthModal();
  });
  $('#auth-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode();
  });
  $('#auth-submit').addEventListener('click', () => handleAuthSubmit());
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ===== 导航 =====
async function navigate(page) {
  if (!state.currentUser && page !== 'home' && page !== 'about') {
    alert('请先登录！');
    openAuthModal();
    return;
  }
  
  state.currentPage = page;
  
  $$('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  
  $$('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });

  $('#sidebar').classList.remove('active');
  $('#sidebar-overlay').classList.remove('active');

  // 如果数据为空且已登录，先加载数据再渲染页面
  if (state.currentUser && state.posts.length === 0 && state.photos.length === 0 && state.files.length === 0) {
    await loadAllData();
  }
  
  renderPage(page);
}

async function renderPage(page) {
  // 显示页面加载提示
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'page-loading';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--primary);
    font-size: 16px;
    z-index: 9999;
    background: white;
    padding: 20px 30px;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-lg);
  `;
  loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在加载页面数据...';
  document.body.appendChild(loadingDiv);
  
  try {
    switch(page) {
      case 'home':
        await renderHomePage();
        break;
      case 'blog':
        await renderBlogPage();
        break;
      case 'photos':
        await renderPhotosPage();
        break;
      case 'files':
        await renderFilesPage();
        break;
    }
  } finally {
    // 移除加载提示
    setTimeout(() => {
      if (loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
      }
    }, 200);
  }
}

// ===== 首页 =====
async function renderHomePage() {
  if (!state.currentUser) {
    $('#home-posts').innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-light);">请先登录查看内容</div>';
    $('#home-photos').innerHTML = '';
    return;
  }
  
  const postsContainer = $('#home-posts');
  const photosContainer = $('#home-photos');
  
  const recentPosts = [...state.posts]
    .filter(p => p.status === 'published')
    .slice(0, 3);
  
  postsContainer.innerHTML = recentPosts.map(post => `
    <div class="post-card" onclick="viewPost('${post.id}')">
      ${post.cover ? `<img src="${post.cover}" class="post-cover" alt="${post.title}">` : `<div class="post-cover">📝</div>`}
      <div class="post-card-body">
        <h3 class="post-title">${post.title}</h3>
        <p class="post-excerpt">${post.excerpt || '暂无摘要'}</p>
        <div class="post-meta">
          <span>${formatDate(post.created_at)}</span>
          <span>${post.tags ? post.tags.join(', ') : '未分类'}</span>
        </div>
      </div>
    </div>
  `).join('');

  const recentPhotos = [...state.photos].slice(-6);
  photosContainer.innerHTML = recentPhotos.map((photo, index) => {
    const photoIndex = state.photos.length - 6 + index;
    return `<div class="photo-thumb" onclick="openPhotoModal(${photoIndex})">
      <img src="${photo.url}" alt="${photo.name || '照片'}" />
    </div>`;
  }).join('');
}

// ===== 博客页面 =====
async function renderBlogPage(postsToRender = null) {
  if (!state.currentUser) {
    $('#posts-list').innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-light);">请先登录查看文章</div>';
    return;
  }
  
  const container = $('#posts-list');
  const posts = postsToRender || [...state.posts]
    .filter(p => p.status === 'published');
  
  container.innerHTML = posts.map(post => `
    <div class="post-list-item">
      ${post.cover ? `<img src="${post.cover}" class="post-list-cover" alt="${post.title}">` : `<div class="post-list-cover">📝</div>`}
      <div class="post-list-content">
        <h3 class="post-list-title" onclick="viewPost('${post.id}')">${post.title}</h3>
        <div class="post-list-tags">
          ${post.tags ? post.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('') : ''}
        </div>
        <p class="post-excerpt">${post.excerpt || '暂无摘要'}</p>
        <div class="post-meta">
          <span>发布于 ${formatDate(post.created_at)}</span>
          ${post.user_id ? `<span>作者: ${post.user_email || '未知'}</span>` : ''}
        </div>
        <div class="post-list-actions">
          ${state.currentUser && post.user_id === state.currentUser.id ? `
            <button class="btn-small" onclick="event.stopPropagation(); editPostById('${post.id}')">编辑</button>
            <button class="btn-small danger" onclick="event.stopPropagation(); deletePost('${post.id}')">删除</button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

async function handleSearch(e) {
  if (!state.currentUser) return;
  
  const term = e.target.value.toLowerCase().trim();
  if (!term) {
    await renderBlogPage();
    return;
  }
  
  const filtered = state.posts.filter(post => 
    post.status === 'published' && (
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(term)))
    )
  );
  await renderBlogPage(filtered);
}

// ===== 文章模态框 =====
function openPostModal(postId = null) {
  if (!state.currentUser) {
    alert('请先登录！');
    openAuthModal();
    return;
  }
  
  const modal = $('#modal-post');
  const title = $('#modal-post-title');
  const titleInput = $('#post-title');
  const contentEditor = $('#post-content');
  
  if (postId) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;
    
    // 检查是否是作者
    if (post.user_id !== state.currentUser.id) {
      alert('只能编辑自己的文章！');
      return;
    }
    
    title.textContent = '✏️ 编辑文章';
    titleInput.value = post.title;
    contentEditor.innerHTML = post.content;
    modal.dataset.editing = postId;
    
    if (post.tags) {
      post.tags.forEach(tag => {
        const checkbox = $(`input[value="${tag}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    if (post.cover) {
      $('#cover-preview').src = post.cover;
      $('#cover-preview').style.display = 'block';
    }
  } else {
    title.textContent = '✍️ 写新文章';
    titleInput.value = '';
    contentEditor.innerHTML = '';
    delete modal.dataset.editing;
    
    $$('.tag-selector input').forEach(cb => cb.checked = false);
    $('#cover-preview').style.display = 'none';
  }
  
  modal.classList.add('active');
}

function closePostModal() {
  $('#modal-post').classList.remove('active');
  $('#cover-file').value = '';
  state.tempCoverFile = null;
}

function handleCoverChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件！');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = e => {
    $('#cover-preview').src = e.target.result;
    $('#cover-preview').style.display = 'block';
    state.tempCoverFile = { name: file.name, data: e.target.result };
  };
  reader.readAsDataURL(file);
}

async function savePost(status) {
  if (!state.currentUser) {
    alert('请先登录！');
    return;
  }
  
  const title = $('#post-title').value.trim();
  const content = $('#post-content').innerHTML.trim();
  
  if (!title || !content) {
    alert('请填写标题和内容！');
    return;
  }
  
  const tags = Array.from($$('.tag-selector input:checked')).map(cb => cb.value);
  const editingId = $('#modal-post').dataset.editing;
  
  const postData = {
    title,
    content,
    tags,
    status,
    excerpt: content.replace(/<[^>]*>/g, '').substring(0, 120) + '...',
    user_id: state.currentUser.id,
    user_email: state.currentUser.email
  };
  
  if (state.tempCoverFile) {
    postData.cover = state.tempCoverFile.data;
  }
  
  if (editingId) {
    const { error } = await db.updatePost(editingId, postData);
    if (error) {
      alert('更新文章失败: ' + error.message);
      return;
    }
  } else {
    const { error } = await db.createPost(postData);
    if (error) {
      alert('发布文章失败: ' + error.message);
      return;
    }
  }
  
  // 重新加载数据
  await loadAllData();
  
  closePostModal();
  navigate('blog');
  updateStats();
  
  alert(status === 'published' ? '文章已发布！' : '草稿已保存！');
}

function viewPost(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;
  
  $('#view-post-title').textContent = post.title;
  $('#view-post-meta').innerHTML = `
    <span>📅 ${formatDate(post.created_at)}</span> | 
    <span>🏷️ ${post.tags ? post.tags.join(', ') : '未分类'}</span>
    ${post.user_id ? `| <span>👤 ${post.user_email || '未知'}</span>` : ''}
  `;
  
  $('#view-post-cover').innerHTML = post.cover ? `<img src="${post.cover}" alt="${post.title}">` : '';
  $('#view-post-content').innerHTML = post.content;
  
  $('#modal-view').dataset.viewing = postId;
  $('#modal-view').classList.add('active');
}

function closeViewModal() {
  $('#modal-view').classList.remove('active');
  delete $('#modal-view').dataset.viewing;
}

function editPost() {
  const postId = $('#modal-view').dataset.viewing;
  if (!postId) return;
  
  closeViewModal();
  openPostModal(postId);
}

function editPostById(postId) {
  openPostModal(postId);
}

async function deletePost(postId) {
  if (!state.currentUser) {
    alert('请先登录！');
    return;
  }
  
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;
  
  // 检查是否是作者
  if (post.user_id !== state.currentUser.id) {
    alert('只能删除自己的文章！');
    return;
  }
  
  if (!confirm('确定要删除这篇文章吗？')) return;
  
  const { error } = await db.deletePost(postId);
  if (error) {
    alert('删除失败: ' + error.message);
    return;
  }
  
  await loadAllData();
  renderBlogPage();
  updateStats();
  alert('文章已删除！');
}

// ===== 照片功能 =====
async function renderPhotosPage() {
  if (!state.currentUser) {
    $('#photos-grid').innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-light);">请先登录查看照片</div>';
    return;
  }
  
  const container = $('#photos-grid');
  
  if (state.photos.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-light);">暂无照片，点击上方上传吧！</div>';
    return;
  }
  
  container.innerHTML = state.photos.map((photo, index) => `
    <div class="photo-item" onclick="openPhotoModal(${index})">
      <img src="${photo.url}" alt="${photo.name || '照片'}" />
      <div class="photo-overlay">
        <button class="photo-action" onclick="event.stopPropagation(); downloadPhoto('${photo.id}')" title="下载">
          <i class="fas fa-download"></i>
        </button>
        <button class="photo-action" onclick="event.stopPropagation(); deletePhoto(${index})" title="删除">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

async function handlePhotoUpload(files) {
  if (!state.currentUser) {
    alert('请先登录！');
    return;
  }
  
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} 不是有效的图片文件！`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async e => {
      const photo = {
        name: file.name,
        url: e.target.result,
        user_id: state.currentUser.id,
        user_email: state.currentUser.email
      };
      
      const { error } = await db.createPhoto(photo);
      if (error) {
        alert('上传照片失败: ' + error.message);
        return;
      }
      
      await loadAllData();
      renderPhotosPage();
      updateStats();
    };
    reader.readAsDataURL(file);
  });
}

async function deletePhoto(index) {
  if (!state.currentUser) {
    alert('请先登录！');
    return;
  }
  
  const password = prompt('请输入删除密码：');
  if (password !== '040711') {
    alert('密码错误，无法删除！');
    return;
  }
  
  if (!confirm('确定要删除这张照片吗？')) return;
  
  const photo = state.photos[index];
  if (!photo) return;
  
  // 检查是否是上传者
  if (photo.user_id !== state.currentUser.id) {
    alert('只能删除自己上传的照片！');
    return;
  }
  
  const { error } = await db.deletePhoto(photo.id);
  if (error) {
    alert('删除失败: ' + error.message);
    return;
  }
  
  await loadAllData();
  renderPhotosPage();
  updateStats();
  alert('照片已删除！');
}

function downloadPhoto(photoId) {
  const photo = state.photos.find(p => p.id === photoId);
  if (!photo) return;
  
  const a = document.createElement('a');
  a.href = photo.url;
  a.download = photo.name || 'photo.jpg';
  a.click();
}

function openPhotoModal(index) {
  state.currentPhotoIndex = index;
  const photo = state.photos[index];
  
  $('#lightbox-img').src = photo.url;
  $('#photo-caption').textContent = photo.name || `${index + 1} / ${state.photos.length}`;
  $('#modal-photo').dataset.currentPhotoId = photo.id;
  
  $('#modal-photo').classList.add('active');
}

function closePhotoModal() {
  $('#modal-photo').classList.remove('active');
  delete $('#modal-photo').dataset.currentPhotoId;
}

function navigatePhoto(direction) {
  const newIndex = state.currentPhotoIndex + direction;
  if (newIndex < 0 || newIndex >= state.photos.length) return;
  
  openPhotoModal(newIndex);
}

function downloadCurrentPhoto() {
  const photoId = $('#modal-photo').dataset.currentPhotoId;
  if (!photoId) return;
  
  downloadPhoto(photoId);
}

// ===== 文件功能 =====
async function renderFilesPage() {
  if (!state.currentUser) {
    $('#files-tbody').innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-light);">请先登录查看文件</td></tr>';
    $('#files-empty').style.display = 'none';
    return;
  }
  
  const tbody = $('#files-tbody');
  const emptyState = $('#files-empty');
  
  if (state.files.length === 0) {
    $('#files-table').style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  $('#files-table').style.display = 'table';
  emptyState.style.display = 'none';
  
  tbody.innerHTML = state.files.map(file => `
    <tr>
      <td>
        <div class="file-info">
          <div class="file-icon">${getFileIcon(file.type, file.name)}</div>
          <div>
            <div class="file-name">${file.name}</div>
            <div class="file-name ext">${file.type || '未知类型'}</div>
          </div>
        </div>
      </td>
      <td class="file-size">${formatFileSize(file.size)}</td>
      <td>${file.type || '未知'}</td>
      <td>${formatDate(file.created_at)}</td>
      <td>
        <button class="btn-small" onclick="event.stopPropagation(); downloadFile('${file.id}')">下载</button>
        ${state.currentUser && file.user_id === state.currentUser.id ? `
          <button class="btn-small danger" onclick="event.stopPropagation(); deleteFile('${file.id}')">删除</button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

async function handleFileUpload(files) {
  if (!state.currentUser) {
    alert('请先登录！');
    return;
  }
  
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = async e => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result,
        user_id: state.currentUser.id,
        user_email: state.currentUser.email
      };
      
      const { error } = await db.createFile(fileData);
      if (error) {
        alert('上传文件失败: ' + error.message);
        return;
      }
      
      await loadAllData();
      renderFilesPage();
      updateStats();
    };
    reader.readAsDataURL(file);
  });
}

function downloadFile(fileId) {
  const file = state.files.find(f => f.id === fileId);
  if (!file) return;
  
  const a = document.createElement('a');
  a.href = file.data;
  a.download = file.name;
  a.click();
}

async function deleteFile(fileId) {
  if (!state.currentUser) {
    alert('请先登录！');
    return;
  }
  
  const password = prompt('请输入删除密码：');
  if (password !== '040711') {
    alert('密码错误，无法删除！');
    return;
  }
  
  if (!confirm('确定要删除这个文件吗？')) return;
  
  const file = state.files.find(f => f.id === fileId);
  if (!file) return;
  
  // 检查是否是上传者
  if (file.user_id !== state.currentUser.id) {
    alert('只能删除自己上传的文件！');
    return;
  }
  
  const { error } = await db.deleteFile(fileId);
  if (error) {
    alert('删除失败: ' + error.message);
    return;
  }
  
  await loadAllData();
  renderFilesPage();
  updateStats();
  alert('文件已删除！');
}

// ===== 认证功能 =====
function openAuthModal() {
  $('#modal-auth').classList.add('active');
}

function closeAuthModal() {
  $('#modal-auth').classList.remove('active');
  $('#auth-email').value = '';
  $('#auth-password').value = '';
  $('#auth-username').value = '';
}

function toggleAuthMode() {
  state.authMode = state.authMode === 'login' ? 'register' : 'login';
  
  const title = $('#auth-title');
  const usernameGroup = $('#auth-username-group');
  const submitBtn = $('#auth-submit');
  const toggleText = $('#auth-toggle-text');
  const toggleLink = $('#auth-toggle');
  
  if (state.authMode === 'login') {
    title.textContent = '登录';
    usernameGroup.style.display = 'none';
    submitBtn.textContent = '登录';
    toggleText.textContent = '还没有账号？';
    toggleLink.textContent = '注册';
  } else {
    title.textContent = '注册';
    usernameGroup.style.display = 'block';
    submitBtn.textContent = '注册';
    toggleText.textContent = '已有账号？';
    toggleLink.textContent = '登录';
  }
}

async function handleAuthSubmit() {
  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;
  const username = $('#auth-username').value.trim();
  
  if (!email || !password || (state.authMode === 'register' && !username)) {
    alert('请填写完整信息！');
    return;
  }
  
  // 显示加载状态
  const submitBtn = $('#auth-submit');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = '处理中...';
  submitBtn.disabled = true;
  
  try {
    if (state.authMode === 'register') {
      const { error } = await db.signUp(email, password, username);
      if (error) {
        alert('注册失败: ' + error.message);
        return;
      }
      alert('注册成功！请检查邮箱验证邮件。');
    } else {
      const { error } = await db.signIn(email, password);
      if (error) {
        alert('登录失败: ' + error.message);
        return;
      }
    }
    
    // 登录成功后，先关闭模态框，再异步加载数据
    closeAuthModal();
    
    // 更新认证状态
    await checkAuth();
    
    if (state.currentUser) {
      // 显示加载提示
      const loadingMsg = document.createElement('div');
      loadingMsg.id = 'loading-msg';
      loadingMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--gradient-1);
        color: white;
        padding: 12px 20px;
        border-radius: var(--radius-sm);
        z-index: 9999;
        animation: fadeIn 0.3s ease;
      `;
      loadingMsg.textContent = '🚀 正在加载数据...';
      document.body.appendChild(loadingMsg);
      
      // 并行加载数据并渲染
      await Promise.all([
        loadAllData(),
        new Promise(resolve => setTimeout(resolve, 300)) // 最小显示时间，避免闪烁
      ]);
      
      // 移除加载提示
      if (loadingMsg.parentNode) {
        loadingMsg.parentNode.removeChild(loadingMsg);
      }
      
      renderPage(state.currentPage);
      updateStats();
      
      // 显示欢迎消息
      setTimeout(() => {
        alert(`欢迎回来，${state.currentUser.email.split('@')[0]}！`);
      }, 100);
    }
  } finally {
    // 恢复按钮状态
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

async function signOut() {
  if (!confirm('确定要退出登录吗？')) return;
  
  const { error } = await db.signOut();
  if (error) {
    alert('退出失败: ' + error.message);
    return;
  }
  
  state.currentUser = null;
  state.posts = [];
  state.photos = [];
  state.files = [];
  
  updateAuthUI();
  renderPage(state.currentPage);
  updateStats();
  alert('已退出登录！');
}

// ===== 统计更新 =====
function updateStats() {
  const posts = state.currentUser ? state.posts.filter(p => p.status === 'published') : [];
  $('#stat-posts').textContent = posts.length;
  $('#stat-photos').textContent = state.currentUser ? state.photos.length : 0;
  $('#stat-files').textContent = state.currentUser ? state.files.length : 0;
}

// ===== 编辑器工具 =====
window.fmt = (command) => {
  document.execCommand(command, false, null);
  $('#post-content').focus();
};

window.insertHR = () => {
  document.execCommand('insertHTML', false, '<hr style="margin:20px 0; border:none; border-top:1px solid #e5e7eb;">');
  $('#post-content').focus();
};

// ===== 启动 =====
console.log('🚀 网站开始加载...');

// 全局初始化函数，由 supabase-config.js 调用
window.initApp = function() {
    console.log('📄 Supabase 加载完成，开始初始化应用...');
    try {
        init();
        console.log('✅ 网站初始化成功');
    } catch (error) {
        console.error('❌ 网站初始化失败:', error);
        alert('网站初始化失败，请查看控制台获取详细信息');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 加载完成，等待 Supabase...');
    // 如果 Supabase 已经加载完成，立即初始化
    if (window.supabaseClient) {
        window.initApp();
    }
});
