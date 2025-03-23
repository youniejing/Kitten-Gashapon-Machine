// 初始化本地存储
if (!localStorage.getItem('balance')) {
    localStorage.setItem('balance', '100');
}

if (!localStorage.getItem('images')) {
    // 初始图片库
    const defaultImages = [
        {
            url: 'https://i.imgur.com/XBVKoP3.jpg',
            description: '爱心礼物',
            rarity: 1
        },
        {
            url: 'https://i.imgur.com/g40gvCQ.jpg',
            description: '甜蜜时光',
            rarity: 2
        },
        {
            url: 'https://i.imgur.com/gH8GC8h.jpg',
            description: '浪漫回忆',
            rarity: 3
        }
    ];
    localStorage.setItem('images', JSON.stringify(defaultImages));
}

if (!localStorage.getItem('history')) {
    localStorage.setItem('history', JSON.stringify([]));
}

// 公共函数
function updateBalance(element) {
    const balance = localStorage.getItem('balance');
    if (element) {
        element.textContent = balance;
    }
}

function getImages() {
    return JSON.parse(localStorage.getItem('images') || '[]');
}

function getHistory() {
    return JSON.parse(localStorage.getItem('history') || '[]');
}

// 根据当前页面加载不同功能
if (window.location.pathname.includes('admin.html')) {
    loadAdminPage();
} else {
    loadGashaponPage();
}

// 扭蛋机页面功能
function loadGashaponPage() {
    const balanceElement = document.getElementById('balance');
    const drawButton = document.getElementById('draw-button');
    const resultContainer = document.getElementById('result');
    const resultImage = document.getElementById('result-image');
    const resultText = document.getElementById('result-text');
    const closeResultButton = document.getElementById('close-result');
    const historyContainer = document.getElementById('history');

    // 显示余额
    updateBalance(balanceElement);

    // 显示历史记录
    displayHistory();

    // 扭蛋按钮点击事件
    drawButton.addEventListener('click', function() {
        const cost = 10;
        const currentBalance = parseInt(localStorage.getItem('balance'));
        
        if (currentBalance < cost) {
            alert('余额不足！请联系管理员添加硬币。');
            return;
        }
        
        // 扣除硬币
        localStorage.setItem('balance', (currentBalance - cost).toString());
        updateBalance(balanceElement);
        
        // 抽取图片
        const drawnImage = drawRandomImage();
        
        if (drawnImage) {
            // 显示结果
            resultImage.src = drawnImage.url;
            resultText.textContent = drawnImage.description;
            resultContainer.style.display = 'flex';
            
            // 添加到历史记录
            const history = getHistory();
            history.push(drawnImage);
            localStorage.setItem('history', JSON.stringify(history));
            
            // 更新历史显示
            displayHistory();
        } else {
            alert('抽奖失败，请联系管理员添加图片。');
        }
    });

    // 关闭结果弹窗
    closeResultButton.addEventListener('click', function() {
        resultContainer.style.display = 'none';
    });

    // 随机抽取图片逻辑
    function drawRandomImage() {
        const images = getImages();
        if (images.length === 0) return null;

        // 根据稀有度计算概率
        let weightedImages = [];
        images.forEach(image => {
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
    function displayHistory() {
        const history = getHistory();
        historyContainer.innerHTML = '';
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<p>还没有抽到任何图片。</p>';
            return;
        }
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = item.description;
            
            const text = document.createElement('p');
            text.textContent = item.description;
            
            historyItem.appendChild(img);
            historyItem.appendChild(text);
            historyContainer.appendChild(historyItem);
        });
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
    updateBalance(balanceElement);

    // 显示图片列表
    displayImageList();

    // 增加余额
    addBalanceButton.addEventListener('click', function() {
        const amount = parseInt(balanceAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert('请输入有效数量!');
            return;
        }
        
        const currentBalance = parseInt(localStorage.getItem('balance'));
        localStorage.setItem('balance', (currentBalance + amount).toString());
        updateBalance(balanceElement);
        balanceAmountInput.value = '';
    });

    // 减少余额
    reduceBalanceButton.addEventListener('click', function() {
        const amount = parseInt(balanceAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert('请输入有效数量!');
            return;
        }
        
        const currentBalance = parseInt(localStorage.getItem('balance'));
        const newBalance = Math.max(0, currentBalance - amount);
        localStorage.setItem('balance', newBalance.toString());
        updateBalance(balanceElement);
        balanceAmountInput.value = '';
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
        
        const images = getImages();
        images.push({
            url: url,
            description: description,
            rarity: rarity
        });
        
        localStorage.setItem('images', JSON.stringify(images));
        displayImageList();
        
        // 清空输入框
        imageUrlInput.value = '';
        imageDescriptionInput.value = '';
    });

    // 显示图片列表
    function displayImageList() {
        const images = getImages();
        imageListContainer.innerHTML = '';
        
        if (images.length === 0) {
            imageListContainer.innerHTML = '<p>暂无图片，请添加。</p>';
            return;
        }
        
        images.forEach((image, index) => {
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
                images.splice(index, 1);
                localStorage.setItem('images', JSON.stringify(images));
                displayImageList();
            });
            
            imageItem.appendChild(img);
            imageItem.appendChild(text);
            imageItem.appendChild(rarityText);
            imageItem.appendChild(deleteButton);
            
            imageListContainer.appendChild(imageItem);
        });
    }
}
