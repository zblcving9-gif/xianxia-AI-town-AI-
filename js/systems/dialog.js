/**
 * NPC对话系统模块 - 二级节点
 * 处理与NPC的对话交互，调用阿里云Qwen API
 */

const DialogSystem = {
    currentNPC: null, isDialogOpen: false, dialogHistory: [],
    apiKey: localStorage.getItem('qwen_api_key') || '',
    
    init() {},
    update(dt) {},
    
    startDialog(npc) {
        this.currentNPC = npc; this.isDialogOpen = true;
        FactionSystem.updateNPCRelation(npc);
        document.getElementById('dialogBox').classList.add('show');
        this.showOptions(npc);
    },
    
    showOptions(npc) {
        document.getElementById('dialogSpeaker').textContent = npc.name;
        document.getElementById('dialogContent').innerHTML = this.getGreeting(npc);
        let opt = `<div class="dialog-option" onclick="DialogSystem.ask('greeting')">问候</div>`;
        if (npc.isQuestGiver) opt += `<div class="dialog-option" onclick="DialogSystem.ask('quest')">询问任务</div>`;
        if (npc.type === 'blacksmith') opt += `<div class="dialog-option" onclick="DialogSystem.ask('craft')">打造装备</div>`;
        if (npc.type === 'merchant') opt += `<div class="dialog-option" onclick="DialogSystem.ask('trade')">交易</div>`;
        if (npc.type === 'herbalist') opt += `<div class="dialog-option" onclick="DialogSystem.ask('alchemy')">炼丹</div>`;
        opt += `<div class="dialog-option" onclick="DialogSystem.freeChat()">自由对话</div>`;
        opt += `<div class="dialog-option" onclick="DialogSystem.showApiSettings()">API设置</div>`;
        opt += `<div class="dialog-option" onclick="DialogSystem.endDialog()">离开</div>`;
        document.getElementById('dialogOptions').innerHTML = opt;
    },
    
    getGreeting(npc) {
        const r = npc.relationship;
        if (r >= 50) return `"${GameState.player.name}道友！很高兴见到你！"`;
        if (r >= 20) return `"哦，是${GameState.player.name}啊，有什么事吗？"`;
        if (r >= -20) return `"..."`;
        return `"哼，又是你，有什么话快说。"`;
    },
    
    ask(topic) {
        const npc = this.currentNPC;
        let res = '';
        if (topic === 'greeting') { res = this.generateGreetingResponse(npc); npc.relationship += 1; }
        else if (topic === 'quest') res = this.generateQuestResponse(npc);
        else if (topic === 'craft') res = this.showCraftMenu();
        else if (topic === 'trade') res = this.showTradeMenu();
        else if (topic === 'alchemy') res = this.showAlchemyMenu();
        document.getElementById('dialogContent').innerHTML = res;
        document.getElementById('dialogOptions').innerHTML = `<div class="dialog-option" onclick="DialogSystem.showOptions(DialogSystem.currentNPC)">返回</div>`;
    },
    
    generateGreetingResponse(npc) {
        const r = { elder:'"修行之路漫漫，道友要多加努力。"', blacksmith:'"我的铁锤可是千锤百炼！"', merchant:'"做生意讲究诚信！"', herbalist:'"天地灵物，皆可入药。"', disciple:'"师兄好！我正在努力修炼。"', leader:'"门派的发展需要每个人的努力。"', wanderer:'"修仙之路，各自有缘。"' };
        return r[npc.type] || '"你好，有什么事吗？"';
    },
    
    generateQuestResponse() {
        return `<p>"道友，我正需要一些材料。"</p><p>任务: 采集5个灵草</p><p>奖励: 20修炼点, 30金币</p><div class="dialog-option" onclick="DialogSystem.acceptQuest()">接受任务</div>`;
    },
    
    acceptQuest() {
        if (GameState.hasItem(GameState.player, 'herb', 5)) {
            GameState.removeItem(GameState.player, 'herb', 5);
            GameState.player.cultivation += 20; GameState.player.gold += 30;
            this.currentNPC.relationship += 10;
            Game.showMessage('任务完成！获得奖励', 'success');
            this.showOptions(this.currentNPC);
        } else { Game.showMessage('任务条件未满足', 'warning'); }
    },
    
    showCraftMenu() {
        return `<p>"我可以帮你打造装备："</p><button class="action-btn" onclick="DialogSystem.craftItem('sword')">打造剑(石材x10,金币x50)</button><button class="action-btn" onclick="DialogSystem.craftItem('armor')">打造护甲(石材x15,金币x80)</button>`;
    },
    
    craftItem(type) {
        const c = { sword: { stone: 10, gold: 50 }, armor: { stone: 15, gold: 80 } };
        if (GameState.hasItem(GameState.player, 'stone', c[type].stone) && GameState.player.gold >= c[type].gold) {
            GameState.removeItem(GameState.player, 'stone', c[type].stone);
            GameState.player.gold -= c[type].gold;
            if (type === 'sword') { GameState.player.attack += 5; Game.showMessage('攻击力+5', 'success'); }
            else { GameState.player.defense += 3; Game.showMessage('防御力+3', 'success'); }
        } else { Game.showMessage('材料不足', 'warning'); }
    },
    
    showTradeMenu() {
        return `<p>"看看有什么需要的："</p><button class="action-btn" onclick="DialogSystem.buyItem('pill_healing',30)">疗伤丹-30金币</button><button class="action-btn" onclick="DialogSystem.buyItem('pill_cultivation',80)">聚气丹-80金币</button><button class="action-btn" onclick="DialogSystem.buyItem('herb',10)">灵草-10金币</button>`;
    },
    
    buyItem(id, price) {
        if (GameState.player.gold >= price) {
            GameState.player.gold -= price;
            GameState.addItem(GameState.player, { ...GameData.items[id], count: 1 });
            Game.showMessage('购买成功', 'success');
        } else { Game.showMessage('金币不足', 'warning'); }
    },
    
    showAlchemyMenu() {
        return `<p>"我可以帮你炼制丹药："</p><button class="action-btn" onclick="DialogSystem.craftPill('healing')">疗伤丹(灵草x3)</button><button class="action-btn" onclick="DialogSystem.craftPill('cultivation')">聚气丹(灵草x5,灵石x1)</button>`;
    },
    
    craftPill(type) {
        const p = GameState.player;
        if (type === 'healing' && GameState.hasItem(p, 'herb', 3)) {
            GameState.removeItem(p, 'herb', 3);
            GameState.addItem(p, { ...GameData.items.pill_healing, count: 1 });
            Game.showMessage('炼丹成功', 'success');
        } else if (type === 'cultivation' && GameState.hasItem(p, 'herb', 5) && GameState.hasItem(p, 'spirit_stone', 1)) {
            GameState.removeItem(p, 'herb', 5); GameState.removeItem(p, 'spirit_stone', 1);
            GameState.addItem(p, { ...GameData.items.pill_cultivation, count: 1 });
            Game.showMessage('炼丹成功', 'success');
        } else { Game.showMessage('材料不足', 'warning'); }
    },
    
    async freeChat() {
        document.getElementById('dialogContent').innerHTML = `<p>输入你想说的话：</p><input type="text" id="chatInput" style="width:100%;padding:8px;background:#2a2a4a;border:1px solid #4a4a8a;color:#fff;border-radius:4px;" onkeypress="if(event.key==='Enter')DialogSystem.sendChat()">`;
        document.getElementById('dialogOptions').innerHTML = `<div class="dialog-option" onclick="DialogSystem.sendChat()">发送</div><div class="dialog-option" onclick="DialogSystem.showOptions(DialogSystem.currentNPC)">返回</div>`;
    },
    
    async sendChat() {
        const msg = document.getElementById('chatInput').value.trim();
        if (!msg) return;
        document.getElementById('dialogContent').innerHTML = '<p>思考中...</p>';
        const res = await this.callQwenAPI(msg);
        document.getElementById('dialogContent').innerHTML = `<p>${res}</p>`;
        this.dialogHistory.push({ role: 'user', content: msg }, { role: 'assistant', content: res });
    },
    
    showApiSettings() {
        document.getElementById('dialogContent').innerHTML = `<p>配置阿里云Qwen API:</p><p style="font-size:12px;color:#aaa;">获取:dashscope.console.aliyun.com</p><input type="text" id="apiKeyInput" value="${this.apiKey}" placeholder="输入API Key" style="width:100%;padding:8px;margin-top:10px;background:#2a2a4a;border:1px solid #4a4a8a;color:#fff;border-radius:4px;">`;
        document.getElementById('dialogOptions').innerHTML = `<div class="dialog-option" onclick="DialogSystem.saveApiKey()">保存</div><div class="dialog-option" onclick="DialogSystem.showOptions(DialogSystem.currentNPC)">返回</div>`;
    },
    
    saveApiKey() {
        this.apiKey = document.getElementById('apiKeyInput').value.trim();
        localStorage.setItem('qwen_api_key', this.apiKey);
        Game.showMessage('API Key已保存', 'success');
        this.showOptions(this.currentNPC);
    },
    
    async callQwenAPI(message) {
        if (!this.apiKey) return '请先在API设置中配置您的阿里云Qwen API Key。';
        const npc = this.currentNPC;
        const messages = [
            { role: 'system', content: `你是修仙世界NPC，名字${npc.name}，身份${this.getNPCRole(npc.type)}。关系值${npc.relationship}。用修仙语气回复，不超过80字。` },
            ...this.dialogHistory.slice(-6), { role: 'user', content: message }
        ];
        try {
            const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                body: JSON.stringify({ model: 'qwen-turbo', messages })
            });
            const data = await res.json();
            return data.choices?.[0]?.message?.content || '响应异常';
        } catch (e) { return this.simulateResponse(npc); }
    },
    
    simulateResponse(npc) {
        const r = { elder: ['修行之道，在于持之以恒。', '道友有何困惑？'], blacksmith: ['我的锻造技术可是祖传的！'], merchant: ['客官想要什么？'], disciple: ['师兄好！'] };
        return (r[npc.type] || ['嗯。'])[Math.floor(Math.random() * (r[npc.type]?.length || 1))];
    },
    
    getNPCRole(type) {
        return { elder: '门派长老', blacksmith: '铁匠', merchant: '商人', herbalist: '药农', disciple: '弟子', leader: '掌门', wanderer: '散修' }[type] || '修仙者';
    },
    
    endDialog() { this.currentNPC = null; this.isDialogOpen = false; document.getElementById('dialogBox').classList.remove('show'); }
};
