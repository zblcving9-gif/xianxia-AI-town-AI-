/**
 * NPC AI决策系统模块 - 二级节点
 * NPC完整行为AI：门派、任务、采集、合成、建造
 */

const NPCAISystem = {
    // NPC行为权重表（按NPC类型）
    BEHAVIOR_WEIGHTS: {
        elder:      { cultivate: 35, gather: 10, craft: 20, faction: 25, build: 10 },
        leader:     { cultivate: 25, gather: 5,  craft: 15, faction: 40, build: 15 },
        disciple:   { cultivate: 40, gather: 20, craft: 15, faction: 20, build: 5  },
        herbalist:  { cultivate: 15, gather: 45, craft: 25, faction: 10, build: 5  },
        blacksmith: { cultivate: 10, gather: 20, craft: 45, faction: 5,  build: 20 },
        merchant:   { cultivate: 10, gather: 30, craft: 20, faction: 15, build: 25 },
        wanderer:   { cultivate: 30, gather: 35, craft: 20, faction: 5,  build: 10 },
        monster:    { cultivate: 0,  gather: 0,  craft: 0,  faction: 0,  build: 0  }
    },

    // 可合成配方（NPC用简化版）
    NPC_RECIPES: [
        { id: 'cooked_meat', name: '熟肉', needs: { raw_meat: 1 }, result: { id: 'cooked_meat', name: '熟肉', icon: '🍖', type: 'food', value: 15, heal: 20, hunger: 30 } },
        { id: 'pill_healing', name: '疗伤丹', needs: { herb: 3 }, result: { id: 'pill_healing', name: '疗伤丹', icon: '💊', type: 'medicine', value: 30, heal: 50 } },
        { id: 'pill_cultivation', name: '聚气丹', needs: { herb: 5, spirit_stone: 1 }, result: { id: 'pill_cultivation', name: '聚气丹', icon: '💊', type: 'medicine', value: 100, cultivation: 20 } }
    ],

    // 可建造列表（NPC用）
    NPC_BUILDABLE: ['campfire', 'house', 'training_ground'],

    // ── 主入口：每帧刷新AI决策 ──────────────────────────────────────────
    updateAI(npc, dt) {
        if (npc.isMonster) return; // 怪物由state.js的简单AI处理
        this.tickNeedDriven(npc, dt);   // 基于需求驱动
        if (npc.aiTimer > 0) { npc.aiTimer -= dt; return; }
        this.decide(npc);
    },

    // 需求驱动（饥饿/血量 → 紧急行为）
    tickNeedDriven(npc, dt) {
        // 饥饿 → 找食物
        if ((npc.hunger || 100) < 20 && npc.aiState !== 'eat') {
            this.doEat(npc);
        }
        // 血量低 → 使用疗伤丹
        if (npc.health < npc.maxHealth * 0.3 && GameState.hasItem(npc, 'pill_healing', 1)) {
            GameState.removeItem(npc, 'pill_healing', 1);
            npc.health = Math.min(npc.maxHealth, npc.health + 50);
            GameState.addParticle(npc.x, npc.y, '#88ff88', 6);
        }
    },

    // ── 核心决策：按权重随机选行为 ──────────────────────────────────────
    decide(npc) {
        const weights = this.BEHAVIOR_WEIGHTS[npc.type] || this.BEHAVIOR_WEIGHTS.wanderer;
        const roll = Math.random() * 100;
        let acc = 0;

        if ((acc += weights.faction) > roll && !npc.factionName) {
            this.tryJoinFaction(npc); return;
        }
        if ((acc += weights.gather) > roll) { this.doGather(npc); return; }
        if ((acc += weights.craft) > roll)  { this.doCraft(npc);  return; }
        if ((acc += weights.build) > roll)  { this.doBuild(npc);  return; }
        this.doCultivate(npc);
    },

    // ── 加入门派 ────────────────────────────────────────────────────────
    tryJoinFaction(npc) {
        // 已有门派则做门派任务
        if (npc.factionName) { this.doFactionTask(npc); return; }
        const factions = GameData.factions;
        // 根据NPC类型偏好选门派
        const pref = { elder:'青云门', leader:'青云门', disciple:'青云门',
                       herbalist:'药王谷', blacksmith:'万剑宗', merchant:'天音宗', wanderer:null };
        let picked = pref[npc.type];
        if (!picked) picked = factions[Math.floor(Math.random() * factions.length)].name;
        const faction = GameData.factions.find(f => f.name === picked) || factions[0];

        npc.factionName = faction.name;
        npc.faction = { name: faction.name, color: faction.color };
        npc.factionContribution = 0;
        npc.factionRank = 0;
        // 应用加成
        if (faction.bonus.cultivation) npc.cultivationSpeed = (npc.cultivationSpeed || 1) * faction.bonus.cultivation;
        if (faction.bonus.combat) npc.attack = Math.round(npc.attack * faction.bonus.combat);

        GameState.addParticle(npc.x, npc.y, faction.color, 12);
        npc.aiTimer = 5;
    },

    // ── 门派任务 ────────────────────────────────────────────────────────
    doFactionTask(npc) {
        if (!npc.factionName) return;
        npc.factionContribution = (npc.factionContribution || 0);
        const tasks = ['gather', 'combat', 'cultivate'];
        const task = tasks[Math.floor(Math.random() * tasks.length)];

        if (task === 'gather' && GameState.hasItem(npc, 'herb', 2)) {
            GameState.removeItem(npc, 'herb', 2);
            npc.factionContribution += 8;
        } else if (task === 'combat' && (npc.stamina || 100) >= 15) {
            npc.stamina -= 15;
            npc.cultivation = (npc.cultivation || 0) + 5;
            npc.factionContribution += 15;
        } else if (task === 'cultivate' && (npc.mana || 100) >= 20) {
            npc.mana -= 20;
            npc.cultivation = (npc.cultivation || 0) + 10;
            npc.factionContribution += 12;
        }
        this.checkNPCRankUp(npc);
        npc.aiTimer = 8 + Math.random() * 10;
    },

    checkNPCRankUp(npc) {
        const thresholds = [0, 50, 150, 400, 1000, 2500];
        const ranks = ['外门弟子','内门弟子','亲传弟子','长老','副掌门','掌门'];
        for (let i = thresholds.length - 1; i >= 0; i--) {
            if ((npc.factionContribution || 0) >= thresholds[i] && (npc.factionRank || 0) < i) {
                npc.factionRank = i;
                npc.name = `${npc.baseName || npc.name}(${ranks[i]})`;
                GameState.addParticle(npc.x, npc.y, npc.faction?.color || '#fff', 15);
                break;
            }
        }
    },

    // ── 采集 ────────────────────────────────────────────────────────────
    doGather(npc) {
        const nearby = ResourceSystem.getNearbyResources(npc.x, npc.y, 300);
        if (nearby.length === 0) { npc.aiTimer = 3; return; }
        const target = nearby[Math.floor(Math.random() * Math.min(nearby.length, 3))];
        const dist = Math.hypot(target.x - npc.x, target.y - npc.y);
        if (dist > ResourceSystem.gatherRange) {
            npc.state = 'walking';
            npc.targetX = target.x; npc.targetY = target.y;
            npc.aiState = 'gathering'; npc.aiTargetRes = target.id;
            npc.aiTimer = 3;
        } else {
            if (target.amount > 0 && (npc.stamina || 100) >= 5) {
                target.amount--;
                npc.stamina -= 3;
                const item = ResourceSystem.getDropItem(target.type);
                item.count = 1;
                GameState.addItem(npc, item);
                npc.cultivation = (npc.cultivation || 0) + 0.3;
                GameState.addParticle(target.x, target.y, '#aaffaa', 4);
                if (target.amount <= 0) {
                    target.respawnTime = ResourceSystem.getRespawnTime(target.type);
                    if (target.body) { Core.removeBody(target.body); target.body = null; }
                }
            }
            npc.aiTimer = 2 + Math.random() * 3;
        }
    },

    // ── 合成 ────────────────────────────────────────────────────────────
    doCraft(npc) {
        for (const recipe of this.NPC_RECIPES) {
            const canCraft = Object.entries(recipe.needs).every(([id, cnt]) => GameState.hasItem(npc, id, cnt));
            if (canCraft) {
                Object.entries(recipe.needs).forEach(([id, cnt]) => GameState.removeItem(npc, id, cnt));
                const result = { ...recipe.result, count: 1 };
                GameState.addItem(npc, result);
                GameState.addParticle(npc.x, npc.y, '#ffddaa', 8);
                npc.aiTimer = 4 + Math.random() * 4;
                return;
            }
        }
        // 没有材料 → 去采集
        this.doGather(npc);
    },

    // ── 建造 ────────────────────────────────────────────────────────────
    doBuild(npc) {
        const buildId = this.NPC_BUILDABLE[Math.floor(Math.random() * this.NPC_BUILDABLE.length)];
        const blueprint = GameData.buildings.find(b => b.id === buildId);
        if (!blueprint) { npc.aiTimer = 5; return; }

        // 检查材料
        const canBuild = Object.entries(blueprint.cost).every(([id, cnt]) => GameState.hasItem(npc, id, cnt));
        if (!canBuild) { this.doGather(npc); return; }

        // 扣除材料并建造
        Object.entries(blueprint.cost).forEach(([id, cnt]) => GameState.removeItem(npc, id, cnt));
        const bx = Math.max(80, Math.min(2920, npc.x + (Math.random() - 0.5) * 100));
        const by = Math.max(80, Math.min(1920, npc.y + (Math.random() - 0.5) * 100));
        GameState.buildings.push({
            id: `npc_build_${Date.now()}`, type: buildId, name: blueprint.name,
            x: bx, y: by, w: blueprint.width, h: blueprint.height,
            owner: npc.id, builtBy: npc.name, hp: 100, maxHp: 100
        });
        GameState.addParticle(bx, by, '#ffcc44', 15);
        npc.aiTimer = 10 + Math.random() * 10;
    },

    // ── 修炼 ────────────────────────────────────────────────────────────
    doCultivate(npc) {
        if ((npc.mana || 100) >= 15) {
            npc.mana -= 15;
            const area = SpiritualSystem.getSpiritualLevel(npc.x, npc.y);
            const speed = (npc.cultivationSpeed || 1) * area.bonus;
            npc.cultivation = (npc.cultivation || 0) + speed * (2 + Math.random() * 3);
            // 更新境界
            const realm = GameData.getRealm(npc.cultivation);
            npc.cultivationRealm = realm.name;
            GameState.addParticle(npc.x, npc.y, '#aaddff', 4);
        }
        npc.state = 'idle';
        npc.aiTimer = 5 + Math.random() * 8;
    },

    // ── 进食 ────────────────────────────────────────────────────────────
    doEat(npc) {
        if (GameState.hasItem(npc, 'cooked_meat', 1)) {
            GameState.removeItem(npc, 'cooked_meat', 1);
            npc.hunger = Math.min(npc.maxHunger || 100, (npc.hunger || 0) + 30);
            npc.health = Math.min(npc.maxHealth, (npc.health || 0) + 20);
        } else if (GameState.hasItem(npc, 'raw_meat', 1)) {
            GameState.removeItem(npc, 'raw_meat', 1);
            npc.hunger = Math.min(npc.maxHunger || 100, (npc.hunger || 0) + 15);
        } else {
            this.doGather(npc); // 没食物去采集
        }
        npc.aiState = 'idle';
        npc.aiTimer = 3;
    }
};
