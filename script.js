// 配置信息 - 修改为你的实际信息
const CONFIG = {
    binId: '67e04c0d8960c979a576f646',  // 例如：60a1b3f59a9aa735a2321c4a
    apiKey: '$2a$10$qFSedI2vR8ip8TiEZgmHb.W2Fg2YinWfC/SNjfvxVkEdDlwPkfN0i', // 例如：$2b$10$xxxxxxxxxxxxxxxxxxxxx
    adminPassword: 'Younj1031'  // 设置一个密码，用于管理员验证
  };
  
  // 全局数据对象
  let globalData = {
    balance: 100,
    images: [],
    history: []
  };
  
  // 检查是否是管理员
  let isAdmin = false;
  
  // 页面加载时获取数据
  async function loadData() {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.binId}/latest`, {
        headers: {
          'X-Master-Key': CONFIG.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('获取数据失败');
      }
      
      const data = await response.json();
      globalData = data.record;
      
      // 根据当前页面加载不同功能
      if (window.location.pathname.includes('admin.html')) {
        checkAdminAuth();
      } else {
        updateUserInterface();
      }
    } catch (error) {
      console.error('加载数据出错:', error);
      alert('加载数据失败，请刷新页面重试');
    }
  }
  
  // 保存数据到JSONBin
  async function saveData() {
    if (!isAdmin) {
      console.log('非管理员无法保存数据');
      return;
    }
    
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': CONFIG.apiKey
        },
        body: JSON.stringify(globalData)
      });
      
      if (!response.ok) {
        throw new Error('保存数据失败');
      }
      
      console.log('数据已成功保存');
    } catch (error) {
      console.error('保存数据出错:', error);
      alert('保存数据失败，请重试');
    }
  }
  
  // 用户界面功能
  function updateUserInterface() {
    const balanceElement = document.getElementById('balance');
    const historyContainer = document.getElementById('history');
    
    // 更新余额显示
    if (balanceElement) {
      balanceElement.textContent = globalData.balance;
    }
    
    // 更新历史记录
    if (historyContainer) {
      displayHistory(historyContainer);
    }
  }
  
  // 扭蛋机页面功能
  function loadGashaponPage() {
    const drawButton = document.getElementById('draw-button');
    const resultContainer = document.getElementById('result');
    const resultImage = document.getElementById('result-image');
    const resultText = document.getElementById('result-text');
    const closeResultButton = document.getElementById('close-result');
    
    // 扭蛋按钮点击事件
    drawButton.addEventListener('click', async function() {
      const cost = 10;
      
      if (globalData.balance < cost) {
        alert('余额不足！请等待管理员添加硬币。');
        return;
      }
      
      // 尝试获取最新数据
      await loadData();
      
      if (globalData.balance < cost) {
        alert('余额不足！请等待管理员添加硬币。');
        return;
      }
      
      // 扣除硬币
      globalData.balance -= cost;
      
      // 抽取图片
      const drawnImage = drawRandomImage();
      
      if (drawnImage) {
        // 显示结果
        resultImage.src = drawnImage.url;
        resultText.textContent = drawnImage.description;
        resultContainer.style.display = 'flex';
        
        // 添加到历史记录
        globalData.history.push({
          ...drawnImage,
          timestamp: new Date().toISOString()
        });
        
        // 更新界面
        updateUserInterface();
        
        // 保存结果
        saveData();
      } else {
        alert('抽奖失败，请联系管理员添加图片。');
      }
    });
    
    // 关闭结果弹窗
    closeResultButton.addEventListener('click', function() {
      resultContainer.style.display = 'none';
    });
  }
  
  // 随机抽取图片逻辑
  function drawRandomImage() {
    if (globalData.images.length === 0) return null;
    
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
    
    if (globalData.history.length === 0) {
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
  
  // 检查管理员权限
  function checkAdminAuth() {
    const savedPassword = localStorage.getItem('adminPassword');
    
    if (savedPassword === CONFIG.adminPassword) {
      isAdmin = true;
      loadAdminPage();
    } else {
      const password = prompt('请输入管理员密码:');
      
      if (password === CONFIG.adminPassword) {
        localStorage.setItem('adminPassword', password);
        isAdmin = true;
        loadAdminPage();
      } else {
        alert('密码错误！将返回主页');
        window.location.href = 'index.html';
      }
    }
  }
  
  // 管理页面功能
  function loadAdminPage() {
    const balanceElement = document.getElementById('admin-balance');
    const balanceAmountInput = document.getElementById('balance-amount');
    const addBalanceButton = document.getElementById('add-balance');
    const reduceBalanceButton = document.getElementById('reduce-balance');
    const imageUrlInput = document.getElementById('image-url');
    const imageDescriptionInput = document.getElementById('image-description');
    const imageRaritySelect = document.getElementById('image-rarity');
    const addImageButton = document.getElementById('add-image');
    const imageListContainer = document.getElementById('image-list');
    
    // 显示余额
    balanceElement.textContent = globalData.balance;
    
    // 显示图片列表
    displayImageList();
    
    // 增加余额
    addBalanceButton.addEventListener('click', function() {
      const amount = parseInt(balanceAmountInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert('请输入有效数量!');
        return;
      }
      
      globalData.balance += amount;
      balanceElement.textContent = globalData.balance;
      balanceAmountInput.value = '';
      
      // 保存更改
      saveData();
    });
    
    // 减少余额
    reduceBalanceButton.addEventListener('click', function() {
      const amount = parseInt(balanceAmountInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert('请输入有效数量!');
        return;
      }
      
      globalData.balance = Math.max(0, globalData.balance - amount);
      balanceElement.textContent = globalData.balance;
      balanceAmountInput.value = '';
      
      // 保存更改
      saveData();
    });
    
    // 添加图片
    addImageButton.addEventListener('click', function() {
      const url = imageUrlInput.value.trim();
      const description = imageDescriptionInput.value.trim();
      const rarity = parseInt(imageRaritySelect.value);
      
      if (!url || !description) {
        alert('请填写图片URL和描述!');
        return;
      }
      
      globalData.images.push({
        url: url,
        description: description,
        rarity: rarity
      });
      
      // 更新界面
      displayImageList();
      
      // 清空输入框
      imageUrlInput.value = '';
      imageDescriptionInput.value = '';
      
      // 保存更改
      saveData();
    });
    
    // 显示图片列表
    function displayImageList() {
      imageListContainer.innerHTML = '';
      
      if (globalData.images.length === 0) {
        imageListContainer.innerHTML = '<p>暂无图片，请添加。</p>';
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
        deleteButton.addEventListener('click', function() {
          globalData.images.splice(index, 1);
          displayImageList();
          
          // 保存更改
          saveData();
        });
        
        imageItem.appendChild(img);
        imageItem.appendChild(text);
        imageItem.appendChild(rarityText);
        imageItem.appendChild(deleteButton);
        
        imageListContainer.appendChild(imageItem);
      });
    }
  }
  
  // 页面加载时初始化
  document.addEventListener('DOMContentLoaded', function() {
    loadData().then(() => {
      if (window.location.pathname.includes('admin.html')) {
        // 管理页面已经在loadData后处理
      } else {
        loadGashaponPage();
      }
    });
  });
  
