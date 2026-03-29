/**
 * 门派系统模块 - 二级节点
 * 处理门派关系、贡献和等级
 */

const FactionSystem = {
    playerFaction: null,
    playerRank: 0,
    playerContribution: 0,
    
    init() {
        // 初始化门派系统
    },
    
    update(dt) {
        // 更新门派相关逻辑
    },
    
    togglePanel() {
        const panel = document.getElementById('factionPanel');
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
        } else {
            this.showPanel();
        }
    },
    
    showPanel() {
        const panel = document.getElementById('factionPanel');
        const content = document.getElementById('factionContent');
        
        let html = '';
        
        if (this.playerFaction) {
            // 显示当前门派信息
            html = `
                <div style="margin-bottom: 15px;">
                    <h3 style="color: ${this.playerFaction.color}; margin-bottom: 10px;">
                        ${this.playerFaction.name}
                    </h3>
                    <p>门派等级: ${this.getRankName(this.playerRank)}</p>
                    <p>贡献点: ${this.playerContribution}</p>
                    <div style="margin-top: 10px;">
                        <p>门派加成:</p>
                        <ul>
                            ${this.formatBonus(this.playerFaction.bonus)}
                        </ul>
                    </div>
                </div>
                <hr style="border-color: #4a4a8a; margin: 15px 0;">
                <div>
                    <h4 style="margin-bottom: 10px;">门派任务</h4>
                    <button class="action-btn" onclick="FactionSystem.doTask('gather')">
                        采集任务 (+10贡献)
                    </button>
                    <button class="action-btn" onclick="FactionSystem.doTask('combat')">
                        战斗任务 (+20贡献)
                    </button>
                    <button class="action-btn" onclick="FactionSystem.doTask('cultivation')">
                        修炼任务 (+15贡献)
                    </button>
                </div>
                <hr style="border-color: #4a4a8a; margin: 15px 0;">
                <div>
                    <h4 style="margin-bottom: 10px;">门派商店</h4>
                    <button class="action-btn" onclick="FactionSystem.buyTechnique()">
                        购买功法 (50贡献)
                    </button>
                    <button class="action-btn" onclick="FactionSystem.buyPill()">
                        购买丹药 (30贡献)
                    </button>
                </div>
            `;
        } else {
            // 显示可加入的门派
            html = '<h4 style="margin-bottom: 15px;">选择门派加入</h4>';
            
            GameData.factions.forEach(faction => {
                html += `
                    <div style="background: rgba(50,50,80,0.5); padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 3px solid ${faction.color};">
                        <h4 style="color: ${faction.color}; margin-bottom: 8px;">${faction.name}</h4>
                        <p style="font-size: 12px; color: #aaa;">加成: ${this.formatBonusSimple(faction.bonus)}</p>
                        <button class="action-btn" style="margin-top: 10px;" onclick="FactionSystem.joinFaction('${faction.id}')">
                            加入门派
                        </button>
                    </div>
                `;
            });
        }
        
        content.innerHTML = html;
        panel.classList.add('show');
    },
    
    joinFaction(factionId) {
        const faction = GameData.factions.find(f => f.id === factionId);
        if (!faction) return;
        
        this.playerFaction = faction;
        this.playerRank = 0;
        this.playerContribution = 0;
        
        // 更新玩家信息
        GameState.player.faction = {
            name: faction.name,
            color: faction.color
        };
        
        // 应用门派加成
        if (faction.bonus.cultivation) {
            GameState.player.cultivationSpeed *= faction.bonus.cultivation;
        }
        if (faction.bonus.combat) {
            GameState.player.attack *= faction.bonus.combat;
        }
        
        Game.showMessage(`成功加入 ${faction.name}！`, 'success');
        GameState.addParticle(GameState.player.x, GameState.player.y, faction.color, 20);
        
        this.showPanel();
    },
    
    getRankName(rank) {
        const ranks = ['外门弟子', '内门弟子', '亲传弟子', '长老', '副掌门', '掌门'];
        return ranks[Math.min(rank, ranks.length - 1)];
    },
    
    formatBonus(bonus) {
        const lines = [];
        if (bonus.cultivation) lines.push(`<li>修炼速度 +${(bonus.cultivation - 1) * 100}%</li>`);
        if (bonus.combat) lines.push(`<li>战斗力 +${(bonus.combat - 1) * 100}%</li>`);
        if (bonus.healing) lines.push(`<li>治疗效果 +${(bonus.healing - 1) * 100}%</li>`);
        if (bonus.crafting) lines.push(`<li>炼丹成功率 +${(bonus.crafting - 1) * 100}%</li>`);
        if (bonus.social) lines.push(`<li>社交能力 +${(bonus.social - 1) * 100}%</li>`);
        if (bonus.mana) lines.push(`<li>法力上限 +${(bonus.mana - 1) * 100}%</li>`);
        return lines.join('');
    },
    
    formatBonusSimple(bonus) {
        const parts = [];
        if (bonus.cultivation) parts.push(`修炼+${Math.round((bonus.cultivation-1)*100)}%`);
        if (bonus.combat) parts.push(`战斗+${Math.round((bonus.combat-1)*100)}%`);
        if (bonus.healing) parts.push(`治疗+${Math.round((bonus.healing-1)*100)}%`);
        if (bonus.crafting) parts.push(`炼丹+${Math.round((bonus.crafting-1)*100)}%`);
        return parts.join(', ');
    },
    
    doTask(taskType) {
        if (!this.playerFaction) return;
        
        const player = GameState.player;
        let success = false;
        let contribution = 0;
        
        switch(taskType) {
            case 'gather':
                // 检查是否有材料
                if (GameState.hasItem(player, 'herb', 3)) {
                    GameState.removeItem(player, 'herb', 3);
                    success = true;
                    contribution = 10;
                } else {
                    Game.showMessage('需要3个灵草完成任务', 'warning');
                }
                break;
                
            case 'combat':
                // 战斗任务 - 模拟战斗
                if (player.stamina >= 20) {
                    player.stamina -= 20;
                    success = true;
                    contribution = 20;
                    player.cultivation += 5;
                } else {
                    Game.showMessage('体力不足', 'warning');
                }
                break;
                
            case 'cultivation':
                // 修炼任务
                if (player.mana >= 30) {
                    player.mana -= 30;
                    success = true;
                    contribution = 15;
                    player.cultivation += 10;
                } else {
                    Game.showMessage('法力不足', 'warning');
                }
                break;
        }
        
        if (success) {
            this.playerContribution += contribution;
            Game.showMessage(`任务完成！获得 ${contribution} 贡献点`, 'success');
            this.checkRankUp();
            this.showPanel();
        }
    },
    
    checkRankUp() {
        const rankThresholds = [0, 50, 150, 400, 1000, 2500];
        
        for (let i = rankThresholds.length - 1; i >= 0; i--) {
            if (this.playerContribution >= rankThresholds[i] && this.playerRank < i) {
                this.playerRank = i;
                Game.showMessage(`恭喜晋升为 ${this.getRankName(i)}！`, 'success');
                GameState.addParticle(GameState.player.x, GameState.player.y, this.playerFaction.color, 30);
                break;
            }
        }
    },
    
    buyTechnique() {
        if (this.playerContribution < 50) {
            Game.showMessage('贡献点不足', 'warning');
            return;
        }
        
        this.playerContribution -= 50;
        
        // 随机获得功法
        const techniques = GameData.techniques.filter(t => !GameState.player.techniques.includes(t.id));
        if (techniques.length === 0) {
            Game.showMessage('已学会所有功法');
            return;
        }
        
        const tech = techniques[Math.floor(Math.random() * techniques.length)];
        GameState.player.techniques.push(tech.id);
        
        Game.showMessage(`学会新功法: ${tech.name}！`, 'success');
        this.showPanel();
    },
    
    buyPill() {
        if (this.playerContribution < 30) {
            Game.showMessage('贡献点不足', 'warning');
            return;
        }
        
        this.playerContribution -= 30;
        
        const pill = { ...GameData.items.pill_cultivation, count: 1 };
        GameState.addItem(GameState.player, pill);
        
        Game.showMessage(`获得 ${pill.name}！`, 'success');
        this.showPanel();
    },
    
    // 获取门派加成
    getFactionBonus(type) {
        if (!this.playerFaction || !this.playerFaction.bonus[type]) {
            return 1;
        }
        return this.playerFaction.bonus[type];
    },
    
    // 改变NPC对玩家的态度（基于门派关系）
    updateNPCRelation(npc) {
        if (!this.playerFaction || !npc.factionName) return;
        
        // 同门派加好感
        if (npc.factionName === this.playerFaction.name) {
            npc.relationship = Math.max(npc.relationship, 20);
        }
        
        // 敌对门派减好感
        const hostiles = {
            '青云门': ['万剑宗'],
            '万剑宗': ['青云门'],
            '药王谷': [],
            '天音宗': []
        };
        
        if (hostiles[this.playerFaction.name]?.includes(npc.factionName)) {
            npc.relationship = Math.min(npc.relationship, -30);
        }
    }
};
