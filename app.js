// ===== 数据存储 =====
class DataStorage {
  constructor() {
    this.prefix = 'gxw_blog_';
  }
  get(key) {
    const data = localStorage.getItem(this.prefix + key);
    return data ? JSON.parse(data) : null;
  }
  set(key, value) {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }
  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }
}
const storage = new DataStorage();

// ===== 全局状态 =====
const state = {
  currentPage: 'home',
  posts: storage.get('posts') || [],
  photos: storage.get('photos') || [],
  files: storage.get('files') || [],
  currentPhotoIndex: 0,
  tempCoverFile: null,
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

// ===== 初始化 =====
function init() {
  bindEvents();
  navigate('home');
  updateStats();
}

// ===== 事件绑定 =====
function bindEvents() {
  // 导航
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      navigate(page);
    });
  });

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

  // 文件上传
  $('#file-upload').addEventListener('change', e => handleFileUpload(e.target.files));
  const fileDropZone = $('#file-drop-zone');
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileDropZone.addEventListener(eventName, preventDefaults, false);
  });
  fileDropZone.addEventListener('drop', e => handleFileUpload(e.dataTransfer.files));
  fileDropZone.addEventListener('click', () => $('#file-upload').click());
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ===== 导航 =====
function navigate(page) {
  state.currentPage = page;
  
  $$('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  
  $$('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });

  $('#sidebar').classList.remove('active');
  $('#sidebar-overlay').classList.remove('active');

  renderPage(page);
}

function renderPage(page) {
  switch(page) {
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
  const postsContainer = $('#home-posts');
  const photosContainer = $('#home-photos');
  
  const recentPosts = [...state.posts]
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
  
  postsContainer.innerHTML = recentPosts.map(post => `
    <div class="post-card" onclick="viewPost('${post.id}')">
      ${post.cover ? `<img src="${post.cover}" class="post-cover" alt="${post.title}">` : `<div class="post-cover">📝</div>`}
      <div class="post-card-body">
        <h3 class="post-title">${post.title}</h3>
        <p class="post-excerpt">${post.excerpt || '暂无摘要'}</p>
        <div class="post-meta">
          <span>${formatDate(post.date)}</span>
          <span>${post.tags.join(', ') || '未分类'}</span>
        </div>
      </div>
    </div>
  `).join('');

  const recentPhotos = [...state.photos].slice(-6);
  photosContainer.innerHTML = recentPhotos.map((photo, index) => `
    <div class="photo-thumb" onclick="openPhotoModal(${state.photos.length - 6 + index})">
      <img src="${photo.url}" alt="${photo.name || '照片'}" />
    </div>
  `).join('');
}

// ===== 博客页面 =====
function renderBlogPage(postsToRender = null) {
  const container = $('#posts-list');
  const posts = postsToRender || [...state.posts]
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  container.innerHTML = posts.map(post => `
    <div class="post-list-item">
      ${post.cover ? `<img src="${post.cover}" class="post-list-cover" alt="${post.title}">` : `<div class="post-list-cover">📝</div>`}
      <div class="post-list-content">
        <h3 class="post-list-title" onclick="viewPost('${post.id}')">${post.title}</h3>
        <div class="post-list-tags">
          ${post.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
        </div>
        <p class="post-excerpt">${post.excerpt || '暂无摘要'}</p>
        <div class="post-meta">
          <span>发布于 ${formatDate(post.date)}</span>
        </div>
        <div class="post-list-actions">
          <button class="btn-small" onclick="event.stopPropagation(); editPostById('${post.id}')">编辑</button>
          <button class="btn-small danger" onclick="event.stopPropagation(); deletePost('${post.id}')">删除</button>
        </div>
      </div>
    </div>
  `).join('');
}

function handleSearch(e) {
  const term = e.target.value.toLowerCase().trim();
  if (!term) {
    renderBlogPage();
    return;
  }
  
  const filtered = state.posts.filter(post => 
    post.status === 'published' && (
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      post.tags.some(tag => tag.toLowerCase().includes(term))
    )
  );
  renderBlogPage(filtered);
}

// ===== 文章模态框 =====
function openPostModal(postId = null) {
  const modal = $('#modal-post');
  const title = $('#modal-post-title');
  const titleInput = $('#post-title');
  const contentEditor = $('#post-content');
  
  if (postId) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;
    
    title.textContent = '✏️ 编辑文章';
    titleInput.value = post.title;
    contentEditor.innerHTML = post.content;
    modal.dataset.editing = postId;
    
    post.tags.forEach(tag => {
      const checkbox = $(`input[value="${tag}"]`);
      if (checkbox) checkbox.checked = true;
    });
    
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

function savePost(status) {
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
    date: editingId ? state.posts.find(p => p.id === editingId).date : new Date().toISOString(),
    excerpt: content.replace(/<[^>]*>/g, '').substring(0, 120) + '...',
  };
  
  if (state.tempCoverFile) {
    postData.cover = state.tempCoverFile.data;
  }
  
  if (editingId) {
    const index = state.posts.findIndex(p => p.id === editingId);
    state.posts[index] = { ...state.posts[index], ...postData };
  } else {
    postData.id = Date.now().toString();
    state.posts.unshift(postData);
  }
  
  storage.set('posts', state.posts);
  
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
    <span>📅 ${formatDate(post.date)}</span> | <span>🏷️ ${post.tags.join(', ') || '未分类'}</span>
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

function deletePost(postId) {
  if (!confirm('确定要删除这篇文章吗？')) return;
  
  // 调试信息
  console.log('删除前的文章数量:', state.posts.length);
  console.log('要删除的文章ID:', postId);
  
  state.posts = state.posts.filter(p => p.id !== postId);
  storage.set('posts', state.posts);
  
  // 调试信息
  console.log('删除后的文章数量:', state.posts.length);
  console.log('剩余文章:', state.posts.map(p => ({id: p.id, title: p.title})));
  
  renderBlogPage();
  updateStats();
  alert('文章已删除！');
}

// ===== 照片功能 =====
function renderPhotosPage() {
  const container = $('#photos-grid');
  
  if (state.photos.length === 0) {
    container.innerHTML = '<div class="text-center" style="grid-column:1/-1; padding:40px; color:var(--text-light);">暂无照片，点击上方上传吧！</div>';
    return;
  }
  
  container.innerHTML = state.photos.map((photo, index) => `
    <div class="photo-item" onclick="openPhotoModal(${index})">
      <img src="${photo.url}" alt="${photo.name || '照片'}" />
      <div class="photo-overlay">
        <button class="photo-action" onclick="deletePhoto(${index}); event.stopPropagation();" title="删除">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function handlePhotoUpload(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} 不是有效的图片文件！`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = e => {
      const photo = {
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        name: file.name,
        url: e.target.result,
        date: new Date().toISOString(),
        size: file.size,
      };
      
      state.photos.push(photo);
      storage.set('photos', state.photos);
      
      renderPhotosPage();
      updateStats();
    };
    reader.readAsDataURL(file);
  });
}

function deletePhoto(index) {
  if (!confirm('确定要删除这张照片吗？')) return;
  
  state.photos.splice(index, 1);
  storage.set('photos', state.photos);
  
  renderPhotosPage();
  updateStats();
}

function openPhotoModal(index) {
  state.currentPhotoIndex = index;
  const photo = state.photos[index];
  
  $('#lightbox-img').src = photo.url;
  $('#photo-caption').textContent = photo.name || `${index + 1} / ${state.photos.length}`;
  
  $('#modal-photo').classList.add('active');
}

function closePhotoModal() {
  $('#modal-photo').classList.remove('active');
}

function navigatePhoto(direction) {
  const newIndex = state.currentPhotoIndex + direction;
  if (newIndex < 0 || newIndex >= state.photos.length) return;
  
  openPhotoModal(newIndex);
}

// ===== 文件功能 =====
function renderFilesPage() {
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
      <td>${formatDate(file.date)}</td>
      <td>
        <button class="btn-small" onclick="event.stopPropagation(); downloadFile('${file.id}')">下载</button>
        <button class="btn-small danger" onclick="event.stopPropagation(); deleteFile('${file.id}')">删除</button>
      </td>
    </tr>
  `).join('');
}

function handleFileUpload(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const fileData = {
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result,
        date: new Date().toISOString(),
      };
      
      state.files.push(fileData);
      storage.set('files', state.files);
      
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

function deleteFile(fileId) {
  if (!confirm('确定要删除这个文件吗？')) return;
  
  state.files = state.files.filter(f => f.id !== fileId);
  storage.set('files', state.files);
  
  renderFilesPage();
  updateStats();
}

// ===== 统计更新 =====
function updateStats() {
  $('#stat-posts').textContent = state.posts.filter(p => p.status === 'published').length;
  $('#stat-photos').textContent = state.photos.length;
  $('#stat-files').textContent = state.files.length;
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
document.addEventListener('DOMContentLoaded', init);
