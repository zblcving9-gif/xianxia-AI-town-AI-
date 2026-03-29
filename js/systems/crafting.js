/**
 * 合成系统模块 - 二级节点
 * 处理物品合成、炼丹和装备制作
 */

const CraftingSystem = {
    recipes: [],
    craftingQueue: [],
    
    init() {
        // 定义合成配方
        this.recipes = [
            {
                id: 'pill_healing',
                name: '疗伤丹',
                icon: '💊',
                type: 'pill',
                ingredients: { herb: 3 },
                result: { id: 'pill_healing', count: 1 },
                time: 3,
                description: '恢复50点生命值'
            },
            {
                id: 'pill_cultivation',
                name: '聚气丹',
                icon: '💊',
                type: 'pill',
                ingredients: { herb: 5, spirit_stone: 1 },
                result: { id: 'pill_cultivation', count: 1 },
                time: 5,
                description: '增加修炼点数'
            },
            {
                id: 'pill_immunity',
                name: '固元丹',
                icon: '💊',
                type: 'pill',
                ingredients: { herb: 4, water: 1 },
                result: { id: 'pill_immunity', count: 1 },
                time: 4,
                description: '提升免疫力'
            },
            {
                id: 'cooked_meat',
                name: '熟肉',
                icon: '🍖',
                type: 'food',
                ingredients: { raw_meat: 1 },
                result: { id: 'cooked_meat', count: 1 },
                time: 2,
                requiresFire: true,
                description: '美味的熟肉'
            },
            {
                id: 'spirit_pill',
                name: '凝神丹',
                icon: '💊',
                type: 'pill',
                ingredients: { spirit_stone: 3, herb: 10 },
                result: { id: 'spirit_pill', count: 1 },
                time: 10,
                description: '大幅提升灵力上限'
            }
        ];
    },
    
    update(dt) {
        // 更新合成队列
        this.craftingQueue = this.craftingQueue.filter(item => {
            item.timer -= dt;
            
            if (item.timer <= 0) {
                this.completeCrafting(item);
                return false;
            }
            return true;
        });
    },
    
    togglePanel() {
        const panel = document.getElementById('craftingPanel');
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
        } else {
            this.showPanel();
        }
    },
    
    showPanel() {
        const panel = document.getElementById('craftingPanel');
        const content = document.getElementById('craftingContent');
        
        const player = GameState.player;
        
        let html = '<div class="panel-title">合成系统</div>';
        
        // 显示当前合成队列
        if (this.craftingQueue.length > 0) {
            html += '<div style="background: rgba(50,50,80,0.5); padding: 10px; margin-bottom: 15px; border-radius: 8px;">';
            html += '<h4 style="margin-bottom: 10px;">正在合成</h4>';
            
            this.craftingQueue.forEach(item => {
                const progress = ((item.totalTime - item.timer) / item.totalTime * 100).toFixed(0);
                html += `
                    <div style="margin-bottom: 8px;">
                        <span>${item.name}</span>
                        <div style="background: #2a2a4a; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: #4a8aff; width: ${progress}%; height: 100%;"></div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        // 显示可合成物品
        html += '<div style="display: grid; gap: 10px;">';
        
        this.recipes.forEach(recipe => {
            const canCraft = this.canCraft(recipe);
            const nearFire = BuildingSystem.getNearbyFireSource(player.x, player.y);
            const needFire = recipe.requiresFire && !nearFire;
            
            html += `
                <div style="background: rgba(50,50,80,${canCraft && !needFire ? 0.5 : 0.2}); 
                            padding: 12px; border-radius: 8px; 
                            border-left: 3px solid ${canCraft && !needFire ? '#4a8aff' : '#4a4a6a'};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="font-size: 14px;">${recipe.icon} ${recipe.name}</strong>
                            <p style="font-size: 11px; color: #aaa; margin-top: 4px;">${recipe.description}</p>
                            <p style="font-size: 10px; color: #888; margin-top: 4px;">
                                材料: ${this.formatIngredients(recipe.ingredients)}
                                ${recipe.requiresFire ? ' 🔥需要火源' : ''}
                            </p>
                        </div>
                        <button class="action-btn" style="padding: 8px 12px;" 
                                onclick="CraftingSystem.craft('${recipe.id}')"
                                ${!canCraft || needFire ? 'disabled' : ''}>
                            合成
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        content.innerHTML = html;
        panel.classList.add('show');
    },
    
    canCraft(recipe) {
        const player = GameState.player;
        
        for (let [itemId, count] of Object.entries(recipe.ingredients)) {
            if (!GameState.hasItem(player, itemId, count)) {
                return false;
            }
        }
        
        return true;
    },
    
    craft(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        const player = GameState.player;
        
        // 检查火源
        if (recipe.requiresFire) {
            const fire = BuildingSystem.getNearbyFireSource(player.x, player.y);
            if (!fire) {
                Game.showMessage('需要在火源附近才能合成！', 'warning');
                return;
            }
        }
        
        // 检查材料
        if (!this.canCraft(recipe)) {
            Game.showMessage('材料不足！', 'warning');
            return;
        }
        
        // 消耗材料
        for (let [itemId, count] of Object.entries(recipe.ingredients)) {
            GameState.removeItem(player, itemId, count);
        }
        
        // 添加到合成队列
        this.craftingQueue.push({
            recipe: recipe,
            name: recipe.name,
            timer: recipe.time,
            totalTime: recipe.time
        });
        
        Game.showMessage(`开始合成 ${recipe.name}...`, 'info');
        
        // 关闭面板
        document.getElementById('craftingPanel').classList.remove('show');
    },
    
    completeCrafting(item) {
        const player = GameState.player;
        const recipe = item.recipe;
        
        // 获取门派加成
        const factionBonus = FactionSystem.getFactionBonus('crafting');
        
        // 计算成功率和数量
        let successRate = 0.9;
        if (factionBonus > 1) {
            successRate += (factionBonus - 1) * 0.1;
        }
        
        if (Math.random() < successRate) {
            // 成功
            const resultItem = {
                ...GameData.items[recipe.result.id],
                count: recipe.result.count
            };
            
            if (GameState.addItem(player, resultItem)) {
                Game.showMessage(`合成成功！获得 ${resultItem.name}`, 'success');
            } else {
                Game.showMessage('物品栏已满，物品掉落在地上', 'warning');
                GameState.dropItem(player.x, player.y, resultItem);
            }
            
            // 粒子效果
            GameState.addParticle(player.x, player.y, '#88ff88', 15);
            
            // 获得修炼点
            player.cultivation += recipe.time * 0.5;
        } else {
            // 失败
            Game.showMessage('合成失败，材料损耗', 'danger');
            GameState.addParticle(player.x, player.y, '#ff8888', 10);
        }
    },
    
    formatIngredients(ingredients) {
        const parts = [];
        for (let [itemId, count] of Object.entries(ingredients)) {
            const item = GameData.items[itemId];
            parts.push(`${item ? item.name : itemId} x${count}`);
        }
        return parts.join(', ');
    },
    
    // 获取所有可合成物品
    getAvailableRecipes() {
        return this.recipes.filter(recipe => this.canCraft(recipe));
    },
    
    // 快速合成（跳过队列）
    instantCraft(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe || !this.canCraft(recipe)) return;
        
        // 消耗额外的灵石来跳过等待
        if (!GameState.hasItem(GameState.player, 'spirit_stone', 1)) {
            Game.showMessage('需要灵石来快速合成', 'warning');
            return;
        }
        
        GameState.removeItem(GameState.player, 'spirit_stone', 1);
        
        // 消耗材料
        for (let [itemId, count] of Object.entries(recipe.ingredients)) {
            GameState.removeItem(GameState.player, itemId, count);
        }
        
        // 直接获得物品
        const resultItem = {
            ...GameData.items[recipe.result.id],
            count: recipe.result.count
        };
        GameState.addItem(GameState.player, resultItem);
        
        Game.showMessage(`快速合成成功！`, 'success');
    }
};
