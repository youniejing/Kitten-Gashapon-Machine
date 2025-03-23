// 配置信息 - 已填入您的实际信息
const CONFIG = {
  binId: '67e04c0d8960c979a576f646',
  apiKey: '$2a$10$qFSedI2vR8ip8TiEZgmHb.W2Fg2YinWfC/SNjfvxVkEdDlwPkfN0i',
  adminPassword: 'Younj1031'
};

// 全局数据对象
let globalData = {
  balance: 100,
  images: [],
  history: []
};

// 检查是否是管理员
let isAdmin = false;

// API请求函数 - 使用简化的fetch包装器
async function makeApiRequest(url, method = 'GET', body = null) {
  try {
    const options = {
      method: method,
      headers: {
        'X-Master-Key': CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`API错误: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    return null;
  }
}

// 页面加载时获取数据
async function loadData() {
  const data = await makeApiRequest(`https://api.jsonbin.io/v3/b/${CONFIG.binId}/latest`);
  
  if (!data) {
    alert('无法加载数据，请刷新页面重试');
    return false;
  }
  
  // 更新全局数据
  globalData = data.record;
  
  // 如果是首次使用，初始化数据结构
  if (!globalData.balance) globalData.balance = 100;
  if (!globalData.images) globalData.images = [];
  if (!globalData.history) globalData.history = [];
  
  return true;
}

// 保存数据到JSONBin
async function saveData() {
  const result = await makeApiRequest(
    `https://api.jsonbin.io/v3/b/${CONFIG.binId}`, 
    'PUT', 
    globalData
  );
  
  return result !== null;
}

// 初始化扭蛋页面
async function initGashaponPage() {
  // 加载数据
  const loadSuccess = await loadData();
  if (!loadSuccess) return;
  
  // 更新UI
  updateUserInterface();
  
  // 设置扭蛋功能
  setupGashaponEvents();
}

// 初始化管理页面
async function initAdminPage() {
  // 验证管理员身份
  if (!checkAdminAuth()) {
    window.location.href = 'index.html';
    return;
  }
  
  // 加载数据
  const loadSuccess = await loadData();
  if (!loadSuccess) return;
  
  // 更新UI
  updateAdminInterface();
  
  // 设置管理功能
  setupAdminEvents();
}

// 更新用户界面
function updateUserInterface() {
  const balanceElement = document.getElementById('balance');
  const historyContainer = document.getElementById('history');
  
  if (balanceElement) {
    balanceElement.textContent = globalData.balance;
  }
  
  if (historyContainer) {
    displayHistory(historyContainer);
  }
}

// 更新管理界面
function updateAdminInterface() {
  const balanceElement = document.getElementById('admin-balance');
  const imageListContainer = document.getElementById('image-list');
  
  if (balanceElement) {
    balanceElement.textContent = globalData.balance;
  }
  
  if (imageListContainer) {
    displayImageList(imageListContainer);
  }
}

// 设置扭蛋事件
function setupGashaponEvents() {
  const drawButton = document.getElementById('draw-button');
  const resultContainer = document.getElementById('result');
  const resultImage = document.getElementById('result-image');
  const resultText = document.getElementById('result-text');
  const closeResultButton = document.getElementById('close-result');
  
  // 扭蛋按钮点击事件
  drawButton.addEventListener('click', async function() {
    drawButton.disabled = true; // 防止重复点击
    
    try {
      // 刷新数据
      await loadData();
      
      const cost = 10;
      if (globalData.balance < cost) {
        alert('余额不足！请等待管理员添加硬币。');
        drawButton.disabled = false;
        return;
      }
      
      // 扣除硬币
      globalData.balance -= cost;
      
      // 抽取图片
      const drawnImage = drawRandomImage();
      
      if (!drawnImage) {
        alert('抽奖失败，图片库为空，请联系管理员添加图片。');
        globalData.balance += cost; // 退回硬币
        drawButton.disabled = false;
        return;
      }
      
      // 添加到历史记录
      globalData.history.push({
        ...drawnImage,
        timestamp: new Date().toISOString()
      });
      
      // 保存数据
      const saveSuccess = await saveData();
      
      if (!saveSuccess) {
        alert('保存抽奖结果失败，请重试');
        globalData.balance += cost; // 退回硬币
        globalData.history.pop(); // 移除历史记录
        drawButton.disabled = false;
        return;
      }
      
      // 更新界面
      updateUserInterface();
      
      // 显示结果
      resultImage.src = drawnImage.url;
      resultText.textContent = drawnImage.description;
      resultContainer.style.display = 'flex';
      
    } catch (error) {
      console.error('抽奖过程出错:', error);
      alert('抽奖过程出错，请重试');
    } finally {
      drawButton.disabled = false;
    }
  });
  
  // 关闭结果弹窗
  closeResultButton.addEventListener('click', function() {
    resultContainer.style.display = 'none';
  });
}

// 设置管理页面事件
function setupAdminEvents() {
  const balanceAmountInput = document.getElementById('balance-amount');
  const addBalanceButton = document.getElementById('add-balance');
  const reduceBalanceButton = document.getElementById('reduce-balance');
  const imageUrlInput = document.getElementById('image-url');
  const imageDescriptionInput = document.getElementById('image-description');
  const imageRaritySelect = document.getElementById('image-rarity');
  const addImageButton = document.getElementById('add-image');
  
  // 增加余额
  addBalanceButton.addEventListener('click', async function() {
    const amount = parseInt(balanceAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效数量!');
      return;
    }
    
    // 刷新数据
    await loadData();
    
    globalData.balance += amount;
    
    const saveSuccess = await saveData();
    if (saveSuccess) {
      updateAdminInterface();
      balanceAmountInput.value = '';
    } else {
      alert('保存失败，请重试');
    }
  });
  
  // 减少余额
  reduceBalanceButton.addEventListener('click', async function() {
    const amount = parseInt(balanceAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效数量!');
      return;
    }
    
    // 刷新数据
    await loadData();
    
    globalData.balance = Math.max(0, globalData.balance - amount);
    
    const saveSuccess = await saveData();
    if (saveSuccess) {
      updateAdminInterface();
      balanceAmountInput.value = '';
    } else {
      alert('保存失败，请重试');
    }
  });
  
  // 添加图片
  addImageButton.addEventListener('click', async function() {
    const url = imageUrlInput.value.trim();
    const description = imageDescriptionInput.value.trim();
    const rarity = parseInt(imageRaritySelect.value);
    
    if (!url || !description) {
      alert('请填写图片URL和描述!');
      return;
    }
    
    // 刷新数据
    await loadData();
    
    globalData.images.push({
      url: url,
      description: description,
      rarity: rarity
    });
    
    const saveSuccess = await saveData();
    if (saveSuccess) {
      updateAdminInterface();
      imageUrlInput.value = '';
      imageDescriptionInput.value = '';
    } else {
      alert('保存失败，请重试');
    }
  });
}

// 随机抽取图片逻辑
function drawRandomImage() {
  if (!globalData.images || globalData.images.length === 0) return null;
  
  // 根据稀有度计算概率
  let weightedImages = [];
  globalData.images.forEach(image => {
    // 根据稀有度添加权重
    const weight = image.rarity === 1 ? 60 : 
                   image.rarity === 2 ? 30 : 10;
    
    for (let i = 0; i < weight; i++) {
      weightedImages.push(image);
    }
  });
  
  // 随机选择
  const randomIndex = Math.floor(Math.random() * weightedImages.length);
  return weightedImages[randomIndex];
}

// 显示历史记录
function displayHistory(container) {
  container.innerHTML = '';
  
  if (!globalData.history || globalData.history.length === 0) {
    container.innerHTML = '<p>还没有抽到任何图片。</p>';
    return;
  }
  
  // 显示最近的10条记录
  const recentHistory = [...globalData.history].reverse().slice(0, 10);
  
  recentHistory.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.description;
    
    const text = document.createElement('p');
    text.textContent = item.description;
    
    historyItem.appendChild(img);
    historyItem.appendChild(text);
    container.appendChild(historyItem);
  });
}

// 显示图片列表
function displayImageList(container) {
  container.innerHTML = '';
  
  if (!globalData.images || globalData.images.length === 0) {
    container.innerHTML = '<p>暂无图片，请添加。</p>';
    return;
  }
  
  globalData.images.forEach((image, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.description;
    
    const text = document.createElement('p');
    text.textContent = image.description;
    
    const rarityText = document.createElement('p');
    rarityText.textContent = ['普通', '稀有', '超稀有'][image.rarity - 1];
    rarityText.style.color = ['#888', '#5d9', '#f5a'][image.rarity - 1];
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.addEventListener('click', async function() {
      // 刷新数据
      await loadData();
      
      // 找到当前索引
      const currentIndex = globalData.images.findIndex(img => 
        img.url === image.url && img.description === image.description
      );
      
      if (currentIndex !== -1) {
        globalData.images.splice(currentIndex, 1);
        
        const saveSuccess = await saveData();
        if (saveSuccess) {
          displayImageList(container);
        } else {
          alert('删除失败，请重试');
        }
      }
    });
    
    imageItem.appendChild(img);
    imageItem.appendChild(text);
    imageItem.appendChild(rarityText);
    imageItem.appendChild(deleteButton);
    
    container.appendChild(imageItem);
  });
}

// 检查管理员权限
function checkAdminAuth() {
  const savedPassword = localStorage.getItem('adminPassword');
  
  if (savedPassword === CONFIG.adminPassword) {
    isAdmin = true;
    return true;
  }
  
  const password = prompt('请输入管理员密码:');
  
  if (password === CONFIG.adminPassword) {
    localStorage.setItem('adminPassword', password);
    isAdmin = true;
    return true;
  } else {
    alert('密码错误！将返回主页');
    return false;
  }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('admin.html')) {
    initAdminPage();
  } else {
    initGashaponPage();
  }
});
