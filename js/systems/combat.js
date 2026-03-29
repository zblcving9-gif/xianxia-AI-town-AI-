/**
 * ARPG战斗系统模块 - 二级节点
 * 处理玩家和NPC的战斗逻辑
 */

const CombatSystem = {
    isAttacking: false, attackCooldown: 0, attackRange: 80, comboCount: 0, comboTimer: 0, damageNumbers: [],
    
    init() {},
    
    update(dt) {
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.comboCount = 0; }
        this.damageNumbers = this.damageNumbers.filter(d => { d.y -= 30 * dt; d.life -= dt; return d.life > 0; });
        this.updateCombatAI(dt);
    },
    
    playerAttack() {
        if (this.attackCooldown > 0) return;
        const player = GameState.player;
        if (player.stamina < 5) { Game.showMessage('体力不足！', 'warning'); return; }
        player.stamina -= 5;
        this.isAttacking = true; this.attackCooldown = 0.5 / player.attackSpeed;
        this.comboCount++; this.comboTimer = 2;
        const comboBonus = Math.min(this.comboCount * 0.1, 1);
        let dmg = player.attack * GameData.getRealm(player.cultivation).bonus;
        if (player.techniques.includes('thunder_strike')) { dmg *= 1.5; GameState.addParticle(player.x, player.y, '#88aaff', 15); }
        dmg *= (1 + comboBonus);
        const targets = this.findTargets(player.x, player.y, this.attackRange);
        if (targets.length > 0) {
            targets.forEach(t => {
                const d = this.calculateDamage(dmg, t.defense);
                this.dealDamage(t, d, player);
                if (t.body) Core.applyForce(t.body, { x: Math.cos(Math.atan2(t.y - player.y, t.x - player.x)) * 0.01 * d, y: Math.sin(Math.atan2(t.y - player.y, t.x - player.x)) * 0.01 * d });
                GameState.addParticle(t.x, t.y, '#ff4444', 10);
                this.showDamage(t.x, t.y - 30, d, '#ff4444');
            });
            Game.showMessage(`攻击命中！连击 x${this.comboCount}`);
        } else { Game.showMessage('挥空了...'); }
        setTimeout(() => this.isAttacking = false, 200);
    },
    
    findTargets(x, y, range) {
        return GameState.npcs.filter(npc => Math.hypot(npc.x - x, npc.y - y) < range && this.isHostile(npc));
    },
    
    isHostile(npc) { return npc.relationship < -50 || npc.type === 'monster'; },
    
    calculateDamage(atk, def) { return Math.floor(Math.max(1, atk - def * 0.5) * (1 + (Math.random() - 0.5) * 0.2)); },
    
    dealDamage(target, damage, source) {
        target.health -= damage;
        if (target.health <= 0) this.onDeath(target, source);
        if (target.isNPC && source.isPlayer) target.relationship -= 5;
    },
    
    onDeath(target, killer) {
        this.getDropLoot(target).forEach(item => GameState.dropItem(target.x, target.y, item));
        if (killer?.isPlayer) { killer.cultivation += this.getExpReward(target); Game.showMessage('击杀成功！', 'success'); }
        // 移除NPC或怪物
        if (target.body) Core.removeBody(target.body);
        const idx = GameState.npcs.indexOf(target);
        if (idx !== -1) GameState.npcs.splice(idx, 1);
    },
    
    getDropLoot(target) {
        const drops = [];
        if (target.type === 'monster') drops.push({ id: 'raw_meat', name: '生肉', icon: '🍖', type: 'food', count: 1, isRaw: true });
        if (Math.random() < 0.3) drops.push({ id: 'spirit_stone', name: '灵石', icon: '💎', type: 'currency', count: 1 });
        return drops;
    },
    
    getExpReward(target) { return { monster: 10, disciple: 15, elder: 50, leader: 100 }[target.type] || 5; },
    
    showDamage(x, y, dmg, color) { this.damageNumbers.push({ x, y, damage: dmg, color, life: 1.5 }); },
    
    updateCombatAI(dt) {
        GameState.npcs.forEach(npc => {
            if (!this.isHostile(npc)) return;
            const dist = Math.hypot(npc.x - GameState.player.x, npc.y - GameState.player.y);
            if (dist < 200) { npc.state = 'chasing'; npc.targetX = GameState.player.x; npc.targetY = GameState.player.y; if (dist < 50) this.npcAttack(npc, GameState.player); }
            else if (npc.state === 'chasing') npc.state = 'idle';
        });
    },
    
    npcAttack(npc, target) {
        if (npc.attackCooldown > 0) return;
        const dmg = this.calculateDamage(npc.attack, target.defense);
        this.dealDamage(target, dmg, npc);
        npc.attackCooldown = 1;
        GameState.addParticle(target.x, target.y, '#ff8888', 8);
        this.showDamage(target.x, target.y - 30, dmg, '#ff8888');
        Game.showMessage(`${npc.name} 攻击了你！`);
    },
    
    useSkill(skillId) {
        const player = GameState.player, skill = GameData.techniques.find(t => t.id === skillId);
        if (!skill || !player.techniques.includes(skillId)) { Game.showMessage('尚未学习此功法', 'warning'); return; }
        if (player.mana < 20) { Game.showMessage('法力不足！', 'warning'); return; }
        player.mana -= 20;
        if (skill.type === 'combat') this.combatSkill(skill);
        else if (skill.type === 'healing') this.healingSkill(skill);
        else if (skill.type === 'movement') this.movementSkill(skill);
    },
    
    combatSkill(skill) {
        const player = GameState.player;
        this.findTargets(player.x, player.y, this.attackRange * 1.5).forEach(t => {
            this.dealDamage(t, this.calculateDamage(player.attack * skill.power, t.defense), player);
            GameState.addParticle(t.x, t.y, '#88aaff', 15);
        });
        Game.showMessage(`施展 ${skill.name}！`);
    },
    
    healingSkill(skill) {
        GameState.player.health = Math.min(GameState.player.maxHealth, GameState.player.health + 30 * skill.power);
        GameState.addParticle(GameState.player.x, GameState.player.y, '#88ff88', 10);
        Game.showMessage(`恢复 ${Math.floor(30 * skill.power)} 生命`);
    },
    
    movementSkill(skill) {
        const baseSpeed = GameState.player.baseSpeed || 3;
        GameState.player.speed = baseSpeed * 2;
        setTimeout(() => GameState.player.speed = baseSpeed, 3000);
        Game.showMessage(`移动速度提升！`);
    }
};
