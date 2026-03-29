/**
 * 建造系统模块 - 二级节点
 * 处理建筑放置、管理和效果
 */

const BuildingSystem = {
    isBuilding: false,
    selectedBuilding: null,
    previewBuilding: null,
    buildMenuOpen: false,
    
    init() {
        // 初始化建造系统
    },
    
    startBuild() {
        this.isBuilding = true;
        this.showBuildMenu();
    },
    
    cancelBuild() {
        this.isBuilding = false;
        this.selectedBuilding = null;
        this.previewBuilding = null;
        this.buildMenuOpen = false;
    },
    
    showBuildMenu() {
        const content = document.getElementById('craftingContent');
        const parent = document.getElementById('craftingPanel');
        
        let html = '<div class="panel-title">建造菜单</div>';
        html += '<div style="display: grid; gap: 10px;">';
        
        GameData.buildings.forEach(building => {
            const canBuild = this.canAfford(building);
            html += `
                <button class="action-btn" onclick="BuildingSystem.selectBuilding('${building.id}')" 
                        ${!canBuild ? 'disabled' : ''}>
                    <strong>${building.name}</strong><br>
                    <small>${building.description}</small><br>
                    <small>费用: ${this.formatCost(building.cost)}</small>
                </button>
            `;
        });
        
        html += '</div>';
        html += '<button class="action-btn" onclick="BuildingSystem.cancelBuild()" style="margin-top:10px;">取消</button>';
        
        content.innerHTML = html;
        parent.classList.add('show');
        this.buildMenuOpen = true;
    },
    
    selectBuilding(buildingId) {
        const building = GameData.buildings.find(b => b.id === buildingId);
        if (building && this.canAfford(building)) {
            this.selectedBuilding = building;
            this.previewBuilding = {
                ...building,
                x: GameState.mouseX,
                y: GameState.mouseY
            };
            Game.showMessage(`选择建造位置，点击放置 ${building.name}`);
        }
    },
    
    placeBuild(worldX, worldY) {
        if (!this.selectedBuilding) return;
        
        const building = this.selectedBuilding;
        
        // 检查位置是否有效
        if (!this.isValidPosition(worldX, worldY, building)) {
            Game.showMessage('此位置无法建造！', 'warning');
            return;
        }
        
        // 扣除费用
        this.deductCost(building.cost);
        
        // 创建建筑
        const newBuilding = {
            id: `building_${Date.now()}`,
            type: building.id,
            name: building.name,
            x: worldX,
            y: worldY,
            width: building.width,
            height: building.height,
            color: '#5a5a7a',
            hasRoof: building.id !== 'campfire' && building.id !== 'spirit_array',
            hasWindows: building.id === 'house',
            isFireSource: building.isFireSource,
            level: 1,
            durability: 100,
            effects: this.getBuildingEffects(building.id)
        };
        
        // 创建物理体
        const body = Core.createStatic(worldX, worldY - building.height/2, building.width, building.height, 'building');
        newBuilding.body = body;
        Core.addBody(body);
        
        GameState.buildings.push(newBuilding);
        
        // 应用建筑效果
        this.applyBuildingEffects(newBuilding);
        
        Game.showMessage(`成功建造 ${building.name}！`, 'success');
        GameState.addParticle(worldX, worldY, '#88aaff', 20);
        
        this.cancelBuild();
    },
    
    isValidPosition(x, y, building) {
        // 检查是否在边界内
        if (x < 100 || x > 2900 || y < 100 || y > 1900) return false;
        
        // 检查是否与其他建筑重叠
        for (let b of GameState.buildings) {
            const dx = Math.abs(b.x - x);
            const dy = Math.abs(b.y - y);
            if (dx < (b.width + building.width) / 2 && dy < (b.height + building.height) / 2) {
                return false;
            }
        }
        
        // 检查是否与资源重叠
        for (let r of GameState.resources) {
            const dist = Math.hypot(r.x - x, r.y - y);
            if (dist < r.size + Math.max(building.width, building.height) / 2) {
                return false;
            }
        }
        
        return true;
    },
    
    canAfford(building) {
        for (let [itemId, count] of Object.entries(building.cost)) {
            if (!GameState.hasItem(GameState.player, itemId, count)) {
                return false;
            }
        }
        return true;
    },
    
    deductCost(cost) {
        for (let [itemId, count] of Object.entries(cost)) {
            GameState.removeItem(GameState.player, itemId, count);
        }
    },
    
    formatCost(cost) {
        const parts = [];
        for (let [itemId, count] of Object.entries(cost)) {
            const item = GameData.items[itemId];
            parts.push(`${item ? item.name : itemId} x${count}`);
        }
        return parts.join(', ');
    },
    
    getBuildingEffects(buildingId) {
        const effects = {
            house: { rest: 1.5 }, // 休息效率提升
            campfire: { warmth: 1, cooking: true }, // 烹饪
            training_ground: { cultivation: 1.3 }, // 修炼加成
            alchemy_room: { crafting: 1.5 }, // 炼丹加成
            spirit_array: { spiritual: 2 } // 灵力加成
        };
        return effects[buildingId] || {};
    },
    
    applyBuildingEffects(building) {
        // 如果是聚灵阵，创建新的灵力区域
        if (building.type === 'spirit_array') {
            GameState.spiritualAreas.push({
                x: building.x,
                y: building.y,
                radius: building.width / 2,
                level: 3,
                name: '聚灵阵'
            });
        }
    },
    
    update(dt) {
        // 更新建筑预览位置
        if (this.isBuilding && this.previewBuilding) {
            this.previewBuilding.x = GameState.mouseX;
            this.previewBuilding.y = GameState.mouseY;
        }
        
        // 更新建筑效果
        GameState.buildings.forEach(building => {
            // 火源效果
            if (building.isFireSource) {
                this.updateFireEffect(building, dt);
            }
        });
    },
    
    updateFireEffect(building, dt) {
        // 检查玩家是否靠近火源
        const player = GameState.player;
        const dist = Math.hypot(building.x - player.x, building.y - player.y);
        
        if (dist < 100) {
            // 温暖效果
            player.immunity = Math.min(player.maxImmunity, player.immunity + dt * 2);
        }
    },
    
    getNearbyFireSource(x, y) {
        for (let building of GameState.buildings) {
            if (building.isFireSource) {
                const dist = Math.hypot(building.x - x, building.y - y);
                if (dist < 100) {
                    return building;
                }
            }
        }
        return null;
    },
    
    removeBuilding(buildingId) {
        const index = GameState.buildings.findIndex(b => b.id === buildingId);
        if (index !== -1) {
            const building = GameState.buildings[index];
            
            // 移除物理体
            if (building.body) {
                Core.removeBody(building.body);
            }
            
            // 移除相关灵力区域
            if (building.type === 'spirit_array') {
                const areaIndex = GameState.spiritualAreas.findIndex(
                    a => Math.abs(a.x - building.x) < 10 && Math.abs(a.y - building.y) < 10
                );
                if (areaIndex !== -1) {
                    GameState.spiritualAreas.splice(areaIndex, 1);
                }
            }
            
            GameState.buildings.splice(index, 1);
            Game.showMessage(`建筑已拆除`);
        }
    }
};
