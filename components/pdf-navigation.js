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
        
        this.init();
    }
    
    /**
     * 创建新页面的数据结构
     */
    createNewPageData(pageId) {
        // 使用JSON深拷贝确保每个页面都有独立的对象引用
        const defaultData = {
            id: pageId,
            templateId: 'basic-room', // 默认模板
            paperSize: 'letter', // 默认纸张尺寸
            orientation: 'landscape', // 默认方向
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
            addPageBtn.addEventListener('click', () => this.addPage());
        }
        
        // 页面缩略图点击事件（事件委托）
        const thumbnailsContainer = this.container.querySelector('#pageThumbnails');
        if (thumbnailsContainer) {
            thumbnailsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-page-btn')) {
                    const pageNum = parseInt(e.target.dataset.page);
                    this.deletePage(pageNum);
                } else if (e.target.closest('.page-thumbnail')) {
                    const thumbnail = e.target.closest('.page-thumbnail');
                    const pageNum = parseInt(thumbnail.dataset.page);
                    this.switchToPage(pageNum);
                }
            });
        }
    }
    
    /**
     * 添加新页面
     */
    addPage() {
        this.totalPages++;
        const newPageId = this.totalPages;
        
        // 创建新页面的完整数据结构
        const newPageData = this.createNewPageData(newPageId);
        this.pages.push(newPageData);
        
        // 创建新的缩略图
        this.createThumbnail(newPageId);
        
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
        if (this.totalPages <= 1) {
            alert('至少需要保留一页');
            return;
        }
        
        if (confirm(`确定要删除第 ${pageNum} 页吗？`)) {
            // 从页面数据中移除
            this.pages = this.pages.filter(page => page.id !== pageNum);
            
            // 移除缩略图
            const thumbnail = this.container.querySelector(`[data-page="${pageNum}"]`);
            if (thumbnail) {
                thumbnail.remove();
            }
            
            // 更新页面编号
            this.reorderPages();
            
            // 如果删除的是当前页面，切换到第一页
            if (this.currentPage === pageNum) {
                this.switchToPage(1);
            } else if (this.currentPage > pageNum) {
                this.currentPage--;
            }
            
            this.totalPages--;
            this.updateDisplay();
            
            // 触发回调
            if (this.onPageDeleteCallback) {
                this.onPageDeleteCallback(pageNum);
            }
            
            console.log(`删除了第 ${pageNum} 页`);
        }
    }
    
    /**
     * 重新排序页面
     */
    reorderPages() {
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
    }
    
    /**
     * 切换到指定页面
     */
    switchToPage(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) {
            return;
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
        
        // 触发页面切换回调
        if (this.onPageChangeCallback) {
            this.onPageChangeCallback(pageNum);
        }
        
        console.log(`切换到第 ${pageNum} 页`);
    }
    
    /**
     * 创建页面缩略图
     */
    createThumbnail(pageNum) {
        const thumbnailsContainer = this.container.querySelector('#pageThumbnails');
        if (!thumbnailsContainer) return;
        
        const thumbnail = document.createElement('div');
        thumbnail.className = 'page-thumbnail';
        thumbnail.dataset.page = pageNum;
        
        thumbnail.innerHTML = `
            <div class="page-preview-mini">
                <span class="page-number">${pageNum}</span>
            </div>
            <div class="page-actions">
                <button class="delete-page-btn" title="删除页面" data-page="${pageNum}">×</button>
            </div>
        `;
        
        thumbnailsContainer.appendChild(thumbnail);
    }
    
    /**
     * 更新显示
     */
    updateDisplay() {
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