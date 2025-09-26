// 房间模板基类
class RoomTemplate {
    constructor(id, name, description, orientation = 'landscape') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.orientation = orientation; // 模板的默认方向
        this.container = null;
        
        // 存储装饰状态
        this.wallpaper = null;
        this.floor = null;
        this.baseboardBorderColor = '#8B4513';
        this.baseboardFillColor = '#D2B48C';
    }
    
    // 克隆模板实例，创建具有相同状态的新实例
    clone() {
        // 创建新的实例
        const cloned = new this.constructor();
        
        // 复制所有状态属性
        cloned.wallpaper = this.wallpaper;
        cloned.floor = this.floor;
        cloned.baseboardBorderColor = this.baseboardBorderColor;
        cloned.baseboardFillColor = this.baseboardFillColor;
        
        console.log(`[模板 ${this.id}] 克隆模板实例`);
        console.log(`[模板 ${this.id}] 原始状态 - 墙纸: ${this.wallpaper}, 地板: ${this.floor}`);
        console.log(`[模板 ${this.id}] 克隆状态 - 墙纸: ${cloned.wallpaper}, 地板: ${cloned.floor}`);
        
        return cloned;
    }
    
    // 从另一个模板实例复制状态
    copyStateFrom(otherTemplate) {
        if (otherTemplate && otherTemplate.id === this.id) {
            this.wallpaper = otherTemplate.wallpaper;
            this.floor = otherTemplate.floor;
            this.baseboardBorderColor = otherTemplate.baseboardBorderColor;
            this.baseboardFillColor = otherTemplate.baseboardFillColor;
            
            console.log(`[模板 ${this.id}] 从其他实例复制状态`);
            console.log(`[模板 ${this.id}] 复制后状态 - 墙纸: ${this.wallpaper}, 地板: ${this.floor}`);
        }
    }
    
    // 创建模板HTML结构
    createHTML() {
        throw new Error('createHTML方法必须在子类中实现');
    }
    
    // 渲染模板到指定容器
    render(container) {
        this.container = container;
        container.innerHTML = this.createHTML();
        this.afterRender();
    }
    
    // 渲染后的初始化工作
    afterRender() {
        // 恢复装饰状态
        this.restoreDecorationStates();
        // 子类可以重写此方法
    }
    
    // 恢复装饰状态到DOM
    restoreDecorationStates() {
        console.log(`[模板 ${this.id}] 恢复装饰状态 - 墙纸: ${this.wallpaper}, 地板: ${this.floor}`);
        
        // 恢复墙纸状态
        if (this.wallpaper !== null && this.wallpaper !== undefined) {
            this.applyWallpaper(this.wallpaper);
        }
        
        // 恢复地板状态
        if (this.floor !== null && this.floor !== undefined) {
            this.applyFloor(this.floor);
        }
        
        // 恢复踢脚线颜色
        if (this.baseboardBorderColor && this.baseboardFillColor) {
            this.applyBaseboardColors(this.baseboardBorderColor, this.baseboardFillColor);
        }
    }
    
    // 应用纸张设置
    applyPaperSettings(size, orientation) {
        if (this.container) {
            const roomContainer = this.container.querySelector('.room-container');
            if (roomContainer) {
                // 移除所有尺寸和方向相关的类
                roomContainer.classList.remove('letter', 'a4', 'vertical', 'horizontal');
                
                // 添加当前纸张尺寸类
                roomContainer.classList.add(size);
                
                // 根据纸张方向设置房间布局
                if (orientation === 'portrait') {
                    roomContainer.classList.add('vertical');
                    roomContainer.style.flexDirection = 'column';
                } else {
                    roomContainer.classList.add('horizontal');
                    roomContainer.style.flexDirection = 'column';
                }
            }
        }
    }
    
    // 应用墙纸
    applyWallpaper(wallpaperNumber) {
        console.log(`[模板 ${this.id}] 应用墙纸: ${wallpaperNumber}`);
        console.log(`[模板 ${this.id}] 容器:`, this.container);
        
        // 存储状态
        this.wallpaper = wallpaperNumber;
        
        if (this.container) {
            const wallpaperAreas = this.container.querySelectorAll('.wallpaper-area');
            console.log(`[模板 ${this.id}] 找到 ${wallpaperAreas.length} 个墙纸区域`);
            
            wallpaperAreas.forEach((area, index) => {
                if (wallpaperNumber === null || wallpaperNumber === undefined) {
                    // 清除墙纸
                    area.style.backgroundImage = 'none';
                    console.log(`[模板 ${this.id}] 清除墙纸区域 ${index}`);
                } else {
                    const wallpaperPath = `assets/软装/wallpaper/${wallpaperNumber}.png`;
                    area.style.backgroundImage = `url('${wallpaperPath}')`;
                    area.style.backgroundSize = 'cover';
                    area.style.backgroundPosition = 'center';
                    area.style.backgroundRepeat = 'no-repeat';
                    console.log(`[模板 ${this.id}] 应用墙纸到区域 ${index}: ${wallpaperPath}`);
                }
            });
        } else {
            console.warn(`[模板 ${this.id}] 容器为空，无法应用墙纸`);
        }
    }
    
    // 应用地板
    applyFloor(floorNumber) {
        console.log(`[模板 ${this.id}] 应用地板: ${floorNumber}`);
        console.log(`[模板 ${this.id}] 容器:`, this.container);
        
        // 存储状态
        this.floor = floorNumber;
        
        if (this.container) {
            const floorAreas = this.container.querySelectorAll('.floor-area');
            console.log(`[模板 ${this.id}] 找到 ${floorAreas.length} 个地板区域`);
            
            floorAreas.forEach((area, index) => {
                if (floorNumber === null || floorNumber === undefined) {
                    // 清除地板
                    area.style.backgroundImage = 'none';
                    console.log(`[模板 ${this.id}] 清除地板区域 ${index}`);
                } else {
                    const floorPath = `assets/软装/floor/${floorNumber}.png`;
                    area.style.backgroundImage = `url('${floorPath}')`;
                    area.style.backgroundSize = 'cover';
                    area.style.backgroundPosition = 'center';
                    area.style.backgroundRepeat = 'no-repeat';
                    console.log(`[模板 ${this.id}] 应用地板到区域 ${index}: ${floorPath}`);
                }
            });
        } else {
            console.warn(`[模板 ${this.id}] 容器为空，无法应用地板`);
        }
    }
    
    // 应用踢脚线颜色
    applyBaseboardColors(borderColor, fillColor) {
        // 存储状态
        this.baseboardBorderColor = borderColor;
        this.baseboardFillColor = fillColor;
        
        if (this.container) {
            const baseboardTops = this.container.querySelectorAll('.baseboard-top');
            const baseboardBottoms = this.container.querySelectorAll('.baseboard-bottom');
            
            console.log('应用踢脚线颜色到基础模板:', { borderColor, fillColor });
            console.log('找到踢脚线元素:', { tops: baseboardTops.length, bottoms: baseboardBottoms.length });
            
            // 应用到上踢脚线
            baseboardTops.forEach(baseboard => {
                baseboard.style.backgroundColor = fillColor;
                baseboard.style.borderColor = borderColor;
            });
            
            // 应用到下踢脚线
            baseboardBottoms.forEach(baseboard => {
                baseboard.style.backgroundColor = fillColor;
                baseboard.style.borderColor = borderColor;
            });
        }
    }
}