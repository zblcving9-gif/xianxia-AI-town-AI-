/**
 * NPC社交系统模块 - 二级节点
 * 处理NPC之间的社交关系和交互
 */

const SocialSystem = {
    socialInteractions: [],
    
    init() {
        // 初始化NPC社交关系
        this.initNPCRelationships();
    },
    
    update(dt) {
        // 更新社交交互
    },
    
    initNPCRelationships() {
        // 初始化NPC之间的关系
        GameState.npcs.forEach(npc => {
            npc.socialRelations = {};
            npc.socialTimer = 0;
            
            // 与其他NPC建立初始关系
            GameState.npcs.forEach(other => {
                if (npc.id !== other.id) {
                    // 同门派关系更好
                    let relation = 0;
                    if (npc.factionName && npc.factionName === other.factionName) {
                        relation = 30 + Math.floor(Math.random() * 30);
                    } else {
                        relation = -20 + Math.floor(Math.random() * 40);
                    }
                    npc.socialRelations[other.id] = relation;
                }
            });
        });
    },
    
    updateNPCSocial(npc, dt) {
        // 社交计时器
        npc.socialTimer -= dt;
        
        if (npc.socialTimer <= 0) {
            this.processNPCSocial(npc);
            npc.socialTimer = 30 + Math.random() * 60; // 30-90秒
        }
        
        // 检查是否与其他NPC接近
        const nearbyNPCs = this.getNearbyNPCs(npc, 100);
        
        if (nearbyNPCs.length > 0 && Math.random() < 0.01) {
            // 发生社交交互
            this.socialize(npc, nearbyNPCs[0]);
        }
    },
    
    processNPCSocial(npc) {
        // NPC对玩家的态度随时间变化
        const player = GameState.player;
        const dist = Math.hypot(npc.x - player.x, npc.y - player.y);
        
        // 如果玩家在附近，关系可能会改善
        if (dist < 200) {
            if (player.faction && player.faction.name === npc.factionName) {
                npc.relationship += 0.5;
            }
        }
        
        // 关系缓慢趋向中性
        if (npc.relationship > 0) {
            npc.relationship -= 0.1;
        } else if (npc.relationship < 0) {
            npc.relationship += 0.1;
        }
        
        npc.relationship = Math.max(-100, Math.min(100, npc.relationship));
    },
    
    getNearbyNPCs(npc, range) {
        return GameState.npcs.filter(other => {
            if (other.id === npc.id) return false;
            const dist = Math.hypot(other.x - npc.x, other.y - npc.y);
            return dist < range;
        });
    },
    
    socialize(npc1, npc2) {
        // 获取或创建关系
        if (!npc1.socialRelations[npc2.id]) {
            npc1.socialRelations[npc2.id] = 0;
        }
        if (!npc2.socialRelations[npc1.id]) {
            npc2.socialRelations[npc1.id] = 0;
        }
        
        // 根据关系决定交互类型
        const relation = npc1.socialRelations[npc2.id];
        
        if (relation >= 50) {
            // 友好交互
            this.friendlyInteraction(npc1, npc2);
        } else if (relation <= -30) {
            // 敌对交互
            this.hostileInteraction(npc1, npc2);
        } else {
            // 中性交互
            this.neutralInteraction(npc1, npc2);
        }
    },
    
    friendlyInteraction(npc1, npc2) {
        // 友好交互：交换物品、分享信息
        const actions = [
            '互相问候',
            '切磋技艺',
            '交换修炼心得',
            '分享资源'
        ];
        
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        // 关系加深
        npc1.socialRelations[npc2.id] = Math.min(100, (npc1.socialRelations[npc2.id] || 0) + 2);
        npc2.socialRelations[npc1.id] = Math.min(100, (npc2.socialRelations[npc1.id] || 0) + 2);
        
        // 特殊效果
        if (action === '切磋技艺') {
            // 双方获得修炼点
            npc1.cultivation = (npc1.cultivation || 0) + 1;
            npc2.cultivation = (npc2.cultivation || 0) + 1;
        }
        
        // 粒子效果
        GameState.addParticle(
            (npc1.x + npc2.x) / 2,
            (npc1.y + npc2.y) / 2,
            '#88ff88',
            5
        );
    },
    
    hostileInteraction(npc1, npc2) {
        // 敌对交互：争吵、威胁
        const actions = [
            '冷眼相向',
            '发生争执',
            '互相威胁'
        ];
        
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        // 关系恶化
        npc1.socialRelations[npc2.id] = Math.max(-100, (npc1.socialRelations[npc2.id] || 0) - 3);
        npc2.socialRelations[npc1.id] = Math.max(-100, (npc2.socialRelations[npc1.id] || 0) - 3);
        
        // 可能触发战斗
        if (npc1.socialRelations[npc2.id] < -80 && Math.random() < 0.3) {
            // 开始战斗
            npc1.state = 'fighting';
            npc1.targetId = npc2.id;
        }
        
        GameState.addParticle(
            (npc1.x + npc2.x) / 2,
            (npc1.y + npc2.y) / 2,
            '#ff8888',
            5
        );
    },
    
    neutralInteraction(npc1, npc2) {
        // 中性交互：简单交流
        npc1.socialRelations[npc2.id] = (npc1.socialRelations[npc2.id] || 0) + Math.random() * 2 - 0.5;
        npc2.socialRelations[npc1.id] = (npc2.socialRelations[npc1.id] || 0) + Math.random() * 2 - 0.5;
    },
    
    // 玩家送礼给NPC
    giveGift(npc, itemId) {
        const player = GameState.player;
        
        if (!GameState.hasItem(player, itemId, 1)) {
            Game.showMessage('没有这个物品', 'warning');
            return;
        }
        
        // 移除物品
        GameState.removeItem(player, itemId, 1);
        
        // 计算好感度增加
        const giftValue = this.getGiftValue(itemId, npc);
        npc.relationship += giftValue;
        
        Game.showMessage(`${npc.name} 收下了礼物，好感度 +${giftValue}`, 'success');
        
        // 粒子效果
        GameState.addParticle(npc.x, npc.y, '#ffaa88', 10);
    },
    
    getGiftValue(itemId, npc) {
        // 不同NPC喜欢不同的礼物
        const preferences = {
            elder: { spirit_stone: 15, herb: 8 },
            blacksmith: { stone: 10, spirit_stone: 5 },
            merchant: { gold: 10, spirit_stone: 12 },
            herbalist: { herb: 15, water: 5 },
            disciple: { herb: 5, spirit_stone: 10 },
            leader: { spirit_stone: 20, pill_cultivation: 15 }
        };
        
        const pref = preferences[npc.type] || {};
        return pref[itemId] || 3;
    },
    
    // 玩家与NPC对话影响关系
    dialogInfluence(npc, topic, isPositive) {
        if (isPositive) {
            npc.relationship += 5;
            Game.showMessage(`${npc.name} 对你的态度改善了`, 'success');
        } else {
            npc.relationship -= 5;
            Game.showMessage(`${npc.name} 对你的态度变差了`, 'warning');
        }
    },
    
    // 获取NPC对玩家的态度描述
    getRelationshipDesc(relationship) {
        if (relationship >= 80) return '挚友';
        if (relationship >= 60) return '好友';
        if (relationship >= 40) return '友善';
        if (relationship >= 20) return '认可';
        if (relationship >= -20) return '中立';
        if (relationship >= -40) return '冷淡';
        if (relationship >= -60) return '厌恶';
        if (relationship >= -80) return '敌视';
        return '仇敌';
    },
    
    // 传闻系统
    generateRumor() {
        const rumors = [
            '听说某个灵脉最近灵力暴涨...',
            '有修士在山中发现了上古洞府...',
            '最近天气异常，恐怕有大妖出世...',
            '某个门派正在招收新弟子...',
            '有人在拍卖会上拍得了仙器...'
        ];
        
        return rumors[Math.floor(Math.random() * rumors.length)];
    }
};
