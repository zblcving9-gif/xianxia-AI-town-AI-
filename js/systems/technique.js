/**
 * 快捷栏与功法战斗系统 - 三级节点
 * 处理快捷栏、功法投射物和特效
 */

const QuickBarSystem = {
    slots: [null, null, null],
    cooldowns: [0, 0, 0],
    
    init() {
        const player = GameState.player;
        const defaultTechs = ['qingyun_thunder', 'yaowang_heal', 'wanjian_blade'];
        defaultTechs.forEach((techId, i) => {
            const tech = GameData.techniques.find(t => t.id === techId);
            if (tech && !player.techniques.includes(techId)) player.techniques.push(techId);
            if (i < 3) this.slots[i] = techId;
        });
        this.updateUI();
    },
    
    setSlot(index, techId) { if (index >= 0 && index < 3) { this.slots[index] = techId; this.updateUI(); } },
    
    use(index) {
        if (index < 0 || index >= 3) return;
        const techId = this.slots[index];
        if (!techId) { Game.showMessage('该槽位没有装备功法', 'warning'); return; }
        if (this.cooldowns[index] > 0) { Game.showMessage('功法冷却中...', 'warning'); return; }
        const tech = GameData.techniques.find(t => t.id === techId);
        if (!tech) return;
        const player = GameState.player;
        const manaCost = tech.manaCost || 15;
        if (player.mana < manaCost) { Game.showMessage('法力不足！', 'warning'); return; }
        this.executeTechnique(tech, index);
        player.mana -= manaCost;
        this.cooldowns[index] = tech.type === 'ultimate' ? 3 : (tech.type === 'healing' ? 0.5 : 1);
    },
    
    executeTechnique(tech, slotIndex) {
        const player = GameState.player;
        const angle = Math.atan2(GameState.mouseY - player.y, GameState.mouseX - player.x);
        switch(tech.type) {
            case 'combat': this.fireProjectile(tech, player, angle); break;
            case 'healing': this.healingTechnique(tech, player); break;
            case 'defense': this.defenseTechnique(tech, player); break;
            case 'movement': this.movementTechnique(tech, player, GameState.mouseX, GameState.mouseY); break;
            case 'control': this.controlTechnique(tech, player, angle); break;
            case 'ultimate': this.ultimateTechnique(tech, player); break;
            default: Game.showMessage(`施展 ${tech.name}！`);
        }
    },
    
    fireProjectile(tech, player, angle) {
        GameState.projectiles.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * (tech.speed || 8), vy: Math.sin(angle) * (tech.speed || 8),
            power: tech.power, range: tech.range || 200, traveled: 0, color: tech.color || '#88aaff',
            effect: tech.effect, owner: player, tech: tech, size: tech.effect === 'blade' ? 15 : 8
        });
        Game.showMessage(`施展 ${tech.name}！`);
        GameState.addParticle(player.x, player.y, tech.color || '#88aaff', 10);
    },
    
    healingTechnique(tech, player) {
        const heal = (tech.healAmount || 30) * tech.power;
        player.health = Math.min(player.maxHealth, player.health + heal);
        GameState.addParticle(player.x, player.y, '#88ff88', 15);
        Game.showMessage(`${tech.name}！恢复 ${Math.floor(heal)} 生命`, 'success');
    },
    
    defenseTechnique(tech, player) {
        player.effects.push({ type: 'shield', power: tech.power, duration: tech.duration || 5 });
        GameState.addParticle(player.x, player.y, tech.color || '#aaffaa', 20);
        Game.showMessage(`${tech.name}！护盾持续 ${tech.duration}秒`, 'success');
    },
    
    movementTechnique(tech, player, tx, ty) {
        const dist = Math.hypot(tx - player.x, ty - player.y);
        const maxDist = tech.range || 200;
        if (dist > maxDist) { tx = player.x + (tx - player.x) * maxDist / dist; ty = player.y + (ty - player.y) * maxDist / dist; }
        player.x = tx; player.y = ty;
        if (player.body) Core.setPosition(player.body, { x: tx, y: ty });
        GameState.addParticle(tx, ty, '#aaddff', 20);
        Game.showMessage(`${tech.name}！瞬移成功`, 'success');
    },
    
    controlTechnique(tech, player, angle) {
        const targets = CombatSystem.findTargets(player.x, player.y, tech.range || 180);
        targets.forEach(t => {
            t.effects = t.effects || []; t.effects.push({ type: 'stun', duration: tech.duration || 2 });
            t.stunned = true;
            setTimeout(() => { t.stunned = false; }, (tech.duration || 2) * 1000);
            GameState.addParticle(t.x, t.y, tech.color || '#dd88ff', 10);
        });
        Game.showMessage(`${tech.name}！控制了 ${targets.length} 个目标`, 'success');
    },
    
    ultimateTechnique(tech, player) {
        player.effects.push({ type: 'ultimate', power: tech.power, duration: tech.duration || 10 });
        player.attack *= tech.power; player.defense *= tech.power * 0.5;
        setTimeout(() => { player.attack /= tech.power; player.defense /= tech.power * 0.5; }, tech.duration * 1000);
        GameState.addParticle(player.x, player.y, '#ffdd44', 40);
        Game.showMessage(`${tech.name}！全属性大幅提升！`, 'success');
    },
    
    update(dt) { for (let i = 0; i < 3; i++) if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt); this.updateUI(); },
    
    updateUI() {
        for (let i = 0; i < 3; i++) {
            const tech = this.slots[i] ? GameData.techniques.find(t => t.id === this.slots[i]) : null;
            const iconEl = document.getElementById(`quickIcon${i+1}`);
            const cdEl = document.getElementById(`quickCD${i+1}`);
            const manaEl = document.getElementById(`quickMana${i+1}`);
            const slotEl = document.getElementById(`quickSlot${i+1}`);
            if (tech) {
                iconEl.textContent = tech.icon || '⬡';
                iconEl.title = `${tech.name}: ${tech.description}`;
                manaEl.textContent = tech.manaCost || 15;
                cdEl.style.height = (this.cooldowns[i] / 1) * 100 + '%';
                slotEl.classList.toggle('active', this.cooldowns[i] <= 0);
            } else { iconEl.textContent = '-'; manaEl.textContent = ''; cdEl.style.height = '0%'; }
        }
    }
};
