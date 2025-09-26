/**
 * PDF页面导航组件
 * 提供页面导航、添加页面、删除页面等功能
 */
class PDFNavigation {
    constructor(containerId = 'pageNavigation') {
        this.container = document.getElementById(containerId);
        this.currentPage = 1;
        this.totalPages = 1;
        this.pages = [this.createNewPageData(1)]; // 存储页面数据
        this.onPageChangeCallback = null;
        this.onPageAddCallback = null;
        this.onPageDeleteCallback = null;
        this.selectedPageForContext = null; // 右键菜单选中的页面
        
        this.init();
    }
    
    /**
     * 获取当前unified-paper-settings的设置值
     */
    getCurrentPaperSettings() {
        // 获取当前模板选择
        const templateSelect = document.getElementById('templateSelect');
        const currentTemplateId = templateSelect ? templateSelect.value : 'basic-room';
        
        // 获取当前纸张尺寸
        const paperSizeRadio = document.querySelector('input[name="paperSize"]:checked');
        const currentPaperSize = paperSizeRadio ? paperSizeRadio.value : 'letter';
        
        // 获取当前方向
        const orientationRadio = document.querySelector('input[name="orientation"]:checked');
        const currentOrientation = orientationRadio ? orientationRadio.value : 'portrait';
        
        console.log(`获取当前纸张设置 - 模板: ${currentTemplateId}, 尺寸: ${currentPaperSize}, 方向: ${currentOrientation}`);
        
        return {
            templateId: currentTemplateId,
            paperSize: currentPaperSize,
            orientation: currentOrientation
        };
    }

    /**
     * 创建新页面的数据结构
     */
    createNewPageData(pageId) {
        // 获取当前unified-paper-settings的设置
        const currentSettings = this.getCurrentPaperSettings();
        
        // 使用JSON深拷贝确保每个页面都有独立的对象引用
        const defaultData = {
            id: pageId,
            templateId: currentSettings.templateId, // 使用当前选择的模板
            paperSize: currentSettings.paperSize, // 使用当前选择的纸张尺寸
            orientation: currentSettings.orientation, // 使用当前选择的方向
            decorations: {
                wallpaper: null,
                floor: null,
                baseboard: {
                    borderColor: '#8B4513',
                    fillColor: '#D2B48C'
                }
            },
            roomStates: {
                // 双房间模板的房间状态
                room1: {
                    wallpaper: null,
                    floor: null,
                    baseboardBorderColor: '#8B4513',
                    baseboardFillColor: '#D2B48C'
                },
                room2: {
                    wallpaper: null,
                    floor: null,
                    baseboardBorderColor: '#8B4513',
                    baseboardFillColor: '#D2B48C'
                },
                selectedRoom: 1
            },
            content: null,
            createdAt: new Date().toISOString()
        };
        
        console.log(`创建新页面 ${pageId} 的数据，使用当前设置:`, defaultData);
        
        // 返回深拷贝的对象，确保每个页面数据完全独立
        return JSON.parse(JSON.stringify(defaultData));
    }
    
    /**
     * 初始化组件
     */
    init() {
        if (!this.container) {
            console.error('PDF Navigation container not found');
            return;
        }
        
        // 清除可能存在的静态HTML内容（包括静态的删除按钮）
        const thumbnailsContainer = this.container.querySelector('#pageThumbnails');
        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = '';
        }
        
        // 重新创建第一页的缩略图
        this.createThumbnail(1);
        
        this.bindEvents();
        this.updateDisplay();
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 添加页面按钮
        const addPageBtn = this.container.querySelector('#addPageBtn');
        if (addPageBtn) {
            addPageBtn.addEventListener('click', async () => await this.addPage());
        }

        // 复制页面按钮
        const copyPageBtn = document.querySelector('#copyPageBtn');
        if (copyPageBtn) {
            copyPageBtn.addEventListener('click', async () => await this.copyPage(this.currentPage));
        }
        
        // 页面缩略图点击事件（事件委托）
        const thumbnailsContainer = this.container.querySelector('#pageThumbnails');
        if (thumbnailsContainer) {
            thumbnailsContainer.addEventListener('click', (e) => {
                // 处理删除按钮点击
                if (e.target.classList.contains('delete-page-btn')) {
                    // 阻止事件冒泡和默认行为，防止触发页面切换
                    e.stopPropagation();
                    e.preventDefault();
                    
                    // 获取页面编号并调用删除方法
                    const pageNum = parseInt(e.target.dataset.page);
                    if (!isNaN(pageNum)) {
                        // 直接调用删除方法，不使用setTimeout
                        this.deletePage(pageNum);
                    }
                } 
                // 处理缩略图点击（切换页面）
                else if (e.target.closest('.page-thumbnail')) {
                    const thumbnail = e.target.closest('.page-thumbnail');
                    const pageNum = parseInt(thumbnail.dataset.page);
                    if (!isNaN(pageNum)) {
                        this.switchToPage(pageNum);
                    }
                }
            });

            // 右键菜单事件
            thumbnailsContainer.addEventListener('contextmenu', (e) => {
                const thumbnail = e.target.closest('.page-thumbnail');
                if (thumbnail) {
                    e.preventDefault();
                    const pageNum = parseInt(thumbnail.dataset.page);
                    if (!isNaN(pageNum)) {
                        this.showContextMenu(e, pageNum);
                    }
                }
            });
        }

        // 绑定右键菜单功能
        this.bindContextMenuEvents();
    }
    
    /**
     * 添加新页面
     */
    async addPage() {
        this.totalPages++;
        const newPageId = this.totalPages;
        
        // 创建新页面的完整数据结构
        const newPageData = this.createNewPageData(newPageId);
        this.pages.push(newPageData);
        
        // 创建新的缩略图
        await this.createThumbnail(newPageId);
        
        // 切换到新页面
        this.switchToPage(newPageId);
        
        // 更新显示
        this.updateDisplay();
        
        // 触发回调，传递新页面的完整数据
        if (this.onPageAddCallback) {
            this.onPageAddCallback(newPageId, newPageData);
        }
        
        console.log(`添加了第 ${newPageId} 页，包含独立的装饰数据`);
    }
    
    /**
     * 删除页面
     */
    deletePage(pageNum) {
        // 基本验证
        if (this.totalPages <= 1) {
            alert('至少需要保留一页');
            return false;
        }
        
        if (pageNum < 1 || pageNum > this.totalPages) {
            console.error(`无效的页面编号: ${pageNum}`);
            return false;
        }
        
        try {
            // 直接执行删除操作，不显示确认对话框
            
            // 从数据中移除页面
            this.pages = this.pages.filter(page => page.id !== pageNum);
            
            // 移除DOM中的缩略图
            const thumbnail = this.container.querySelector(`.page-thumbnail[data-page="${pageNum}"]`);
            if (thumbnail) {
                thumbnail.remove();
            }
            
            // 更新页面编号和总页数
            this.reorderPages();
            
            // 处理当前页面的切换
            if (this.currentPage === pageNum) {
                this.switchToPage(1);
            } else if (this.currentPage > pageNum) {
                this.currentPage--;
            }
            
            // 更新显示
            this.updateDisplay();
            
            // 触发回调
            if (this.onPageDeleteCallback) {
                this.onPageDeleteCallback(pageNum);
            }
            
            return true;
        } catch (error) {
            console.error(`删除页面时发生错误:`, error);
            return false;
        }
    }
    
    /**
     * 重新排序页面
     */
    reorderPages() {
        // 获取所有缩略图并重新编号
        const thumbnails = this.container.querySelectorAll('.page-thumbnail');
        thumbnails.forEach((thumbnail, index) => {
            const newPageNum = index + 1;
            thumbnail.dataset.page = newPageNum;
            thumbnail.querySelector('.page-number').textContent = newPageNum;
            thumbnail.querySelector('.delete-page-btn').dataset.page = newPageNum;
        });
        
        // 重新排序页面数据
        this.pages = this.pages.map((page, index) => ({
            ...page,
            id: index + 1
        }));
        
        // 更新总页数，确保与实际显示的缩略图数量一致
        this.totalPages = thumbnails.length;
    }
    
    /**
     * 切换到指定页面
     */
    switchToPage(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) {
            return;
        }
        
        // 如果切换到的是当前页面，则不需要处理
        if (pageNum === this.currentPage) {
            return;
        }
        
        const oldPageNum = this.currentPage;
        console.log(`页面切换: 从第${oldPageNum}页切换到第${pageNum}页`);
        
        // 触发页面切换回调（包含状态保存和恢复逻辑）
        if (this.onPageChangeCallback) {
            this.onPageChangeCallback(pageNum, oldPageNum);
        }
        
        // 更新当前页面
        this.currentPage = pageNum;
        
        // 更新缩略图状态
        this.container.querySelectorAll('.page-thumbnail').forEach(thumbnail => {
            thumbnail.classList.remove('active');
        });
        
        const activeThumbnail = this.container.querySelector(`[data-page="${pageNum}"]`);
        if (activeThumbnail) {
            activeThumbnail.classList.add('active');
        }
        
        // 更新页面计数显示
        this.updatePageCount();
        
        console.log(`已切换到第 ${pageNum} 页`);
    }
    
    /**
     * 创建页面缩略图
     */
    async createThumbnail(pageNum) {
        const thumbnailsContainer = this.container.querySelector('#pageThumbnails');
        if (!thumbnailsContainer) return;
        
        // 获取页面数据以确定纸张尺寸和方向
        const pageData = this.getPageData(pageNum);
        const paperSize = pageData?.paperSize || 'a4';
        const orientation = pageData?.orientation || 'portrait';
        
        // 计算缩略图尺寸，保持纸张比例
        const { width: thumbnailWidth, height: thumbnailHeight } = this.calculateThumbnailSize(paperSize, orientation);
        
        const thumbnail = document.createElement('div');
        thumbnail.className = 'page-thumbnail';
        if (pageNum === this.currentPage) {
            thumbnail.classList.add('active');
        }
        thumbnail.dataset.page = pageNum;
        
        // 设置缩略图尺寸
        thumbnail.style.width = `${thumbnailWidth}px`;
        thumbnail.style.height = `${thumbnailHeight}px`;
        
        thumbnail.innerHTML = `
            <div class="page-preview-mini" style="width: 100%; height: 100%; position: relative;">
                <canvas class="thumbnail-canvas" width="${thumbnailWidth * 2}" height="${thumbnailHeight * 2}" 
                        style="width: 100%; height: 100%; object-fit: contain;"></canvas>
                <div class="page-number-overlay">${pageNum}</div>
            </div>
            <div class="page-actions">
                <button class="delete-page-btn" title="删除页面" data-page="${pageNum}">×</button>
            </div>
        `;
        
        console.log(`创建了页面 ${pageNum} 的缩略图`);
        thumbnailsContainer.appendChild(thumbnail);
        
        // 生成缩略图内容
        await this.generateThumbnailContent(pageNum);
    }
    
    /**
     * 计算缩略图尺寸，保持纸张比例
     */
    calculateThumbnailSize(paperSize, orientation) {
        // 定义纸张尺寸比例
        const paperRatios = {
            'a4': { width: 210, height: 297 },
            'letter': { width: 216, height: 279 }
        };
        
        const ratio = paperRatios[paperSize] || paperRatios['a4'];
        let width = ratio.width;
        let height = ratio.height;
        
        // 根据方向调整
        if (orientation === 'landscape') {
            [width, height] = [height, width];
        }
        
        // 缩放到合适的缩略图尺寸（最大宽度80px）
        const maxWidth = 80;
        const scale = maxWidth / width;
        
        return {
            width: Math.round(width * scale),
            height: Math.round(height * scale)
        };
    }
    
    /**
     * 生成缩略图内容
     */
    async generateThumbnailContent(pageNum) {
        try {
            const thumbnail = this.container.querySelector(`[data-page="${pageNum}"]`);
            if (!thumbnail) return;
            
            const canvas = thumbnail.querySelector('.thumbnail-canvas');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            // 保存当前页面状态
            const originalCurrentPage = this.currentPage;
            const needsPageSwitch = pageNum !== this.currentPage;
            
            if (needsPageSwitch) {
                // 临时切换到目标页面以获取其内容
                await this.switchToPageForThumbnail(pageNum);
            }
            
            // 等待页面渲染
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 获取paper-preview元素
            const paperPreview = document.getElementById('paperPreview');
            if (!paperPreview) {
                this.drawPlaceholderThumbnail(ctx, canvas.width, canvas.height, pageNum);
                return;
            }
            
            // 使用html2canvas截取paper-preview内容
            if (typeof html2canvas !== 'undefined') {
                const previewCanvas = await html2canvas(paperPreview, {
                    backgroundColor: '#ffffff',
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    width: paperPreview.offsetWidth,
                    height: paperPreview.offsetHeight
                });
                
                // 将截图绘制到缩略图canvas上
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(previewCanvas, 0, 0, canvas.width, canvas.height);
            } else {
                this.drawPlaceholderThumbnail(ctx, canvas.width, canvas.height, pageNum);
            }
            
            // 恢复原始页面
            if (needsPageSwitch && originalCurrentPage !== pageNum) {
                await this.switchToPageForThumbnail(originalCurrentPage);
            }
            
        } catch (error) {
            console.error(`生成页面 ${pageNum} 缩略图失败:`, error);
            // 绘制错误占位符
            const thumbnail = this.container.querySelector(`[data-page="${pageNum}"]`);
            if (thumbnail) {
                const canvas = thumbnail.querySelector('.thumbnail-canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    this.drawPlaceholderThumbnail(ctx, canvas.width, canvas.height, pageNum);
                }
            }
        }
    }
    
    /**
     * 为缩略图切换页面（不触发回调）
     */
    async switchToPageForThumbnail(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) return;
        
        const pageData = this.getPageData(pageNum);
        if (pageData && typeof window.applyPageDataToDisplay === 'function') {
            window.applyPageDataToDisplay(pageData);
        }
    }
    
    /**
     * 绘制占位符缩略图
     */
    drawPlaceholderThumbnail(ctx, width, height, pageNum) {
        // 清除画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制背景
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制边框
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        // 绘制页面编号
        ctx.fillStyle = '#495057';
        ctx.font = `${Math.min(width, height) * 0.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pageNum.toString(), width / 2, height / 2);
    }
    
    /**
     * 更新缩略图内容
     */
    async updateThumbnail(pageNum) {
        await this.generateThumbnailContent(pageNum);
    }
    
    /**
     * 更新当前页面的缩略图
     */
    async updateCurrentThumbnail() {
        await this.updateThumbnail(this.currentPage);
    }
    
    /**
     * 更新显示
     */
    updateDisplay() {
        // 确保总页数与实际缩略图数量一致
        const thumbnails = this.container.querySelectorAll('.page-thumbnail');
        if (this.totalPages !== thumbnails.length) {
            this.totalPages = thumbnails.length;
        }
        
        // 更新页码显示
        this.updatePageCount();
    }
    
    /**
     * 更新页面计数显示
     */
    updatePageCount() {
        const currentPageSpan = this.container.querySelector('#currentPageNumber');
        const totalPageSpan = this.container.querySelector('#totalPageCount');
        
        if (currentPageSpan) {
            currentPageSpan.textContent = this.currentPage;
        }
        
        if (totalPageSpan) {
            totalPageSpan.textContent = this.totalPages;
        }
    }
    
    /**
     * 设置页面切换回调
     */
    onPageChange(callback) {
        this.onPageChangeCallback = callback;
    }
    
    /**
     * 设置页面添加回调
     */
    onPageAdd(callback) {
        this.onPageAddCallback = callback;
    }
    
    /**
     * 设置页面删除回调
     */
    onPageDelete(callback) {
        this.onPageDeleteCallback = callback;
    }
    
    /**
     * 获取当前页面
     */
    getCurrentPage() {
        return this.currentPage;
    }
    
    /**
     * 获取总页数
     */
    getTotalPages() {
        return this.totalPages;
    }
    
    /**
     * 获取页面数据
     */
    getPageData(pageNum) {
        const pageData = this.pages.find(page => page.id === pageNum);
        console.log(`获取页面 ${pageNum} 的数据:`, pageData);
        return pageData;
    }
    
    /**
     * 设置页面数据
     */
    setPageData(pageNum, data) {
        const page = this.pages.find(page => page.id === pageNum);
        if (page) {
            page.content = data;
        }
    }
    
    /**
     * 获取页面的装饰状态
     */
    getPageDecorations(pageNum) {
        const page = this.pages.find(page => page.id === pageNum);
        return page ? page.decorations : null;
    }
    
    /**
     * 设置页面的装饰状态
     */
    setPageDecorations(pageNum, decorations) {
        const page = this.pages.find(page => page.id === pageNum);
        if (page) {
            page.decorations = { ...page.decorations, ...decorations };
        }
    }
    
    /**
     * 获取页面的房间状态
     */
    getPageRoomStates(pageNum) {
        const page = this.pages.find(page => page.id === pageNum);
        return page ? page.roomStates : null;
    }
    
    /**
     * 设置页面的房间状态
     */
    setPageRoomStates(pageNum, roomStates) {
        const page = this.pages.find(page => page.id === pageNum);
        if (page) {
            page.roomStates = { ...page.roomStates, ...roomStates };
        }
    }
    
    /**
     * 获取页面的模板ID
     */
    getPageTemplateId(pageNum) {
        const page = this.pages.find(page => page.id === pageNum);
        return page ? page.templateId : null;
    }
    
    /**
     * 设置页面的模板ID
     */
    setPageTemplateId(pageNum, templateId) {
        const page = this.pages.find(page => page.id === pageNum);
        if (page) {
            page.templateId = templateId;
        }
    }
    
    /**
     * 获取当前页面的完整数据
     */
    getCurrentPageData() {
        return this.getPageData(this.currentPage);
    }
    
    /**
     * 保存当前页面的状态
     */
    saveCurrentPageState(state) {
        const page = this.pages.find(page => page.id === this.currentPage);
        console.log(`保存页面 ${this.currentPage} 的状态:`, state);
        console.log(`保存前页面数据:`, JSON.parse(JSON.stringify(page)));
        
        if (page) {
            // 使用深拷贝合并状态数据，确保状态完全独立
            if (state.decorations) {
                page.decorations = JSON.parse(JSON.stringify({ ...page.decorations, ...state.decorations }));
            }
            if (state.roomStates) {
                page.roomStates = JSON.parse(JSON.stringify({ ...page.roomStates, ...state.roomStates }));
            }
            if (state.templateId) {
                page.templateId = state.templateId;
            }
            if (state.paperSize) {
                page.paperSize = state.paperSize;
            }
            if (state.orientation) {
                page.orientation = state.orientation;
            }
            
            console.log(`保存后页面数据:`, JSON.parse(JSON.stringify(page)));
        }
    }

    /**
     * 绑定右键菜单事件
     */
    bindContextMenuEvents() {
        const contextMenu = document.getElementById('contextMenu');
        const copyMenuItem = document.getElementById('copyPageMenuItem');

        if (copyMenuItem) {
            copyMenuItem.addEventListener('click', () => {
                this.hideContextMenu();
                if (this.selectedPageForContext) {
                    this.copyPage(this.selectedPageForContext);
                }
            });
        }

        // 点击其他地方隐藏菜单
        document.addEventListener('click', (e) => {
            if (contextMenu && !contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // ESC键隐藏菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
            }
        });
    }

    /**
     * 显示右键菜单
     */
    showContextMenu(event, pageNum) {
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) return;

        this.selectedPageForContext = pageNum;

        // 设置菜单位置
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.style.display = 'block';

        // 确保菜单不会超出屏幕边界
        const rect = contextMenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (rect.right > viewportWidth) {
            contextMenu.style.left = `${event.pageX - rect.width}px`;
        }
        if (rect.bottom > viewportHeight) {
            contextMenu.style.top = `${event.pageY - rect.height}px`;
        }
    }

    /**
     * 隐藏右键菜单
     */
    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
        this.selectedPageForContext = null;
    }

    /**
     * 复制页面
     */
    async copyPage(pageNum) {
        try {
            console.log(`复制页面 ${pageNum}`);
            
            // 获取要复制的页面数据
            const sourcePageData = this.getPageData(pageNum);
            if (!sourcePageData) {
                console.error(`页面 ${pageNum} 数据不存在`);
                return;
            }

            // 创建新页面
            const newPageId = this.pages.length + 1;
            const newPageData = this.createNewPageData(newPageId);
            
            // 深拷贝源页面的数据到新页面
            newPageData.decorations = JSON.parse(JSON.stringify(sourcePageData.decorations || {}));
            newPageData.roomStates = JSON.parse(JSON.stringify(sourcePageData.roomStates || {}));
            newPageData.templateId = sourcePageData.templateId;
            newPageData.paperSize = sourcePageData.paperSize;
            newPageData.orientation = sourcePageData.orientation;

            // 添加到页面列表
            this.pages.push(newPageData);

            // 创建缩略图
            await this.createThumbnail(newPageId);

            // 更新显示
            this.updateDisplay();
            this.updatePageCount();

            // 切换到新复制的页面
            this.switchToPage(newPageId);

            // 触发页面添加回调
            if (this.pageAddCallback) {
                this.pageAddCallback(newPageId);
            }

            console.log(`成功复制页面 ${pageNum} 到新页面 ${newPageId}`);
        } catch (error) {
            console.error('复制页面时出错:', error);
        }
    }
    
    /**
     * 销毁组件
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.onPageChangeCallback = null;
        this.onPageAddCallback = null;
        this.onPageDeleteCallback = null;
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFNavigation;
} else if (typeof window !== 'undefined') {
    window.PDFNavigation = PDFNavigation;
}