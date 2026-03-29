/**
 * ARPG战斗系统模块 - 二级节点
 * 处理玩家和NPC的战斗逻辑
 */

const CombatSystem = {
    isAttacking: false,
    attackCooldown: 0,
    attackRange: 80,
    comboCount: 0,
    comboTimer: 0,
    damageNumbers: [],
    
    init() {
        // 初始化战斗系统
    },
    
    update(dt) {
        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
        
        // 更新连击计时
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }
        
        // 更新伤害数字
        this.damageNumbers = this.damageNumbers.filter(d => {
            d.y -= 30 * dt;
            d.life -= dt;
            return d.life > 0;
        });
        
        // 更新NPC战斗AI
        this.updateCombatAI(dt);
    },
    
    playerAttack() {
        if (this.attackCooldown > 0) return;
        
        const player = GameState.player;
        
        // 消耗体力
        if (player.stamina < 5) {
            Game.showMessage('体力不足！', 'warning');
            return;
        }
        player.stamina -= 5;
        
        this.isAttacking = true;
        this.attackCooldown = 0.5 / player.attackSpeed;
        
        // 连击
        this.comboCount++;
        this.comboTimer = 2;
        const comboBonus = Math.min(this.comboCount * 0.1, 1);
        
        // 计算伤害
        let baseDamage = player.attack;
        
        // 加入修炼加成
        const realmBonus = GameData.getRealm(player.cultivation).bonus;
        baseDamage *= realmBonus;
        
        // 技能加成
        if (player.techniques.includes('thunder_strike')) {
            baseDamage *= 1.5;
            // 闪电特效
            GameState.addParticle(player.x, player.y, '#88aaff', 15);
        }
        
        // 连击加成
        baseDamage *= (1 + comboBonus);
        
        // 寻找范围内的敌人
        const targets = this.findTargets(player.x, player.y, this.attackRange);
        
        if (targets.length > 0) {
            targets.forEach(target => {
                const damage = this.calculateDamage(baseDamage, target.defense);
                this.dealDamage(target, damage, player);
                
                // 击退效果
                const angle = Math.atan2(target.y - player.y, target.x - player.x);
                if (target.body) {
                    Core.applyForce(target.body, {
                        x: Math.cos(angle) * 0.01 * damage,
                        y: Math.sin(angle) * 0.01 * damage
                    });
                }
                
                // 粒子效果
                GameState.addParticle(target.x, target.y, '#ff4444', 10);
                
                // 显示伤害数字
                this.showDamage(target.x, target.y - 30, damage, '#ff4444');
            });
            
            Game.showMessage(`攻击命中！连击 x${this.comboCount}`);
        } else {
            Game.showMessage('挥空了...');
        }
        
        // 攻击动画结束
        setTimeout(() => {
            this.isAttacking = false;
        }, 200);
    },
    
    findTargets(x, y, range) {
        const targets = [];
        
        // 检查NPC（敌对）
        GameState.npcs.forEach(npc => {
            const dist = Math.hypot(npc.x - x, npc.y - y);
            if (dist < range && this.isHostile(npc)) {
                targets.push(npc);
            }
        });
        
        return targets;
    },
    
    isHostile(npc) {
        // 检查NPC是否敌对
        if (npc.relationship < -50) return true;
        if (npc.type === 'monster') return true;
        return false;
    },
    
    calculateDamage(attack, defense) {
        // 基础伤害公式
        const baseDamage = Math.max(1, attack - defense * 0.5);
        // 随机浮动
        const variance = baseDamage * 0.2;
        return Math.floor(baseDamage + (Math.random() - 0.5) * variance);
    },
    
    dealDamage(target, damage, source) {
        target.health -= damage;
        
        // 检查死亡
        if (target.health <= 0) {
            this.onDeath(target, source);
        }
        
        // 关系恶化
        if (target.isNPC && source.isPlayer) {
            target.relationship -= 5;
        }
    },
    
    onDeath(target, killer) {
        // 掉落物品
        const drops = this.getDropLoot(target);
        drops.forEach(item => {
            GameState.dropItem(target.x, target.y, item);
        });
        
        // 击杀者获得经验和修炼点
        if (killer && killer.isPlayer) {
            const exp = this.getExpReward(target);
            killer.cultivation += exp;
            Game.showMessage(`击杀成功！获得 ${exp} 修炼点`, 'success');
        }
        
        // 移除目标
        if (target.isNPC) {
            const index = GameState.npcs.indexOf(target);
            if (index !== -1) {
                // 移除物理体
                if (target.body) {
                    Core.removeBody(target.body);
                }
                GameState.npcs.splice(index, 1);
            }
        }
    },
    
    getDropLoot(target) {
        const drops = [];
        
        if (target.type === 'monster') {
            drops.push({ id: 'raw_meat', name: '生肉', icon: '🍖', type: 'food', count: 1, description: '生肉', isRaw: true });
        }
        
        if (Math.random() < 0.3) {
            drops.push({ id: 'spirit_stone', name: '灵石', icon: '💎', type: 'currency', count: 1, description: '修仙货币' });
        }
        
        return drops;
    },
    
    getExpReward(target) {
        const rewards = {
            monster: 10,
            disciple: 15,
            elder: 50,
            leader: 100
        };
        return rewards[target.type] || 5;
    },
    
    showDamage(x, y, damage, color) {
        this.damageNumbers.push({
            x, y, damage, color,
            life: 1.5
        });
    },
    
    updateCombatAI(dt) {
        GameState.npcs.forEach(npc => {
            // 检查是否应该战斗
            if (!this.isHostile(npc)) return;
            
            const player = GameState.player;
            const dist = Math.hypot(npc.x - player.x, npc.y - player.y);
            
            // 检测范围
            if (dist < 200) {
                // 追击玩家
                npc.state = 'chasing';
                npc.targetX = player.x;
                npc.targetY = player.y;
                
                // 攻击
                if (dist < 50) {
                    this.npcAttack(npc, player);
                }
            } else if (npc.state === 'chasing') {
                // 失去目标
                npc.state = 'idle';
            }
        });
    },
    
    npcAttack(npc, target) {
        if (npc.attackCooldown && npc.attackCooldown > 0) return;
        
        const damage = this.calculateDamage(npc.attack, target.defense);
        this.dealDamage(target, damage, npc);
        
        npc.attackCooldown = 1;
        
        GameState.addParticle(target.x, target.y, '#ff8888', 8);
        this.showDamage(target.x, target.y - 30, damage, '#ff8888');
        
        Game.showMessage(`${npc.name} 攻击了你！`);
    },
    
    // 技能系统
    useSkill(skillId) {
        const player = GameState.player;
        const skill = GameData.techniques.find(t => t.id === skillId);
        
        if (!skill) return;
        if (!player.techniques.includes(skillId)) {
            Game.showMessage('尚未学习此功法', 'warning');
            return;
        }
        
        // 消耗法力
        const manaCost = 20;
        if (player.mana < manaCost) {
            Game.showMessage('法力不足！', 'warning');
            return;
        }
        player.mana -= manaCost;
        
        switch(skill.type) {
            case 'combat':
                this.combatSkill(skill);
                break;
            case 'healing':
                this.healingSkill(skill);
                break;
            case 'movement':
                this.movementSkill(skill);
                break;
        }
    },
    
    combatSkill(skill) {
        const player = GameState.player;
        const targets = this.findTargets(player.x, player.y, this.attackRange * 1.5);
        
        targets.forEach(target => {
            const damage = this.calculateDamage(player.attack * skill.power, target.defense);
            this.dealDamage(target, damage, player);
            GameState.addParticle(target.x, target.y, '#88aaff', 15);
        });
        
        Game.showMessage(`施展 ${skill.name}！`);
    },
    
    healingSkill(skill) {
        const player = GameState.player;
        const heal = 30 * skill.power;
        player.health = Math.min(player.maxHealth, player.health + heal);
        
        GameState.addParticle(player.x, player.y, '#88ff88', 10);
        Game.showMessage(`施展 ${skill.name}，恢复 ${Math.floor(heal)} 生命`);
    },
    
    movementSkill(skill) {
        const player = GameState.player;
        player.speed = 6;
        
        setTimeout(() => {
            player.speed = 3;
        }, 3000);
        
        Game.showMessage(`施展 ${skill.name}，移动速度提升！`);
    }
};
