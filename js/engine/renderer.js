/**
 * 渲染系统模块 - 二级节点
 * 处理所有游戏图形渲染
 */

const Renderer = {
    ctx: null, canvas: null, camera: null,
    
    init(ctx, canvas) {
        this.ctx = ctx; this.canvas = canvas;
        this.camera = { x: 0, y: 0, width: canvas.width, height: canvas.height, zoom: 1, target: null };
        Graphics.init(ctx);
    },
    
    clear() {
        this.ctx.fillStyle = '#0a0a1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    updateCamera(target) {
        if (target) {
            this.camera.x += (target.x - this.camera.x) * 0.1;
            this.camera.y += (target.y - this.camera.y) * 0.1;
        }
    },
    
    worldToScreen(wx, wy) {
        return { x: (wx - this.camera.x + this.camera.width/2) * this.camera.zoom,
                 y: (wy - this.camera.y + this.camera.height/2) * this.camera.zoom };
    },
    
    screenToWorld(sx, sy) {
        return { x: sx / this.camera.zoom + this.camera.x - this.camera.width/2,
                 y: sy / this.camera.zoom + this.camera.y - this.camera.height/2 };
    },
    
    render(state) {
        this.updateCamera(state.player);
        this.renderBackground(state);
        this.renderSpiritualAreas(state);
        this.renderWeather(state);
        this.renderTerrain(state);
        this.renderBuildings(state);
        this.renderResources(state);
        this.renderItems(state);
        this.renderNPCs(state);
        this.renderPlayer(state.player);
        this.renderParticles(state);
        this.renderUI(state);
        this.renderMinimap(state);
    },
    
    renderBackground(state) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a1e');
        gradient.addColorStop(0.5, '#151530');
        gradient.addColorStop(1, '#1a1a3a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 137.5 + state.time * 0.01) % this.canvas.width;
            const y = (i * 73.7) % (this.canvas.height * 0.6);
            this.ctx.beginPath();
            this.ctx.arc(x, y, Math.sin(state.time * 0.001 + i) * 0.5 + 1, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },
    
    renderSpiritualAreas(state) {
        state.spiritualAreas.forEach(area => {
            const screen = this.worldToScreen(area.x, area.y);
            const radius = area.radius * this.camera.zoom;
            if (screen.x + radius > 0 && screen.x - radius < this.canvas.width &&
                screen.y + radius > 0 && screen.y - radius < this.canvas.height) {
                const gradient = this.ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius);
                gradient.addColorStop(0, `rgba(170, 100, 255, ${0.1 + area.level * 0.05})`);
                gradient.addColorStop(1, 'rgba(170, 100, 255, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    },
    
    renderWeather(state) {
        const w = WeatherSystem;
        if (w.type === 'rain') {
            this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)'; this.ctx.lineWidth = 1;
            for (let i = 0; i < w.intensity * 100; i++) {
                const x = (Math.random() * this.canvas.width + state.time * 0.5) % this.canvas.width;
                const y = (Math.random() * this.canvas.height + state.time * 2) % this.canvas.height;
                this.ctx.beginPath(); this.ctx.moveTo(x, y); this.ctx.lineTo(x + 5, y + 20); this.ctx.stroke();
            }
        }
        if (w.type === 'snow') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let i = 0; i < w.intensity * 50; i++) {
                const x = (Math.random() * this.canvas.width + Math.sin(state.time * 0.001 + i) * 50) % this.canvas.width;
                this.ctx.beginPath(); this.ctx.arc(x, (state.time * 0.5 + i * 20) % this.canvas.height, 2, 0, Math.PI * 2); this.ctx.fill();
            }
        }
        if (w.type === 'fog') {
            this.ctx.fillStyle = `rgba(200, 200, 220, ${w.intensity * 0.3})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },
    
    renderTerrain(state) {
        const startX = Math.floor((this.camera.x - this.camera.width/2) / 100) * 100;
        const startY = Math.floor((this.camera.y - this.camera.height/2) / 100) * 100;
        for (let x = startX; x < this.camera.x + this.camera.width/2; x += 100) {
            for (let y = startY; y < this.camera.y + this.camera.height/2; y += 100) {
                const screen = this.worldToScreen(x, y);
                const variation = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 0.1;
                this.ctx.fillStyle = `rgb(${26 + variation * 20}, ${42 + variation * 20}, ${26 + variation * 20})`;
                this.ctx.fillRect(screen.x, screen.y, 100 * this.camera.zoom, 100 * this.camera.zoom);
            }
        }
        state.decorations.forEach(dec => {
            const screen = this.worldToScreen(dec.x, dec.y);
            if (screen.x > -50 && screen.x < this.canvas.width + 50 && screen.y > -50 && screen.y < this.canvas.height + 50)
                Graphics.drawDecoration(screen.x, screen.y, dec.type, this.camera.zoom);
        });
    },
    
    renderBuildings(state) {
        state.buildings.forEach(b => {
            const screen = this.worldToScreen(b.x, b.y);
            if (screen.x + b.width > 0 && screen.x - b.width < this.canvas.width)
                Graphics.drawBuilding(screen.x, screen.y, b, this.camera.zoom);
        });
    },
    
    renderResources(state) {
        state.resources.forEach(res => {
            const screen = this.worldToScreen(res.x, res.y);
            if (screen.x + res.size > 0 && screen.x - res.size < this.canvas.width)
                Graphics.drawResource(screen.x, screen.y, res, this.camera.zoom);
        });
    },
    
    renderItems(state) {
        state.droppedItems.forEach(item => {
            const screen = this.worldToScreen(item.x, item.y);
            this.ctx.shadowColor = item.color || '#ffff00';
            this.ctx.shadowBlur = 10 * (Math.sin(state.time * 0.005) * 0.3 + 0.7);
            Graphics.drawItem(screen.x, screen.y, item, this.camera.zoom);
            this.ctx.shadowBlur = 0;
        });
    },
    
    renderNPCs(state) {
        state.npcs.forEach(npc => {
            const screen = this.worldToScreen(npc.x, npc.y);
            if (screen.x > -50 && screen.x < this.canvas.width + 50) {
                Graphics.drawNPC(screen.x, screen.y, npc, this.camera.zoom, state.time);
                Graphics.drawNameTag(screen.x, screen.y - npc.size * this.camera.zoom - 20, npc.name, npc.faction, this.camera.zoom);
            }
        });
    },
    
    renderPlayer(p) {
        const screen = this.worldToScreen(p.x, p.y);
        Graphics.drawPlayer(screen.x, screen.y, p, this.camera.zoom);
    },
    
    renderParticles(state) {
        state.particles.forEach(p => {
            const screen = this.worldToScreen(p.x, p.y);
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, p.size * this.camera.zoom, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    },
    
    renderUI(state) {
        if (CombatSystem.isAttacking) {
            const screen = this.worldToScreen(state.player.x, state.player.y);
            this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'; this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, CombatSystem.attackRange * this.camera.zoom, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        if (BuildingSystem.isBuilding && BuildingSystem.previewBuilding) {
            const screen = this.worldToScreen(state.mouseX, state.mouseY);
            this.ctx.globalAlpha = 0.5;
            Graphics.drawBuilding(screen.x, screen.y, BuildingSystem.previewBuilding, this.camera.zoom);
            this.ctx.globalAlpha = 1;
        }
    },
    
    renderMinimap(state) {
        const canvas = document.getElementById('minimapCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 150; canvas.height = 150;
        ctx.fillStyle = '#0a0a1e'; ctx.fillRect(0, 0, 150, 150);
        const scale = 150 / 3000;
        state.spiritualAreas.forEach(a => {
            ctx.fillStyle = `rgba(170, 100, 255, ${a.level * 0.1})`;
            ctx.beginPath(); ctx.arc(a.x * scale, a.y * scale, a.radius * scale, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = '#4a4a8a';
        state.buildings.forEach(b => ctx.fillRect((b.x - b.width/2) * scale, (b.y - b.height/2) * scale, b.width * scale, b.height * scale));
        ctx.fillStyle = '#44ff44';
        state.npcs.forEach(n => { ctx.beginPath(); ctx.arc(n.x * scale, n.y * scale, 2, 0, Math.PI * 2); ctx.fill(); });
        ctx.fillStyle = '#ff4444';
        ctx.beginPath(); ctx.arc(state.player.x * scale, state.player.y * scale, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        ctx.strokeRect((this.camera.x - this.camera.width/2) * scale, (this.camera.y - this.camera.height/2) * scale,
            this.camera.width * scale, this.camera.height * scale);
    }
};

// 图形工具类
const Graphics = {
    ctx: null,
    init(ctx) { this.ctx = ctx; },
    
    drawPlayer(x, y, p, z) {
        const ctx = this.ctx, s = p.size * z;
        ctx.strokeStyle = `rgba(170, 100, 255, ${p.spiritualPower / p.maxSpiritualPower})`;
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s + 5, 0, Math.PI * 2); ctx.stroke();
        const g = ctx.createRadialGradient(x, y - s/4, 0, x, y, s);
        g.addColorStop(0, '#6a8fff'); g.addColorStop(1, '#3a5fbf');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
        if (p.faction) { ctx.fillStyle = p.faction.color; ctx.beginPath(); ctx.arc(x, y + s/3, s * 0.7, 0, Math.PI); ctx.fill(); }
        ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(x, y - s/3, s * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x - s * 0.15, y - s * 0.35, s * 0.08, 0, Math.PI * 2); ctx.arc(x + s * 0.15, y - s * 0.35, s * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `${12 * z}px Microsoft YaHei`; ctx.textAlign = 'center'; ctx.fillText(p.name, x, y - s - 10);
        ctx.fillStyle = '#333'; ctx.fillRect(x - s, y - s - 25, s * 2, 4 * z);
        ctx.fillStyle = '#ff4444'; ctx.fillRect(x - s, y - s - 25, s * 2 * (p.health / p.maxHealth), 4 * z);
    },
    
    drawNPC(x, y, npc, z, time) {
        const ctx = this.ctx, s = npc.size * z;
        const bob = Math.sin(time * 0.003 + npc.id) * 2;
        // 怪物使用不同颜色和样式
        if (npc.isMonster) {
            ctx.fillStyle = '#8b4513';
            ctx.beginPath(); ctx.arc(x, y + bob, s, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#654321';
            ctx.beginPath(); ctx.arc(x, y - s/4 + bob, s * 0.6, 0, Math.PI * 2); ctx.fill();
            // 红色眼睛
            ctx.fillStyle = '#ff0000';
            ctx.beginPath(); ctx.arc(x - s * 0.2, y - s * 0.2 + bob, s * 0.15, 0, Math.PI * 2);
            ctx.arc(x + s * 0.2, y - s * 0.2 + bob, s * 0.15, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = npc.faction ? npc.faction.color : '#8a8aaa';
            ctx.beginPath(); ctx.arc(x, y + bob, s, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = npc.skinColor || '#e0c0a0';
            ctx.beginPath(); ctx.arc(x, y - s/3 + bob, s * 0.45, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(x - s * 0.15, y - s * 0.35 + bob, s * 0.1, 0, Math.PI * 2);
            ctx.arc(x + s * 0.15, y - s * 0.35 + bob, s * 0.1, 0, Math.PI * 2); ctx.fill();
            if (npc.isQuestGiver) { ctx.fillStyle = '#ffff44'; ctx.font = `${14 * z}px Arial`; ctx.fillText('!', x, y - s - 20 + bob); }
        }
        // 血条
        ctx.fillStyle = '#333'; ctx.fillRect(x - s, y - s - 25, s * 2, 4 * z);
        ctx.fillStyle = npc.isMonster ? '#ff4444' : '#44ff44';
        ctx.fillRect(x - s, y - s - 25, s * 2 * (npc.health / npc.maxHealth), 4 * z);
    },
    
    drawBuilding(x, y, b, z) {
        const ctx = this.ctx, w = b.width * z, h = b.height * z;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - w/2 + 5, y - h/2 + 5, w, h);
        ctx.fillStyle = b.color || '#5a5a7a'; ctx.fillRect(x - w/2, y - h/2, w, h);
        ctx.strokeStyle = '#7a7a9a'; ctx.lineWidth = 2; ctx.strokeRect(x - w/2, y - h/2, w, h);
        if (b.hasRoof) { ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(x - w/2 - 10, y - h/2); ctx.lineTo(x, y - h/2 - h/3); ctx.lineTo(x + w/2 + 10, y - h/2); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 15 * z, y + h/2 - 40 * z, 30 * z, 40 * z);
        if (b.hasWindows) { ctx.fillStyle = '#88aacc'; ctx.fillRect(x - w/4 - 10 * z, y - h/4, 20 * z, 20 * z); ctx.fillRect(x + w/4 - 10 * z, y - h/4, 20 * z, 20 * z); }
        if (b.type === 'campfire' || b.isFireSource) this.drawFire(x, y - h/2, z);
    },
    
    drawFire(x, y, z) {
        const ctx = this.ctx, time = Date.now();
        for (let i = 0; i < 8; i++) {
            const fh = 20 + Math.sin(time * 0.01 + i) * 10, off = Math.sin(time * 0.005 + i * 2) * 5;
            const g = ctx.createLinearGradient(x + off, y, x + off, y - fh * z);
            g.addColorStop(0, '#ff4400'); g.addColorStop(0.5, '#ff8800'); g.addColorStop(1, 'rgba(255,200,0,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + off - 8 * z, y);
            ctx.quadraticCurveTo(x + off, y - fh * z, x + off + 8 * z, y); ctx.closePath(); ctx.fill();
        }
        const glow = ctx.createRadialGradient(x, y - 10 * z, 0, x, y - 10 * z, 50 * z);
        glow.addColorStop(0, 'rgba(255,150,50,0.3)'); glow.addColorStop(1, 'rgba(255,150,50,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y - 10 * z, 50 * z, 0, Math.PI * 2); ctx.fill();
    },
    
    drawResource(x, y, r, z) {
        const ctx = this.ctx, s = r.size * z;
        if (r.type === 'tree') { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 8 * z, y - s * 0.3, 16 * z, s * 0.6); ctx.fillStyle = '#2a5a2a'; ctx.beginPath(); ctx.arc(x, y - s * 0.5, s * 0.7, 0, Math.PI * 2); ctx.fill(); }
        else if (r.type === 'rock') { ctx.fillStyle = '#6a6a7a'; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.5, y - s); ctx.lineTo(x + s * 0.5, y - s * 0.8); ctx.lineTo(x + s, y); ctx.closePath(); ctx.fill(); }
        else if (r.type === 'herb') { ctx.strokeStyle = '#4a8a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s); ctx.stroke(); ctx.fillStyle = '#6aba6a'; ctx.beginPath(); ctx.ellipse(x - 8 * z, y - s * 0.7, 8 * z, 4 * z, -0.5, 0, Math.PI * 2); ctx.ellipse(x + 8 * z, y - s * 0.5, 8 * z, 4 * z, 0.5, 0, Math.PI * 2); ctx.fill(); }
        else if (r.type === 'spirit_stone') { const g = ctx.createRadialGradient(x, y, 0, x, y, s * 2); g.addColorStop(0, 'rgba(170,100,255,0.5)'); g.addColorStop(1, 'rgba(170,100,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#aa88ff'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.7, y); ctx.lineTo(x, y + s * 0.5); ctx.lineTo(x - s * 0.7, y); ctx.closePath(); ctx.fill(); }
        else if (r.type === 'water') { ctx.fillStyle = 'rgba(50,100,200,0.6)'; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.6, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#fff'; ctx.font = `${10 * z}px Arial`; ctx.textAlign = 'center'; ctx.fillText(`${r.amount}`, x, y + s + 15);
    },
    
    drawItem(x, y, item, z) { const ctx = this.ctx; ctx.fillStyle = item.color || '#ffaa44'; ctx.font = `${14 * z}px Arial`; ctx.textAlign = 'center'; ctx.fillText(item.icon || '●', x, y + 5); },
    drawNameTag(x, y, name, faction, z) { const ctx = this.ctx; ctx.fillStyle = faction ? faction.color : '#fff'; ctx.font = `${11 * z}px Microsoft YaHei`; ctx.textAlign = 'center'; ctx.fillText(name, x, y); },
    drawDecoration(x, y, type, z) {
        const ctx = this.ctx;
        if (type === 'grass') { ctx.strokeStyle = '#3a5a3a'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * 5 * z, y); ctx.lineTo(x + i * 5 * z - 3, y - 15 * z); ctx.stroke(); } }
        else if (type === 'flower') { ctx.fillStyle = '#ff88ff'; ctx.beginPath(); ctx.arc(x, y - 10 * z, 5 * z, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffff44'; ctx.beginPath(); ctx.arc(x, y - 10 * z, 2 * z, 0, Math.PI * 2); ctx.fill(); }
        else if (type === 'bush') { ctx.fillStyle = '#2a4a2a'; ctx.beginPath(); ctx.arc(x, y, 20 * z, 0, Math.PI * 2); ctx.fill(); }
    }
};
