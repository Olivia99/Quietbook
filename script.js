// 电子安静书制作工具 JavaScript

// ==================== 房间模板组件系统 ====================

// 房间模板管理器
class RoomTemplateManager {
    constructor() {
        this.templateClasses = new Map(); // 存储模板类
        this.pageTemplates = new Map(); // 存储每个页面的模板实例
        this.currentPageNum = 1;
        this.currentTemplateId = 'basic-room'; // 当前选中的模板ID
        this.container = null;
    }
    
    // 注册模板
    registerTemplate(templateInstance) {
        // 从实例中获取构造函数
        const TemplateClass = templateInstance.constructor;
        this.templateClasses.set(templateInstance.id, TemplateClass);
    }
    
    // 设置容器
    setContainer(container) {
        this.container = container;
    }
    
    // 设置当前页面
    setCurrentPage(pageNum) {
        this.currentPageNum = pageNum;
    }
    
    // 切换到指定模板
    switchToTemplate(templateId) {
        console.log(`切换到模板 ${templateId}，当前页面: ${this.currentPageNum}`);
        
        // 更新当前模板ID
        this.currentTemplateId = templateId;
        
        const TemplateClass = this.templateClasses.get(templateId);
        if (TemplateClass && this.container) {
            // 获取当前页面的模板实例键
            const pageTemplateKey = `${this.currentPageNum}-${templateId}`;
            console.log(`页面模板键: ${pageTemplateKey}`);
            
            // 检查是否已有该页面的模板实例
            let templateInstance = this.pageTemplates.get(pageTemplateKey);
            
            if (!templateInstance) {
                // 创建新的模板实例
                templateInstance = new TemplateClass();
                this.pageTemplates.set(pageTemplateKey, templateInstance);
                console.log(`为页面 ${this.currentPageNum} 创建新的模板实例: ${templateId}`);
                console.log(`新模板实例:`, templateInstance);
                console.log(`模板实例ID:`, templateInstance.id);
                console.log(`新模板初始状态 - 墙纸: ${templateInstance.wallpaper}, 地板: ${templateInstance.floor}`);
            } else {
                console.log(`使用页面 ${this.currentPageNum} 的现有模板实例: ${templateId}`);
                console.log(`现有模板实例:`, templateInstance);
                console.log(`模板实例ID:`, templateInstance.id);
                console.log(`模板当前状态 - 墙纸: ${templateInstance.wallpaper}, 地板: ${templateInstance.floor}`);
            }
            
            console.log(`所有模板实例键:`, Array.from(this.pageTemplates.keys()));
            console.log(`当前页面模板键: ${pageTemplateKey}`);
            
            console.log(`当前模板实例:`, templateInstance);
            
            // 清空容器并渲染模板
            this.container.innerHTML = '';
            templateInstance.render(this.container);
            
            // 获取当前纸张尺寸
            const currentSize = getCurrentPaperSize();
            
            // 使用模板的默认方向
            const templateOrientation = templateInstance.orientation;
            
            // 更新纸张预览的方向
            updatePaperPreviewOrientation(currentSize, templateOrientation);
            
            // 更新方向选择器的状态
            updateOrientationRadio(templateOrientation);
            
            return true;
        }
        return false;
    }
    
    // 获取当前模板
    getCurrentTemplate() {
        // 使用当前页面号和模板ID构建精确的键
        const pageTemplateKey = `${this.currentPageNum}-${this.currentTemplateId}`;
        console.log(`获取当前模板，键: ${pageTemplateKey}`);
        
        const template = this.pageTemplates.get(pageTemplateKey);
        if (template) {
            console.log(`找到模板实例:`, template);
            console.log(`模板状态 - 墙纸: ${template.wallpaper}, 地板: ${template.floor}`);
        } else {
            console.log(`未找到模板实例，键: ${pageTemplateKey}`);
            console.log(`现有模板实例键:`, Array.from(this.pageTemplates.keys()));
        }
        
        return template || null;
    }
    
    // 获取当前模板ID
    getCurrentTemplateId() {
        return this.currentTemplateId;
    }
    
    // 获取所有模板
    getAllTemplates() {
        return Array.from(this.templateClasses.keys());
    }
    
    // 应用设置到当前模板
    applyToCurrentTemplate(method, ...args) {
        const currentTemplate = this.getCurrentTemplate();
        if (currentTemplate && typeof currentTemplate[method] === 'function') {
            currentTemplate[method](...args);
        }
    }
    
    // 清理指定页面的模板实例
    clearPageTemplate(pageNum) {
        const keysToDelete = [];
        for (const key of this.pageTemplates.keys()) {
            if (key.startsWith(`${pageNum}-`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.pageTemplates.delete(key));
    }
}

// 全局模板管理器实例
const templateManager = new RoomTemplateManager();

// ==================== 具体模板组件 ====================

// 模板类将从单独的文件中加载

// 注册模板（在DOM加载完成后执行）
document.addEventListener('DOMContentLoaded', function() {
    // 注册基础房间模板
    templateManager.registerTemplate(new BasicRoomTemplate());
    
    // 注册双房间模板
    templateManager.registerTemplate(new DualRoomTemplate());
});

// ==================== 主程序 ====================

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const paperPreview = document.getElementById('paperPreview');
    const templateContainer = document.getElementById('templateContainer');
    const paperSizeRadios = document.querySelectorAll('input[name="paperSize"]');
    const orientationRadios = document.querySelectorAll('input[name="orientation"]');
    const templateSelect = document.getElementById('templateSelect');
    
    // 设置模板管理器容器
    templateManager.setContainer(templateContainer);
    
    // 初始化页面
    initializePage();
    
    // 事件监听器
    paperSizeRadios.forEach(radio => {
        radio.addEventListener('change', handlePaperSizeChange);
    });
    
    orientationRadios.forEach(radio => {
        radio.addEventListener('change', handleOrientationChange);
    });
    
    // 模板选择器事件监听器
    templateSelect.addEventListener('change', handleTemplateChange);
    
    // 按钮事件监听
    const generateBtn = document.querySelector('.btn-primary');
    const saveBtn = document.querySelector('.btn-secondary');
    const exportBtn = document.querySelector('.btn-success');
    
    if (generateBtn) generateBtn.addEventListener('click', generatePage);
    if (saveBtn) saveBtn.addEventListener('click', saveSettings);
    if (exportBtn) exportBtn.addEventListener('click', exportPDF);
    
    // 初始化页面函数
    function initializePage() {
        // 默认加载基础房间模板
        templateManager.switchToTemplate('basic-room');
        
        // 添加页面加载动画
        const paperPreview = document.getElementById('paperPreview');
        if (paperPreview) {
            setTimeout(() => {
                paperPreview.style.transform = 'scale(1)';
                paperPreview.style.opacity = '1';
            }, 300);
        }
        
        console.log('电子安静书制作工具已加载完成');
    }
    
    // 处理模板变化
    function handleTemplateChange(event) {
        const selectedTemplate = event.target.value;
        
        // 切换到选中的模板（会自动设置模板的默认方向）
        templateManager.switchToTemplate(selectedTemplate);
        
        // 自动保存当前页面状态
        autoSaveCurrentPageState();
        
        // 控制房间切换tab的显示/隐藏
        const roomTabs = document.getElementById('roomTabs');
        if (roomTabs) {
            if (selectedTemplate === 'dual-room') {
                roomTabs.style.display = 'flex';
                // 初始化房间切换功能
                initRoomSwitching();
            } else {
                roomTabs.style.display = 'none';
            }
        }
        
        // 显示切换提示
        showNotification(`已切换到模板: ${event.target.options[event.target.selectedIndex].text}`);
        
        console.log(`切换到模板: ${selectedTemplate}`);
    }
    
    // 处理纸张尺寸变化
    function handlePaperSizeChange(event) {
        const selectedSize = event.target.value;
        const paperPreview = document.getElementById('paperPreview');
        
        if (!paperPreview) return;
        
        // 添加过渡动画
        paperPreview.style.transform = 'scale(0.95)';
        paperPreview.style.opacity = '0.7';
        
        setTimeout(() => {
            // 获取当前方向设置
            const currentOrientation = getCurrentOrientation();
            
            // 更新纸张预览
            updatePaperPreviewOrientation(selectedSize, currentOrientation);
            
            // 恢复动画
            paperPreview.style.transform = 'scale(1)';
            paperPreview.style.opacity = '1';
            
            // 显示切换提示
            showNotification(`已切换到 ${selectedSize.toUpperCase()} 尺寸`);
            
            // 自动保存当前页面状态
            autoSaveCurrentPageState();
        }, 200);
    }
    
    // 处理方向变化
    function handleOrientationChange(event) {
        const orientation = event.target.value;
        const paperPreview = document.getElementById('paperPreview');
        
        if (!paperPreview) return;
        
        // 添加过渡动画
        paperPreview.style.transform = 'scale(0.95)';
        paperPreview.style.opacity = '0.7';
        
        setTimeout(() => {
            // 获取当前纸张尺寸
            const currentSize = getCurrentPaperSize();
            
            // 更新纸张预览
            updatePaperPreviewOrientation(currentSize, orientation);
            
            // 恢复动画
            paperPreview.style.transform = 'scale(1)';
            paperPreview.style.opacity = '1';
            
            // 显示切换提示
            showNotification(`页面方向已设置为: ${orientation === 'portrait' ? '竖向' : '横向'}`);
            
            // 自动保存当前页面状态
            autoSaveCurrentPageState();
        }, 200);
    }
    
    // 更新纸张信息
    function updatePaperInfo() {
        const activityArea = document.querySelector('.activity-area');
        if (!activityArea) return;
        
        const currentSize = getCurrentPaperSize();
        const sizeInfo = getPaperSizeInfo(currentSize);
        
        // 更新活动区域内容
        activityArea.innerHTML = `
            <h3>安静书页面</h3>
            <p>纸张尺寸: ${sizeInfo.name}</p>
            <p>尺寸规格: ${sizeInfo.dimensions}</p>
            <div class="placeholder-content">
                <div class="placeholder-item">拖拽元素到这里</div>
                <div class="placeholder-item">添加互动元素</div>
                <div class="placeholder-item">设计学习活动</div>
            </div>
        `;
    }
    

    
    // 获取纸张尺寸信息
    function getPaperSizeInfo(size) {
        const sizeInfo = {
            'letter': {
                name: 'Letter',
                dimensions: '8.5" × 11" (216 × 279 mm)'
            },
            'a4': {
                name: 'A4',
                dimensions: '210 × 297 mm (8.27" × 11.69")'
            }
        };
        
        return sizeInfo[size] || sizeInfo['letter'];
    }
    
    // 生成页面功能
    function generatePage() {
        showNotification('正在生成新页面...', 'info');
        
        setTimeout(() => {
            updatePaperInfo();
            showNotification('新页面已生成！', 'success');
        }, 1000);
    }
    
    // 保存设置功能
    function saveSettings() {
        const settings = {
            paperSize: getCurrentPaperSize(),
            orientation: getCurrentOrientation()
        };
        
        localStorage.setItem('quietBookSettings', JSON.stringify(settings));
        showNotification('设置已保存！', 'success');
    }
    
    // 导出PDF功能
    async function exportPDF() {
        let progressNotification = null;
        
        try {
            // 检查必要的库是否加载
            if (typeof html2canvas === 'undefined') {
                showNotification('html2canvas库未加载，请刷新页面重试', 'error');
                return;
            }
            
            if (typeof window.jspdf === 'undefined') {
                showNotification('jsPDF库未加载，请刷新页面重试', 'error');
                return;
            }
            
            progressNotification = showNotification('正在准备PDF导出...', 'info');
            
            // 获取预览区域元素
            const paperPreview = document.getElementById('paperPreview');
            if (!paperPreview) {
                showNotification('找不到预览区域，请确保页面已正确加载', 'error');
                return;
            }
            
            // 检查预览区域是否有内容
            if (paperPreview.offsetWidth === 0 || paperPreview.offsetHeight === 0) {
                showNotification('预览区域为空，无法导出PDF', 'error');
                return;
            }
            
            // 获取当前纸张设置
            const paperSize = getCurrentPaperSize();
            const orientation = getCurrentOrientation();
            
            // 定义纸张尺寸（毫米）
            const paperSizes = {
                'letter': { width: 216, height: 279 },
                'a4': { width: 210, height: 297 }
            };
            
            const size = paperSizes[paperSize] || paperSizes['letter'];
            
            // 根据方向调整尺寸
            let pdfWidth, pdfHeight;
            if (orientation === 'landscape') {
                pdfWidth = size.height;
                pdfHeight = size.width;
            } else {
                pdfWidth = size.width;
                pdfHeight = size.height;
            }
            
            showNotification('正在截取页面内容...', 'info');
            
            // 使用html2canvas截取预览区域
            const canvas = await html2canvas(paperPreview, {
                backgroundColor: '#ffffff',
                scale: 3, // 提高清晰度到3倍
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: paperPreview.offsetWidth,
                height: paperPreview.offsetHeight,
                removeContainer: true,
                imageTimeout: 15000,
                onclone: function(clonedDoc) {
                    // 确保克隆的文档样式正确
                    const clonedElement = clonedDoc.getElementById('paperPreview');
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.transition = 'none';
                    }
                }
            });
            
            showNotification('正在生成PDF文档...', 'info');
            
            // 创建PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: orientation === 'landscape' ? 'l' : 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });
            
            // 计算图片在PDF中的尺寸，保持宽高比
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // 使用更精确的比例计算
            const widthRatio = pdfWidth / imgWidth;
            const heightRatio = pdfHeight / imgHeight;
            const ratio = Math.min(widthRatio, heightRatio);
            
            const scaledWidth = imgWidth * ratio;
            const scaledHeight = imgHeight * ratio;
            
            // 计算居中位置
            const x = (pdfWidth - scaledWidth) / 2;
            const y = (pdfHeight - scaledHeight) / 2;
            
            showNotification('正在处理图像数据...', 'info');
            
            // 将canvas转换为图片并添加到PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95); // 使用JPEG格式，质量95%
            pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);
            
            // 生成文件名
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const templateName = templateManager.currentTemplate ? templateManager.currentTemplate.name : '未知模板';
            const filename = `安静书_${templateName}_${paperSize.toUpperCase()}_${orientation}_${timestamp}.pdf`;
            
            showNotification('正在保存PDF文件...', 'info');
            
            // 保存PDF
            pdf.save(filename);
            
            showNotification(`PDF导出成功！文件名: ${filename}`, 'success');
            
        } catch (error) {
            console.error('PDF导出失败:', error);
            
            // 提供更详细的错误信息
            let errorMessage = 'PDF导出失败';
            if (error.message) {
                if (error.message.includes('html2canvas')) {
                    errorMessage = '页面截图失败，请检查页面内容';
                } else if (error.message.includes('jsPDF')) {
                    errorMessage = 'PDF生成失败，请重试';
                } else {
                    errorMessage = `导出失败: ${error.message}`;
                }
            }
            
            showNotification(errorMessage, 'error');
        }
    }
    

    
    // 加载保存的设置
    function loadSavedSettings() {
        try {
            const savedSettings = localStorage.getItem('quietBookSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // 恢复纸张尺寸设置
                const paperSizeRadio = document.querySelector(`input[name="paperSize"][value="${settings.paperSize}"]`);
                if (paperSizeRadio) {
                    paperSizeRadio.checked = true;
                    handlePaperSizeChange({ target: paperSizeRadio });
                }
                
                // 恢复页面方向设置
                if (settings.orientation) {
                    const orientationRadio = document.querySelector(`input[name="orientation"][value="${settings.orientation}"]`);
                    if (orientationRadio) {
                        orientationRadio.checked = true;
                        handleOrientationChange({ target: orientationRadio });
                    }
                }
                

                
                showNotification('已加载保存的设置', 'success');
            }
        } catch (error) {
            console.error('加载设置时出错:', error);
        }
    }
    
    // 页面加载完成后加载保存的设置
    setTimeout(loadSavedSettings, 500);
    
    // 标签页系统逻辑
    initTabSystem();
    
    // 初始化墙纸网格
    initWallpaperGrid();
    
    // 初始化地板选择
    initFloorSelection();
    
    // 初始化踢脚线颜色控制
    initBaseboardColorControls();
    
    // 初始化PDF导航组件
    initPDFNavigation();
});

// 获取当前纸张尺寸
function getCurrentPaperSize() {
    const checkedRadio = document.querySelector('input[name="paperSize"]:checked');
    return checkedRadio ? checkedRadio.value : 'letter';
}

// 获取当前页面方向
function getCurrentOrientation() {
    const checkedRadio = document.querySelector('input[name="orientation"]:checked');
    return checkedRadio ? checkedRadio.value : 'portrait';
}

// 更新纸张预览的方向
function updatePaperPreviewOrientation(size, orientation) {
    const paperPreview = document.getElementById('paperPreview');
    if (paperPreview) {
        paperPreview.className = `paper-preview ${size} ${orientation}`;
    }
}

// 更新方向选择器的状态
function updateOrientationRadio(orientation) {
    const orientationRadios = document.querySelectorAll('input[name="orientation"]');
    orientationRadios.forEach(radio => {
        radio.checked = radio.value === orientation;
    });
}

// 显示通知消息
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // 根据类型设置背景色
    const colors = {
        'info': '#3498db',
        'success': '#2ecc71',
        'warning': '#f39c12',
        'error': '#e74c3c'
    };
    
    notification.style.backgroundColor = colors[type] || colors['info'];
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动移除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 标签页系统初始化
function initTabSystem() {
    // 主标签页切换
    const mainTabs = document.querySelectorAll('.main-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log('找到主标签数量:', mainTabs.length);
    
    mainTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            console.log('点击主标签:', targetTab);
            
            // 移除所有活动状态
            mainTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 激活当前标签
            tab.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
    
    // 装修标签页切换
    const decorationTabs = document.querySelectorAll('.decoration-tab');
    const decorationContents = document.querySelectorAll('.decoration-content');
    
    console.log('找到装修标签数量:', decorationTabs.length);
    
    decorationTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetDecoration = tab.dataset.decoration;
            console.log('点击装修标签:', targetDecoration);
            
            // 移除所有活动状态
            decorationTabs.forEach(t => t.classList.remove('active'));
            decorationContents.forEach(content => content.classList.remove('active'));
            
            // 激活当前标签
            tab.classList.add('active');
            document.getElementById(`${targetDecoration}-decoration`).classList.add('active');
        });
    });
    
    // 家装子标签切换
    const homeSubtabs = document.querySelectorAll('.home-subtab');
    const roomContents = document.querySelectorAll('.room-content');
    
    console.log('找到家装子标签数量:', homeSubtabs.length);
    
    homeSubtabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetRoom = tab.dataset.room;
            console.log('点击家装子标签:', targetRoom);
            
            // 移除所有活动状态
            homeSubtabs.forEach(t => t.classList.remove('active'));
            roomContents.forEach(content => content.classList.remove('active'));
            
            // 激活当前标签
            tab.classList.add('active');
            document.getElementById(`${targetRoom}-content`).classList.add('active');
        });
    });
    
    // 软装二级标签切换
    const softTabs = document.querySelectorAll('.soft-tab');
    const softContents = document.querySelectorAll('.soft-content');
    
    console.log('找到软装标签数量:', softTabs.length);
    console.log('找到软装内容数量:', softContents.length);
    
    softTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSoft = tab.dataset.soft;
            console.log('点击软装标签:', targetSoft);
            
            // 移除所有活动状态
            softTabs.forEach(t => t.classList.remove('active'));
            softContents.forEach(content => content.classList.remove('active'));
            
            // 激活当前标签
            tab.classList.add('active');
            const targetContent = document.getElementById(`${targetSoft}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
                console.log('激活内容区域:', `${targetSoft}-content`);
            } else {
                console.error('找不到目标内容区域:', `${targetSoft}-content`);
            }
            
            // 如果切换到墙纸标签，重新初始化墙纸网格以确保事件正确绑定
            if (targetSoft === 'wallpaper') {
                console.log('切换到墙纸标签页，重新初始化墙纸网格...');
                setTimeout(() => {
                    initWallpaperGrid();
                }, 100); // 短暂延迟确保DOM更新完成
            }
        });
    });
}

// 初始化墙纸网格
function initWallpaperGrid() {
    console.log('=== 开始初始化墙纸网格 ===');
    const wallpaperGrid = document.getElementById('wallpaper-grid');
    console.log('墙纸网格容器:', wallpaperGrid);
    
    if (!wallpaperGrid) {
        console.error('找不到墙纸网格容器！');
        return;
    }
    
    // 清空现有内容，避免重复初始化
    wallpaperGrid.innerHTML = '';
    
    // 生成墙纸项目（001.png 到 117.png）
    console.log('开始生成墙纸项目...');
    for (let i = 1; i <= 117; i++) {
        const wallpaperNumber = String(i).padStart(3, '0');
        const wallpaperItem = document.createElement('div');
        wallpaperItem.className = 'wallpaper-item';
        wallpaperItem.dataset.wallpaper = wallpaperNumber;
        
        const img = document.createElement('img');
        img.src = `assets/软装/wallpaper/${wallpaperNumber}.png`;
        img.alt = `墙纸 ${wallpaperNumber}`;
        img.loading = 'lazy'; // 懒加载优化
        
        // 图片加载错误处理
        img.onerror = function() {
            this.parentElement.innerHTML = `<span style="font-size: 0.7rem; color: #94a3b8;">${wallpaperNumber}</span>`;
        };
        
        wallpaperItem.appendChild(img);
        
        // 添加名字标签
        const wallpaperName = document.createElement('span');
        wallpaperName.className = 'wallpaper-name';
        wallpaperName.textContent = `墙纸 ${wallpaperNumber}`;
        wallpaperItem.appendChild(wallpaperName);
        
        // 点击选择墙纸
        wallpaperItem.addEventListener('click', () => {
            console.log('=== 墙纸点击事件触发 ===');
            console.log('点击的墙纸元素:', wallpaperItem);
            console.log('墙纸编号:', wallpaperItem.dataset.wallpaper);
            
            // 移除其他选中状态
            document.querySelectorAll('.wallpaper-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // 选中当前墙纸
            wallpaperItem.classList.add('selected');
            
            // 应用墙纸到房间预览
            const wallpaperNumber = wallpaperItem.dataset.wallpaper;
            console.log(`准备应用墙纸: ${wallpaperNumber}`);
            applyWallpaperToRoom(wallpaperNumber);
            
            console.log(`选择了墙纸: ${wallpaperNumber}`);
            showNotification(`已选择墙纸 ${wallpaperNumber}`, 'success');
            console.log('=== 墙纸点击事件处理完成 ===');
        });
        
        wallpaperGrid.appendChild(wallpaperItem);
    }
}




// 重新绑定墙纸选择事件
function rebindWallpaperSelection() {
    const wallpaperItems = document.querySelectorAll('.wallpaper-item');
    
    wallpaperItems.forEach(item => {
        // 移除原有的点击事件监听器，添加新的
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', () => {
            // 移除其他选中状态
            document.querySelectorAll('.wallpaper-item').forEach(i => {
                i.classList.remove('selected');
            });
            
            // 选中当前墙纸
            newItem.classList.add('selected');
            
            // 应用墙纸到房间预览
            applyWallpaperToRoom(newItem.dataset.wallpaper);
            
            showNotification(`已选择墙纸 ${newItem.dataset.wallpaper}`, 'success');
        });
    });
}

// 应用墙纸到房间预览
function applyWallpaperToRoom(wallpaperNumber) {
    console.log('=== 开始应用墙纸到房间 ===');
    const currentPage = pdfNavigation ? pdfNavigation.getCurrentPage() : '未知';
    console.log(`应用墙纸 ${wallpaperNumber} 到当前页面 ${currentPage}`);
    
    // 获取当前模板实例
    const currentTemplate = templateManager.getCurrentTemplate();
    console.log(`当前模板实例:`, currentTemplate);
    console.log(`模板ID: ${currentTemplate?.id}, 页面: ${currentPage}`);
    
    // 使用模板管理器应用墙纸
    console.log('调用 templateManager.applyToCurrentTemplate...');
    templateManager.applyToCurrentTemplate('applyWallpaper', wallpaperNumber);
    console.log('模板应用完成，准备自动保存状态...');
    
    // 自动保存当前页面状态
    autoSaveCurrentPageState();
    console.log('=== 墙纸应用流程完成 ===');
}

// 初始化地板选择功能
function initFloorSelection() {
    // 创建地板图片数据（使用实际图片）
    const floorPatterns = [];
    
    // 生成地板图片列表（001.png 到 093.png）
    for (let i = 1; i <= 93; i++) {
        const floorNumber = i.toString().padStart(3, '0');
        floorPatterns.push({
            id: `floor${floorNumber}`,
            name: `地板 ${floorNumber}`,
            imagePath: `assets/软装/floor/${floorNumber}.png`
        });
    }
    
    // 在地板内容区域添加地板选择器
    const floorContent = document.getElementById('floor-content');
    if (floorContent) {
        const floorGrid = document.createElement('div');
        floorGrid.className = 'floor-grid';
        floorGrid.innerHTML = '<h4>选择地板</h4>';
        
        const gridContainer = document.createElement('div');
        gridContainer.className = 'floor-options';
        
        floorPatterns.forEach(pattern => {
            const floorOption = document.createElement('div');
            floorOption.className = 'floor-option';
            floorOption.dataset.floorId = pattern.id;
            
            // 创建图片元素作为背景
            const floorImage = document.createElement('img');
            floorImage.src = pattern.imagePath;
            floorImage.alt = pattern.name;
            floorImage.style.width = '100%';
            floorImage.style.height = '100%';
            floorImage.style.objectFit = 'cover';
            
            floorOption.appendChild(floorImage);
            floorOption.innerHTML += `<span class="floor-name">${pattern.name}</span>`;
            
            floorOption.addEventListener('click', () => {
                // 移除其他选中状态
                document.querySelectorAll('.floor-option').forEach(option => {
                    option.classList.remove('selected');
                });
                
                // 选中当前地板
                floorOption.classList.add('selected');
                
                // 应用地板到房间预览
                applyFloorToRoom(pattern);
                
                showNotification(`已选择${pattern.name}`, 'success');
            });
            
            gridContainer.appendChild(floorOption);
        });
        
        floorGrid.appendChild(gridContainer);
        floorContent.appendChild(floorGrid);
    }
}

// 应用地板到房间预览
function applyFloorToRoom(floorPattern) {
    // 从图片路径中提取文件名（不含扩展名）
    const fileName = floorPattern.imagePath.split('/').pop().replace('.png', '');
    const currentPage = pdfNavigation ? pdfNavigation.getCurrentPage() : '未知';
    console.log(`应用地板 ${fileName} 到当前页面 ${currentPage}`);
    
    // 获取当前模板实例
    const currentTemplate = templateManager.getCurrentTemplate();
    console.log(`当前模板实例:`, currentTemplate);
    console.log(`模板ID: ${currentTemplate?.id}, 页面: ${currentPage}`);
    
    // 使用模板管理器应用地板
    templateManager.applyToCurrentTemplate('applyFloor', fileName);
    
    // 自动保存当前页面状态
    autoSaveCurrentPageState();
}

// 颜色调整辅助函数
function adjustColor(color, amount) {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

// 房间切换功能
function initRoomSwitching() {
    const roomTabs = document.querySelectorAll('.room-tab');
    
    roomTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const roomNumber = parseInt(e.target.dataset.room);
            selectRoom(roomNumber);
        });
    });
}

function selectRoom(roomNumber) {
    // 更新tab的激活状态
    const roomTabs = document.querySelectorAll('.room-tab');
    roomTabs.forEach(tab => {
        tab.classList.remove('active');
        if (parseInt(tab.dataset.room) === roomNumber) {
            tab.classList.add('active');
        }
    });
    
    // 通知当前模板选择了哪个房间
    const currentTemplate = templateManager.getCurrentTemplate();
    if (currentTemplate && typeof currentTemplate.selectRoom === 'function') {
        currentTemplate.selectRoom(roomNumber);
    }
    
    // 自动保存当前页面状态（房间切换也是状态变化）
    autoSaveCurrentPageState();
}

// 初始化踢脚线颜色控制
function initBaseboardColorControls() {
    const borderColorInput = document.getElementById('baseboard-border-color');
    const fillColorInput = document.getElementById('baseboard-fill-color');
    const borderColorPreview = document.getElementById('border-color-preview');
    const fillColorPreview = document.getElementById('fill-color-preview');
    const applyButton = document.getElementById('apply-baseboard-colors');
    
    // 初始化颜色预览
    function updateColorPreviews() {
        if (borderColorPreview) {
            borderColorPreview.style.backgroundColor = borderColorInput.value;
        }
        if (fillColorPreview) {
            fillColorPreview.style.backgroundColor = fillColorInput.value;
        }
    }
    
    // 监听颜色变化
    if (borderColorInput) {
        borderColorInput.addEventListener('input', updateColorPreviews);
    }
    if (fillColorInput) {
        fillColorInput.addEventListener('input', updateColorPreviews);
    }
    
    // 应用踢脚线颜色
    if (applyButton) {
        applyButton.addEventListener('click', () => {
            const borderColor = borderColorInput.value;
            const fillColor = fillColorInput.value;
            
            console.log('应用踢脚线颜色:', { borderColor, fillColor });
            
            // 通过模板管理器应用踢脚线颜色
            templateManager.applyToCurrentTemplate('applyBaseboardColors', borderColor, fillColor);
            
            // 自动保存当前页面状态
            autoSaveCurrentPageState();
            
            showNotification('踢脚线颜色已应用', 'success');
        });
    }
    
    // 初始化颜色预览
    updateColorPreviews();
}

// ==================== PDF导航组件功能 ====================

let pdfNavigation = null;

/**
 * 初始化PDF导航组件
 */
async function initPDFNavigation() {
    try {
        // 动态加载PDF导航组件的HTML
        const response = await fetch('components/pdf-navigation.html');
        const htmlContent = await response.text();
        
        // 将组件HTML插入到容器中
        const container = document.getElementById('pdfNavigationContainer');
        if (container) {
            container.innerHTML = htmlContent;
            
            // 初始化PDF导航组件实例
            pdfNavigation = new PDFNavigation('pageNavigation');
            
            // 设置回调函数
            setupPDFNavigationCallbacks();
            
            // 设置模板管理器的当前页面
            templateManager.setCurrentPage(pdfNavigation.getCurrentPage());
            
            console.log('PDF导航组件初始化成功');
            showNotification('PDF导航组件已加载', 'success');
        } else {
            console.error('找不到PDF导航容器');
        }
    } catch (error) {
        console.error('PDF导航组件初始化失败:', error);
        showNotification('PDF导航组件加载失败', 'error');
    }
}

/**
 * 设置PDF导航组件的回调函数
 */
function setupPDFNavigationCallbacks() {
    if (!pdfNavigation) return;
    
    // 页面切换回调
    pdfNavigation.onPageChange((pageNum, oldPageNum) => {
        console.log(`页面切换回调: 从第${oldPageNum}页切换到第${pageNum}页`);
        
        // 如果提供了oldPageNum，说明这是从PDF导航组件触发的切换
        if (oldPageNum !== undefined) {
            // 保存旧页面的状态
            const currentState = getCurrentPageState();
            if (currentState) {
                pdfNavigation.saveCurrentPageState(currentState);
                console.log(`已保存第${oldPageNum}页的状态:`, currentState);
            }
            
            // 更新模板管理器的当前页面号
            templateManager.setCurrentPage(pageNum);
            
            // 获取并应用新页面的数据
            const targetPageData = pdfNavigation.getPageData(pageNum);
            if (targetPageData) {
                console.log(`应用第${pageNum}页的数据:`, targetPageData);
                applyPageDataToDisplay(targetPageData);
            } else {
                console.error(`无法找到第${pageNum}页的数据`);
            }
        } else {
            // 兼容旧的调用方式
            saveCurrentPageStateAndSwitchTo(pageNum);
        }
        
        showNotification(`已切换到第 ${pageNum} 页`, 'info');
    });
    
    // 添加页面回调
    pdfNavigation.onPageAdd((pageNum, pageData) => {
        console.log(`添加了第 ${pageNum} 页，包含独立装饰数据`);
        
        // 更新模板管理器的当前页面号
        templateManager.setCurrentPage(pageNum);
        
        // 新页面已经有独立的数据结构，应用到当前显示
        applyPageDataToDisplay(pageData);
        
        showNotification(`已添加第 ${pageNum} 页`, 'success');
    });
    
    // 删除页面回调
    pdfNavigation.onPageDelete((pageNum) => {
        console.log(`删除了第 ${pageNum} 页`);
        
        // 清理被删除页面的模板实例
        templateManager.clearPageTemplate(pageNum);
        
        // 更新模板管理器的当前页面号
        templateManager.setCurrentPage(pdfNavigation.getCurrentPage());
        
        showNotification(`已删除第 ${pageNum} 页`, 'info');
    });
}

/**
 * 获取PDF导航组件实例
 */
function getPDFNavigation() {
    return pdfNavigation;
}

/**
 * 获取当前页面数据
 */
function getCurrentPageData() {
    if (!pdfNavigation) return null;
    
    const currentPage = pdfNavigation.getCurrentPage();
    return pdfNavigation.getPageData(currentPage);
}

/**
 * 保存当前页面数据
 */
function saveCurrentPageData(data) {
    if (!pdfNavigation) return;
    
    const currentPage = pdfNavigation.getCurrentPage();
    pdfNavigation.setPageData(currentPage, data);
}

/**
 * 获取当前页面的装饰状态
 */
function getCurrentPageState() {
    if (!pdfNavigation) return null;
    
    const currentTemplate = templateManager.getCurrentTemplate();
    const currentPage = pdfNavigation.getCurrentPage();
    
    console.log(`获取页面 ${currentPage} 的状态，当前模板:`, currentTemplate);
    
    // 收集当前页面的状态
    const state = {
        templateId: templateManager.getCurrentTemplateId(), // 使用模板管理器的当前模板ID
        paperSize: getCurrentPaperSize(),
        orientation: getCurrentOrientation(),
        decorations: {},
        roomStates: {}
    };
    
    // 如果是双房间模板，收集房间状态
    if (currentTemplate && currentTemplate.id === 'dual-room') {
        const selectedRoom = document.querySelector('.room-tab.active')?.dataset.room || '1';
        state.roomStates = {
            selectedRoom: parseInt(selectedRoom),
            room1: {
                wallpaper: currentTemplate.roomStates[1]?.wallpaper || null,
                floor: currentTemplate.roomStates[1]?.floor || null,
                baseboardBorderColor: currentTemplate.roomStates[1]?.baseboardBorderColor || '#000000',
                baseboardFillColor: currentTemplate.roomStates[1]?.baseboardFillColor || '#D9D9D9'
            },
            room2: {
                wallpaper: currentTemplate.roomStates[2]?.wallpaper || null,
                floor: currentTemplate.roomStates[2]?.floor || null,
                baseboardBorderColor: currentTemplate.roomStates[2]?.baseboardBorderColor || '#000000',
                baseboardFillColor: currentTemplate.roomStates[2]?.baseboardFillColor || '#D9D9D9'
            }
        };
    } else {
        // 单房间模板的状态 - 从模板实例获取状态，而不是从DOM获取
        state.decorations = {
            wallpaper: currentTemplate ? currentTemplate.wallpaper : null,
            floor: currentTemplate ? currentTemplate.floor : null,
            baseboard: {
                borderColor: currentTemplate ? currentTemplate.baseboardBorderColor : '#8B4513',
                fillColor: currentTemplate ? currentTemplate.baseboardFillColor : '#D2B48C'
            }
        };
        
        console.log(`从模板实例获取的装饰状态:`, {
            wallpaper: currentTemplate?.wallpaper,
            floor: currentTemplate?.floor,
            baseboardBorderColor: currentTemplate?.baseboardBorderColor,
            baseboardFillColor: currentTemplate?.baseboardFillColor
        });
    }
    
    console.log(`页面 ${currentPage} 的最终状态:`, state);
    return state;
}

/**
 * 保存当前页面状态并切换到指定页面
 */
function saveCurrentPageStateAndSwitchTo(targetPageNum) {
    if (!pdfNavigation) return;
    
    const currentPageNum = pdfNavigation.getCurrentPage();
    console.log(`页面切换: 从第${currentPageNum}页切换到第${targetPageNum}页`);
    
    // 保存当前页面状态
    const currentState = getCurrentPageState();
    if (currentState) {
        pdfNavigation.saveCurrentPageState(currentState);
        console.log('已保存当前页面状态:', currentState);
    }
    
    // 更新模板管理器的当前页面号
    templateManager.setCurrentPage(targetPageNum);
    
    // 获取目标页面数据并应用
    const targetPageData = pdfNavigation.getPageData(targetPageNum);
    if (targetPageData) {
        console.log('目标页面数据:', targetPageData);
        applyPageDataToDisplay(targetPageData);
        console.log('已应用目标页面数据');
    } else {
        console.error(`无法找到第${targetPageNum}页的数据`);
    }
}

/**
 * 将页面数据应用到当前显示
 */
function applyPageDataToDisplay(pageData) {
    if (!pageData) {
        console.error('页面数据为空，无法应用');
        return;
    }
    
    const currentPage = pdfNavigation ? pdfNavigation.getCurrentPage() : '未知';
    console.log(`应用页面 ${currentPage} 的保存数据到显示:`, pageData);
    
    // 切换到对应的模板
    if (pageData.templateId) {
        console.log(`切换到模板: ${pageData.templateId}`);
        templateManager.switchToTemplate(pageData.templateId);
        
        // 更新模板选择器的状态
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect) {
            templateSelect.value = pageData.templateId;
        }
    }
    
    // 恢复纸张尺寸和方向
    if (pageData.paperSize) {
        const paperSizeRadio = document.querySelector(`input[name="paperSize"][value="${pageData.paperSize}"]`);
        if (paperSizeRadio) {
            paperSizeRadio.checked = true;
        }
    }
    
    if (pageData.orientation) {
        const orientationRadio = document.querySelector(`input[name="orientation"][value="${pageData.orientation}"]`);
        if (orientationRadio) {
            orientationRadio.checked = true;
        }
        // 更新纸张预览
        updatePaperPreviewOrientation(pageData.paperSize || getCurrentPaperSize(), pageData.orientation);
    }
    
    // 等待模板切换完成后强制应用保存的装饰数据
    setTimeout(() => {
        const currentTemplate = templateManager.getCurrentTemplate();
        if (!currentTemplate) {
            console.error('当前模板为空，无法应用装饰');
            return;
        }
        
        console.log('强制应用保存的页面数据到模板:', currentTemplate);
        console.log('保存的页面数据:', pageData);
        
        if (pageData.templateId === 'dual-room' && pageData.roomStates) {
            // 双房间模板：强制应用保存的房间状态
            console.log('强制应用保存的双房间状态:', pageData.roomStates);
            applyRoomStatesToTemplate(currentTemplate, pageData.roomStates);
            
            // 切换到选中的房间
            if (pageData.roomStates.selectedRoom) {
                selectRoom(pageData.roomStates.selectedRoom);
            }
        } else if (pageData.decorations) {
            // 单房间模板：强制应用保存的装饰状态
            console.log('强制应用保存的单房间装饰:', pageData.decorations);
            console.log('保存的装饰状态 - 墙纸:', pageData.decorations.wallpaper, '地板:', pageData.decorations.floor);
            
            // 强制覆盖模板实例状态
            applyDecorationsToTemplate(currentTemplate, pageData.decorations);
            
            console.log('强制应用后模板状态 - 墙纸:', currentTemplate.wallpaper, '地板:', currentTemplate.floor);
            
            // 恢复DOM中的选择状态
            restoreUISelectionState(pageData.decorations);
        }
    }, 100);
}

/**
 * 将房间状态应用到双房间模板
 */
function applyRoomStatesToTemplate(template, roomStates) {
    if (!template || !roomStates) return;
    
    console.log('应用房间状态到双房间模板:', roomStates);
    
    // 更新模板的内部状态
    if (roomStates.room1) {
        template.roomStates[1] = { ...template.roomStates[1], ...roomStates.room1 };
    }
    
    if (roomStates.room2) {
        template.roomStates[2] = { ...template.roomStates[2], ...roomStates.room2 };
    }
    
    // 应用房间1的装饰
    if (roomStates.room1) {
        template.selectedRoom = 1;
        // 应用墙纸（包括null值清除）
        if (roomStates.room1.hasOwnProperty('wallpaper')) {
            template.applyWallpaper(roomStates.room1.wallpaper);
        }
        // 应用地板（包括null值清除）
        if (roomStates.room1.hasOwnProperty('floor')) {
            template.applyFloor(roomStates.room1.floor);
        }
        // 应用踢脚线颜色
        if (roomStates.room1.baseboardBorderColor && roomStates.room1.baseboardFillColor) {
            template.applyBaseboardColors(roomStates.room1.baseboardBorderColor, roomStates.room1.baseboardFillColor);
        }
    }
    
    // 应用房间2的装饰
    if (roomStates.room2) {
        template.selectedRoom = 2;
        // 应用墙纸（包括null值清除）
        if (roomStates.room2.hasOwnProperty('wallpaper')) {
            template.applyWallpaper(roomStates.room2.wallpaper);
        }
        // 应用地板（包括null值清除）
        if (roomStates.room2.hasOwnProperty('floor')) {
            template.applyFloor(roomStates.room2.floor);
        }
        // 应用踢脚线颜色
        if (roomStates.room2.baseboardBorderColor && roomStates.room2.baseboardFillColor) {
            template.applyBaseboardColors(roomStates.room2.baseboardBorderColor, roomStates.room2.baseboardFillColor);
        }
    }
    
    // 恢复选中的房间
    if (roomStates.selectedRoom) {
        template.selectedRoom = roomStates.selectedRoom;
    }
}

/**
 * 将装饰状态应用到单房间模板
 */
function applyDecorationsToTemplate(template, decorations) {
    if (!template || !decorations) return;
    
    console.log('应用装饰状态到单房间模板:', decorations);
    
    // 应用壁纸（包括null值清除）
    if (decorations.hasOwnProperty('wallpaper') && typeof template.applyWallpaper === 'function') {
        template.applyWallpaper(decorations.wallpaper);
    }
    
    // 应用地板（包括null值清除）
    if (decorations.hasOwnProperty('floor') && typeof template.applyFloor === 'function') {
        template.applyFloor(decorations.floor);
    }
    
    // 应用踢脚线颜色
    if (decorations.baseboard && typeof template.applyBaseboardColors === 'function') {
        template.applyBaseboardColors(decorations.baseboard.borderColor, decorations.baseboard.fillColor);
    }
}

/**
 * 自动保存当前页面状态
 */
function autoSaveCurrentPageState() {
    if (!pdfNavigation) return;
    
    console.log('开始自动保存页面状态...');
    const currentTemplate = templateManager.getCurrentTemplate();
    console.log('保存前模板状态 - 墙纸:', currentTemplate?.wallpaper, '地板:', currentTemplate?.floor);
    
    // 延迟保存，确保DOM更新完成
    setTimeout(() => {
        const currentState = getCurrentPageState();
        if (currentState) {
            console.log('获取到的当前状态:', currentState);
            pdfNavigation.saveCurrentPageState(currentState);
            console.log('自动保存页面状态完成:', currentState);
            
            // 验证保存后的页面数据
            const savedPageData = pdfNavigation.getPageData(pdfNavigation.getCurrentPage());
            console.log('保存后的页面数据:', savedPageData);
        }
    }, 50);
}

/**
 * 恢复UI中的选择状态
 */
function restoreUISelectionState(decorations) {
    console.log('恢复UI选择状态:', decorations);
    
    // 清除所有选中状态
    document.querySelectorAll('.wallpaper-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('.floor-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 恢复墙纸选择状态
    if (decorations.wallpaper) {
        const wallpaperItem = document.querySelector(`.wallpaper-item[data-wallpaper="${decorations.wallpaper}"]`);
        if (wallpaperItem) {
            wallpaperItem.classList.add('selected');
            console.log(`恢复墙纸选择: ${decorations.wallpaper}`);
        }
    }
    
    // 恢复地板选择状态
    if (decorations.floor) {
        const floorOption = document.querySelector(`.floor-option[data-floor-id="floor${decorations.floor}"]`);
        if (floorOption) {
            floorOption.classList.add('selected');
            console.log(`恢复地板选择: floor${decorations.floor}`);
        }
    }
    
    // 恢复踢脚线颜色
    if (decorations.baseboard) {
        const borderColorInput = document.getElementById('baseboard-border-color');
        const fillColorInput = document.getElementById('baseboard-fill-color');
        
        if (borderColorInput && decorations.baseboard.borderColor) {
            borderColorInput.value = decorations.baseboard.borderColor;
        }
        if (fillColorInput && decorations.baseboard.fillColor) {
            fillColorInput.value = decorations.baseboard.fillColor;
        }
        
        // 更新颜色预览
        const borderColorPreview = document.getElementById('border-color-preview');
        const fillColorPreview = document.getElementById('fill-color-preview');
        if (borderColorPreview) {
            borderColorPreview.style.backgroundColor = decorations.baseboard.borderColor;
        }
        if (fillColorPreview) {
            fillColorPreview.style.backgroundColor = decorations.baseboard.fillColor;
        }
        
        console.log('恢复踢脚线颜色:', decorations.baseboard);
    }
}