// 基础房间模板类
class BasicRoomTemplate extends RoomTemplate {
    constructor() {
        super('basic-room', '基础房间', '包含墙纸、踢脚线和地板的基础房间模板', 'landscape');
    }
    
    createHTML() {
        return `
            <div class="room-container basic-room-container">
                <!-- 墙纸区域（红色） -->
                <div class="wallpaper-area" id="wallpaperArea">
                    <div class="wallpaper-content">
                    </div>
                </div>
                
                <!-- 踢脚线区域（两个div组成） -->
                <div class="baseboard-area" id="baseboardArea">
                    <div class="baseboard-top"></div>
                    <div class="baseboard-bottom"></div>
                </div>
                
                <!-- 地板区域（绿色） -->
                <div class="floor-area" id="floorArea">
                    <div class="floor-content">
                    </div>
                </div>
            </div>
        `;
    }
}