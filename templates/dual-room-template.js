// 双房间模板类（左右两个房间并排）
class DualRoomTemplate extends RoomTemplate {
    constructor() {
        super('dual-room', '双房间', '在一张纸上显示两个并排的房间', 'landscape');
        this.selectedRoom = 1; // 默认选中房间1
        this.roomStates = {
            1: { wallpaper: null, floor: null, baseboardBorderColor: '#000000', baseboardFillColor: '#D9D9D9' },
            2: { wallpaper: null, floor: null, baseboardBorderColor: '#000000', baseboardFillColor: '#D9D9D9' }
        };
    }
    
    createHTML() {
        return `
            <div class="dual-room-container">
                <div class="room-container" id="roomLeft">
                    <!-- 墙纸区域 -->
                    <div class="wallpaper-area" id="wallpaperAreaLeft"></div>
                    
                    <!-- 踢脚线区域 -->
                    <div class="baseboard-area" id="baseboardAreaLeft">
                        <div class="baseboard-top"></div>
                        <div class="baseboard-bottom"></div>
                    </div>
                    
                    <!-- 地板区域 -->
                    <div class="floor-area" id="floorAreaLeft"></div>
                </div>
                <div class="room-container" id="roomRight">
                    <!-- 墙纸区域 -->
                    <div class="wallpaper-area" id="wallpaperAreaRight"></div>
                    
                    <!-- 踢脚线区域 -->
                    <div class="baseboard-area" id="baseboardAreaRight">
                        <div class="baseboard-top"></div>
                        <div class="baseboard-bottom"></div>
                    </div>
                    
                    <!-- 地板区域 -->
                    <div class="floor-area" id="floorAreaRight"></div>
                </div>
            </div>
        `;
    }
    
    // 渲染后初始化
    afterRender() {
        console.log('双房间模板开始渲染后初始化');
        
        // 恢复房间装饰状态
        this.restoreRoomStates();
        
        // 设置默认背景色（仅在没有装饰状态时）
        this.setDefaultBackgrounds();
        
        console.log('双房间模板已渲染完成');
    }
    
    // 恢复房间状态
    restoreRoomStates() {
        console.log(`[双房间模板] 恢复房间状态:`, this.roomStates);
        
        // 恢复房间1的状态
        if (this.roomStates[1]) {
            this.selectedRoom = 1;
            if (this.roomStates[1].wallpaper !== null && this.roomStates[1].wallpaper !== undefined) {
                this.applyWallpaper(this.roomStates[1].wallpaper);
            }
            if (this.roomStates[1].floor !== null && this.roomStates[1].floor !== undefined) {
                this.applyFloor(this.roomStates[1].floor);
            }
            if (this.roomStates[1].baseboardBorderColor && this.roomStates[1].baseboardFillColor) {
                this.applyBaseboardColors(this.roomStates[1].baseboardBorderColor, this.roomStates[1].baseboardFillColor);
            }
        }
        
        // 恢复房间2的状态
        if (this.roomStates[2]) {
            this.selectedRoom = 2;
            if (this.roomStates[2].wallpaper !== null && this.roomStates[2].wallpaper !== undefined) {
                this.applyWallpaper(this.roomStates[2].wallpaper);
            }
            if (this.roomStates[2].floor !== null && this.roomStates[2].floor !== undefined) {
                this.applyFloor(this.roomStates[2].floor);
            }
            if (this.roomStates[2].baseboardBorderColor && this.roomStates[2].baseboardFillColor) {
                this.applyBaseboardColors(this.roomStates[2].baseboardBorderColor, this.roomStates[2].baseboardFillColor);
            }
        }
        
        // 恢复选中的房间
        this.selectedRoom = this.selectedRoom || 1;
    }
    
    // 设置默认背景色（仅在没有装饰状态时）
    setDefaultBackgrounds() {
        if (this.container) {
            // 只有在没有装饰状态时才设置默认背景
            const leftWallpaperArea = this.container.querySelector('#wallpaperAreaLeft');
            const rightWallpaperArea = this.container.querySelector('#wallpaperAreaRight');
            
            if (leftWallpaperArea && rightWallpaperArea) {
                // 检查是否已有墙纸装饰
                if (!this.roomStates[1].wallpaper && !this.roomStates[2].wallpaper) {
                    leftWallpaperArea.style.backgroundColor = '#ff6b6b'; // 红色背景
                    rightWallpaperArea.style.backgroundColor = '#ff6b6b'; // 红色背景
                }
            }
            
            const leftFloorArea = this.container.querySelector('#floorAreaLeft');
            const rightFloorArea = this.container.querySelector('#floorAreaRight');
            
            if (leftFloorArea && rightFloorArea) {
                // 检查是否已有地板装饰
                if (!this.roomStates[1].floor && !this.roomStates[2].floor) {
                    leftFloorArea.style.backgroundColor = '#51cf66'; // 绿色背景
                    rightFloorArea.style.backgroundColor = '#51cf66'; // 绿色背景
                }
            }
        }
    }
    
    // 选择房间
    selectRoom(roomNumber) {
        this.selectedRoom = roomNumber;
        console.log(`选择了房间 ${roomNumber}`);
        
        // 可以在这里添加其他房间切换逻辑
        // 比如更新UI状态等
        
        // 通知外部组件房间已切换
        const event = new CustomEvent('roomChanged', {
            detail: { roomNumber: roomNumber }
        });
        document.dispatchEvent(event);
    }
    
    // 重写墙纸应用方法，只应用到当前选中的房间
    applyWallpaper(wallpaperNumber) {
        if (this.container) {
            // 保存当前房间的墙纸状态
            this.roomStates[this.selectedRoom].wallpaper = wallpaperNumber;
            
            // 根据选中的房间应用墙纸
            const wallpaperAreaId = this.selectedRoom === 1 ? '#wallpaperAreaLeft' : '#wallpaperAreaRight';
            const wallpaperArea = this.container.querySelector(wallpaperAreaId);
            
            if (wallpaperArea) {
                if (wallpaperNumber === null || wallpaperNumber === undefined) {
                    // 清除墙纸
                    wallpaperArea.style.backgroundImage = 'none';
                    console.log(`清除房间 ${this.selectedRoom} 的墙纸`);
                } else {
                    const wallpaperUrl = `assets/软装/wallpaper/${wallpaperNumber}.png`;
                    wallpaperArea.style.backgroundImage = `url('${wallpaperUrl}')`;
                    wallpaperArea.style.backgroundSize = 'cover';
                    wallpaperArea.style.backgroundPosition = 'center';
                    wallpaperArea.style.backgroundRepeat = 'no-repeat';
                    console.log(`应用墙纸 ${wallpaperNumber} 到房间 ${this.selectedRoom}`);
                }
            }
        }
    }
    
    // 重写地板应用方法，只应用到当前选中的房间
    applyFloor(floorNumber) {
        if (this.container) {
            // 保存当前房间的地板状态
            this.roomStates[this.selectedRoom].floor = floorNumber;
            
            // 根据选中的房间应用地板
            const floorAreaId = this.selectedRoom === 1 ? '#floorAreaLeft' : '#floorAreaRight';
            const floorArea = this.container.querySelector(floorAreaId);
            
            if (floorArea) {
                if (floorNumber === null || floorNumber === undefined) {
                    // 清除地板
                    floorArea.style.backgroundImage = 'none';
                    console.log(`清除房间 ${this.selectedRoom} 的地板`);
                } else {
                    const floorUrl = `assets/软装/floor/${floorNumber}.png`;
                    floorArea.style.backgroundImage = `url('${floorUrl}')`;
                    floorArea.style.backgroundSize = 'cover';
                    floorArea.style.backgroundPosition = 'center';
                    floorArea.style.backgroundRepeat = 'no-repeat';
                    console.log(`应用地板 ${floorNumber} 到房间 ${this.selectedRoom}`);
                }
            }
        }
    }
    
    // 重写踢脚线颜色应用方法，只应用到当前选中的房间
    applyBaseboardColors(borderColor, fillColor) {
        if (this.container) {
            // 保存当前房间的踢脚线颜色状态
            this.roomStates[this.selectedRoom].baseboardBorderColor = borderColor;
            this.roomStates[this.selectedRoom].baseboardFillColor = fillColor;
            
            // 根据选中的房间应用踢脚线颜色
            const roomSuffix = this.selectedRoom === 1 ? 'Left' : 'Right';
            const baseboardTops = this.container.querySelectorAll(`#roomLeft .baseboard-top, #roomRight .baseboard-top`);
            const baseboardBottoms = this.container.querySelectorAll(`#roomLeft .baseboard-bottom, #roomRight .baseboard-bottom`);
            
            // 只应用到选中的房间
            const targetRoomId = this.selectedRoom === 1 ? '#roomLeft' : '#roomRight';
            const targetRoom = this.container.querySelector(targetRoomId);
            
            if (targetRoom) {
                const roomBaseboardTops = targetRoom.querySelectorAll('.baseboard-top');
                const roomBaseboardBottoms = targetRoom.querySelectorAll('.baseboard-bottom');
                
                console.log(`应用踢脚线颜色到房间 ${this.selectedRoom}:`, { borderColor, fillColor });
                console.log('找到踢脚线元素:', { tops: roomBaseboardTops.length, bottoms: roomBaseboardBottoms.length });
                
                // 应用到上踢脚线
                roomBaseboardTops.forEach(baseboard => {
                    baseboard.style.backgroundColor = fillColor;
                    baseboard.style.borderColor = borderColor;
                });
                
                // 应用到下踢脚线
                roomBaseboardBottoms.forEach(baseboard => {
                    baseboard.style.backgroundColor = fillColor;
                    baseboard.style.borderColor = borderColor;
                });
            }
        }
    }
}