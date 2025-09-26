/**
 * Dashboard 项目管理系统
 * 管理安静书项目的创建、编辑、删除和展示
 */

class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentView = 'grid'; // 'grid' 或 'list'
        this.currentSort = 'modified';
        this.searchQuery = '';
        
        this.init();
    }

    init() {
        this.loadProjects();
        this.bindEvents();
        this.updateStats();
        this.renderProjects();
        
        // 为没有预览图的现有项目批量生成预览图
        this.generateMissingThumbnails();
    }

    // 从localStorage加载项目数据
    loadProjects() {
        try {
            const savedProjects = localStorage.getItem('quietBookProjects');
            if (savedProjects) {
                this.projects = JSON.parse(savedProjects);
            } else {
                // 如果没有项目数据，创建一个示例项目
                this.createSampleProject();
            }
        } catch (error) {
            console.error('加载项目数据失败:', error);
            this.projects = [];
        }
    }

    // 保存项目数据到localStorage
    saveProjects() {
        try {
            localStorage.setItem('quietBookProjects', JSON.stringify(this.projects));
        } catch (error) {
            console.error('保存项目数据失败:', error);
            this.showNotification('保存失败，请检查存储空间', 'error');
        }
    }

    // 创建示例项目
    createSampleProject() {
        const sampleProject = {
            id: this.generateId(),
            name: '我的第一个安静书',
            description: '这是一个示例项目，展示如何使用安静书制作工具',
            template: 'basic-room',
            paperSize: 'a4',
            orientation: 'portrait',
            pages: 3,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            thumbnail: null,
            exported: false
        };
        
        this.projects.push(sampleProject);
        this.saveProjects();
    }

    // 生成唯一ID
    generateId() {
        return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 绑定事件监听器
    bindEvents() {
        // 创建项目按钮
        document.getElementById('createProjectBtn').addEventListener('click', () => {
            this.showCreateProjectModal();
        });

        // 导入项目按钮
        document.getElementById('importProjectBtn').addEventListener('click', () => {
            this.importProject();
        });

        // 搜索框
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderProjects();
        });

        // 视图切换
        document.getElementById('gridViewBtn').addEventListener('click', () => {
            this.setView('grid');
        });

        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.setView('list');
        });

        // 排序选择
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderProjects();
        });

        // 创建项目表单
        document.getElementById('createProjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });

        // 模态框关闭事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            }
        });
    }

    // 设置视图模式
    setView(view) {
        this.currentView = view;
        
        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(view + 'ViewBtn').classList.add('active');
        
        // 更新容器类名
        const container = document.getElementById('projectsContainer');
        container.className = view === 'grid' ? 'projects-grid' : 'projects-list';
        
        this.renderProjects();
    }

    // 更新统计数据
    updateStats() {
        const totalProjects = this.projects.length;
        const totalPages = this.projects.reduce((sum, project) => sum + (project.pages || 0), 0);
        const recentProjects = this.projects.filter(project => {
            const modifiedDate = new Date(project.modifiedAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return modifiedDate > weekAgo;
        }).length;
        const exportedProjects = this.projects.filter(project => project.exported).length;

        document.getElementById('totalProjects').textContent = totalProjects;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('recentProjects').textContent = recentProjects;
        document.getElementById('exportedProjects').textContent = exportedProjects;
    }

    // 渲染项目列表
    renderProjects() {
        const container = document.getElementById('projectsContainer');
        const emptyState = document.getElementById('emptyState');
        
        // 过滤和排序项目
        let filteredProjects = this.projects.filter(project => {
            if (!this.searchQuery) return true;
            return project.name.toLowerCase().includes(this.searchQuery) ||
                   (project.description && project.description.toLowerCase().includes(this.searchQuery));
        });

        // 排序
        filteredProjects.sort((a, b) => {
            switch (this.currentSort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'created':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'pages':
                    return (b.pages || 0) - (a.pages || 0);
                case 'modified':
                default:
                    return new Date(b.modifiedAt) - new Date(a.modifiedAt);
            }
        });

        if (filteredProjects.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            container.style.display = this.currentView === 'grid' ? 'grid' : 'flex';
            emptyState.style.display = 'none';
            
            container.innerHTML = filteredProjects.map(project => 
                this.currentView === 'grid' ? this.renderProjectCard(project) : this.renderProjectListItem(project)
            ).join('');
        }
    }

    // 渲染项目卡片（网格视图）
    renderProjectCard(project) {
        const modifiedDate = new Date(project.modifiedAt).toLocaleDateString('zh-CN');
        const templateName = this.getTemplateName(project.template);
        
        return `
            <div class="project-card" onclick="projectManager.openProject('${project.id}')">
                <button class="project-details-btn" onclick="event.stopPropagation(); projectManager.showProjectDetails('${project.id}')" title="查看详情">
                    <i class="fas fa-info-circle"></i>
                </button>
                <div class="project-thumbnail">
                    ${project.thumbnail ? 
                        `<img src="${project.thumbnail}" alt="${project.name}">` : 
                        '<i class="fas fa-book-open"></i>'
                    }
                </div>
                <div class="project-info">
                    <h3 class="project-title">${this.escapeHtml(project.name)}</h3>
                    <p class="project-description">${this.escapeHtml(project.description || '暂无描述')}</p>
                    <div class="project-meta">
                        <span><i class="fas fa-file-alt"></i> ${project.pages || 0} 页</span>
                        <span><i class="fas fa-clock"></i> ${modifiedDate}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染项目列表项（列表视图）
    renderProjectListItem(project) {
        const modifiedDate = new Date(project.modifiedAt).toLocaleDateString('zh-CN');
        const templateName = this.getTemplateName(project.template);
        
        return `
            <div class="project-list-item" onclick="projectManager.openProject('${project.id}')">
                <div class="project-list-thumbnail">
                    ${project.thumbnail ? 
                        `<img src="${project.thumbnail}" alt="${project.name}">` : 
                        '<i class="fas fa-book-open"></i>'
                    }
                </div>
                <div class="project-list-content">
                    <h3 class="project-list-title">${this.escapeHtml(project.name)}</h3>
                    <div class="project-list-meta">
                        ${templateName} • ${project.pages || 0} 页 • 修改于 ${modifiedDate}
                    </div>
                </div>
                <div class="project-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-secondary" onclick="projectManager.showProjectDetails('${project.id}')">
                        <i class="fas fa-info-circle"></i> 详情
                    </button>
                </div>
            </div>
        `;
    }

    // 获取模板名称
    getTemplateName(templateId) {
        const templates = {
            'basic-room': '基础房间模板',
            'dual-room': '双房间模板'
        };
        return templates[templateId] || '未知模板';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 显示创建项目模态框
    showCreateProjectModal() {
        document.getElementById('createProjectModal').classList.add('show');
        document.getElementById('projectName').focus();
    }

    // 创建新项目
    createProject() {
        const formData = new FormData(document.getElementById('createProjectForm'));
        
        const project = {
            id: this.generateId(),
            name: formData.get('projectName').trim(),
            description: formData.get('projectDescription').trim(),
            template: formData.get('projectTemplate'),
            paperSize: formData.get('projectPaperSize'),
            orientation: formData.get('projectOrientation'),
            pages: 1,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            thumbnail: null,
            exported: false
        };

        if (!project.name) {
            this.showNotification('请输入项目名称', 'error');
            return;
        }

        this.projects.unshift(project);
        this.saveProjects();
        this.updateStats();
        this.renderProjects();
        this.closeModal('createProjectModal');
        this.showNotification('项目创建成功！正在打开编辑器...', 'success');
        
        // 重置表单
        document.getElementById('createProjectForm').reset();
        
        // 自动打开项目进行编辑
        setTimeout(() => {
            this.openProject(project.id);
        }, 500);
    }

    // 打开项目（跳转到编辑页面）
    openProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            this.showNotification('项目不存在', 'error');
            return;
        }

        // 将项目信息存储到sessionStorage，供编辑页面使用
        sessionStorage.setItem('currentProject', JSON.stringify(project));
        
        // 跳转到编辑页面
        window.location.href = 'index.html?project=' + projectId;
    }

    // 显示项目详情
    showProjectDetails(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            this.showNotification('项目不存在', 'error');
            return;
        }

        const createdDate = new Date(project.createdAt).toLocaleString('zh-CN');
        const modifiedDate = new Date(project.modifiedAt).toLocaleString('zh-CN');
        const templateName = this.getTemplateName(project.template);

        document.getElementById('projectDetailsTitle').textContent = project.name;
        document.getElementById('projectDetailsContent').innerHTML = `
            <div class="project-details">
                <div class="detail-group">
                    <label>项目名称：</label>
                    <span>${this.escapeHtml(project.name)}</span>
                </div>
                <div class="detail-group">
                    <label>项目描述：</label>
                    <span>${this.escapeHtml(project.description || '暂无描述')}</span>
                </div>
                <div class="detail-group">
                    <label>模板类型：</label>
                    <span>${templateName}</span>
                </div>
                <div class="detail-group">
                    <label>纸张尺寸：</label>
                    <span>${project.paperSize.toUpperCase()}</span>
                </div>
                <div class="detail-group">
                    <label>页面方向：</label>
                    <span>${project.orientation === 'portrait' ? '竖向' : '横向'}</span>
                </div>
                <div class="detail-group">
                    <label>页面数量：</label>
                    <span>${project.pages || 0} 页</span>
                </div>
                <div class="detail-group">
                    <label>创建时间：</label>
                    <span>${createdDate}</span>
                </div>
                <div class="detail-group">
                    <label>修改时间：</label>
                    <span>${modifiedDate}</span>
                </div>
                <div class="detail-group">
                    <label>导出状态：</label>
                    <span>${project.exported ? '已导出' : '未导出'}</span>
                </div>
            </div>
        `;

        // 设置按钮事件
        document.getElementById('editProjectBtn').onclick = () => {
            this.closeModal('projectDetailsModal');
            this.openProject(projectId);
        };

        document.getElementById('deleteProjectBtn').onclick = () => {
            this.closeModal('projectDetailsModal');
            this.deleteProject(projectId);
        };

        document.getElementById('projectDetailsModal').classList.add('show');
    }

    // 为没有预览图的项目批量生成预览图
    async generateMissingThumbnails() {
        const projectsWithoutThumbnails = this.projects.filter(project => !project.thumbnail);
        
        if (projectsWithoutThumbnails.length === 0) {
            return; // 所有项目都有预览图
        }

        console.log(`发现 ${projectsWithoutThumbnails.length} 个项目没有预览图，开始批量生成...`);
        
        // 为了避免同时生成太多预览图导致性能问题，我们逐个生成
        for (const project of projectsWithoutThumbnails) {
            try {
                await this.generateThumbnailForProject(project.id);
                // 每个项目之间稍作延迟
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`为项目 ${project.name} 生成预览图失败:`, error);
            }
        }
        
        console.log('批量预览图生成完成');
    }

    // 为单个项目生成预览图
    async generateThumbnailForProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            return;
        }

        return new Promise((resolve, reject) => {
            const projectUrl = `index.html?project=${projectId}`;
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.width = '800px';
            iframe.style.height = '600px';
            iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);
            
            const timeout = setTimeout(() => {
                document.body.removeChild(iframe);
                reject(new Error('生成预览图超时'));
            }, 10000); // 10秒超时
            
            iframe.onload = async () => {
                try {
                    // 等待页面加载完成
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const paperPreview = iframeDoc.querySelector('.paper-preview');
                    
                    if (!paperPreview) {
                        throw new Error('无法找到预览区域');
                    }
                    
                    // 检查html2canvas是否可用
                    if (typeof iframe.contentWindow.html2canvas === 'undefined') {
                        throw new Error('html2canvas库未加载');
                    }
                    
                    // 生成截图
                    const canvas = await iframe.contentWindow.html2canvas(paperPreview, {
                        scale: 0.5,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: paperPreview.offsetWidth,
                        height: paperPreview.offsetHeight
                    });
                    
                    const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
                    
                    // 更新项目数据
                    project.thumbnail = thumbnail;
                    project.modifiedAt = new Date().toISOString();
                    
                    this.saveProjects();
                    this.renderProjects();
                    
                    // 清理
                    clearTimeout(timeout);
                    document.body.removeChild(iframe);
                    
                    console.log(`项目 ${project.name} 预览图生成成功`);
                    resolve();
                    
                } catch (error) {
                    clearTimeout(timeout);
                    document.body.removeChild(iframe);
                    reject(error);
                }
            };
            
            iframe.onerror = () => {
                clearTimeout(timeout);
                document.body.removeChild(iframe);
                reject(new Error('iframe加载失败'));
            };
            
            iframe.src = projectUrl;
        });
    }

    // 删除项目
    deleteProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            this.showNotification('项目不存在', 'error');
            return;
        }

        if (confirm(`确定要删除项目"${project.name}"吗？此操作不可撤销。`)) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.saveProjects();
            this.updateStats();
            this.renderProjects();
            this.showNotification('项目已删除', 'success');
        }
    }

    // 导入项目
    importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const projectData = JSON.parse(e.target.result);
                    
                    // 验证项目数据格式
                    if (!projectData.name || !projectData.template) {
                        throw new Error('无效的项目文件格式');
                    }

                    // 生成新的ID和时间戳
                    projectData.id = this.generateId();
                    projectData.createdAt = new Date().toISOString();
                    projectData.modifiedAt = new Date().toISOString();
                    projectData.name = projectData.name + ' (导入)';

                    this.projects.unshift(projectData);
                    this.saveProjects();
                    this.updateStats();
                    this.renderProjects();
                    this.showNotification('项目导入成功！', 'success');
                } catch (error) {
                    console.error('导入项目失败:', error);
                    this.showNotification('导入失败，请检查文件格式', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // 关闭模态框
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = notification.querySelector('.notification-icon');
        const messageEl = notification.querySelector('.notification-message');

        // 设置图标
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        icon.className = `notification-icon ${icons[type] || icons.info}`;
        messageEl.textContent = message;
        
        // 设置类型样式
        notification.className = `notification ${type}`;
        
        // 显示通知
        notification.classList.add('show');

        // 3秒后自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// 全局函数
function createNewProject() {
    projectManager.showCreateProjectModal();
}

function closeModal(modalId) {
    projectManager.closeModal(modalId);
}

// 初始化项目管理器
let projectManager;

document.addEventListener('DOMContentLoaded', function() {
    projectManager = new ProjectManager();
});

// 添加CSS样式到详情模态框
const detailsStyle = document.createElement('style');
detailsStyle.textContent = `
    .project-details {
        display: grid;
        gap: 1rem;
    }
    
    .detail-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .detail-group:last-child {
        border-bottom: none;
    }
    
    .detail-group label {
        font-weight: 600;
        color: var(--text-secondary);
        margin: 0;
    }
    
    .detail-group span {
        color: var(--text-primary);
        text-align: right;
        max-width: 60%;
        word-break: break-word;
    }
`;
document.head.appendChild(detailsStyle);