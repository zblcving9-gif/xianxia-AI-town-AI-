/**
 * NPC对话系统模块 - 二级节点
 * 处理与NPC的对话交互，调用阿里云Qwen API
 */

const DialogSystem = {
    currentNPC: null,
    isDialogOpen: false,
    dialogHistory: [],
    
    init() {
        // 初始化对话系统
    },
    
    update(dt) {
        // 更新对话相关逻辑
    },
    
    startDialog(npc) {
        this.currentNPC = npc;
        this.isDialogOpen = true;
        
        // 更新关系
        FactionSystem.updateNPCRelation(npc);
        
        // 显示对话框
        const dialogBox = document.getElementById('dialogBox');
        dialogBox.classList.add('show');
        
        // 显示初始对话选项
        this.showOptions(npc);
    },
    
    showOptions(npc) {
        const speaker = document.getElementById('dialogSpeaker');
        const content = document.getElementById('dialogContent');
        const options = document.getElementById('dialogOptions');
        
        speaker.textContent = npc.name;
        
        // 根据NPC类型和关系显示不同内容
        let greeting = this.getGreeting(npc);
        content.innerHTML = greeting;
        
        // 生成选项
        let optionHTML = '';
        
        optionHTML += `<div class="dialog-option" onclick="DialogSystem.ask('greeting')">问候</div>`;
        
        if (npc.isQuestGiver) {
            optionHTML += `<div class="dialog-option" onclick="DialogSystem.ask('quest')">询问任务</div>`;
        }
        
        if (npc.type === 'blacksmith') {
            optionHTML += `<div class="dialog-option" onclick="DialogSystem.ask('craft')">打造装备</div>`;
        }
        
        if (npc.type === 'merchant') {
            optionHTML += `<div class="dialog-option" onclick="DialogSystem.ask('trade')">交易</div>`;
        }
        
        if (npc.type === 'herbalist') {
            optionHTML += `<div class="dialog-option" onclick="DialogSystem.ask('alchemy')">炼丹</div>`;
        }
        
        // 自由对话选项
        optionHTML += `<div class="dialog-option" onclick="DialogSystem.freeChat()">自由对话</div>`;
        
        optionHTML += `<div class="dialog-option" onclick="DialogSystem.endDialog()">离开</div>`;
        
        options.innerHTML = optionHTML;
    },
    
    getGreeting(npc) {
        const rel = npc.relationship;
        
        if (rel >= 50) {
            return `"${GameState.player.name}道友！很高兴见到你！"`;
        } else if (rel >= 20) {
            return `"哦，是${GameState.player.name}啊，有什么事吗？"`;
        } else if (rel >= -20) {
            return `"..."`;
        } else {
            return `"哼，又是你，有什么话快说。"`;
        }
    },
    
    ask(topic) {
        const npc = this.currentNPC;
        const content = document.getElementById('dialogContent');
        const options = document.getElementById('dialogOptions');
        
        let response = '';
        
        switch(topic) {
            case 'greeting':
                response = this.generateGreetingResponse(npc);
                npc.relationship += 1;
                break;
                
            case 'quest':
                response = this.generateQuestResponse(npc);
                break;
                
            case 'craft':
                response = this.showCraftMenu(npc);
                break;
                
            case 'trade':
                response = this.showTradeMenu(npc);
                break;
                
            case 'alchemy':
                response = this.showAlchemyMenu(npc);
                break;
        }
        
        content.innerHTML = response;
        options.innerHTML = `<div class="dialog-option" onclick="DialogSystem.showOptions(DialogSystem.currentNPC)">返回</div>`;
    },
    
    generateGreetingResponse(npc) {
        const responses = {
            elder: `"修行之路漫漫，道友要多加努力啊。我看你资质不错，假以时日必成大器。"`,
            blacksmith: `"我的铁锤可是千锤百炼，打造出来的法器都是上品！需要什么尽管说。"`,
            merchant: `"做生意讲究诚信，我这里的东西保证童叟无欺！看看有什么需要的？"`,
            herbalist: `"天地灵物，皆可入药。我这有些珍稀药材，道友若有需要可以换取。"`,
            disciple: `"师姐/师兄好！我正在努力修炼，争取早日突破。"`,
            leader: `"门派的发展需要每个人的努力，希望道友能为门派做出贡献。"`,
            wanderer: `"修仙之路，各自有缘。我是自由自在的散修，无拘无束。"`
        };
        
        return responses[npc.type] || `"你好，有什么事吗？"`;
    },
    
    generateQuestResponse(npc) {
        // 检查是否有未完成的任务
        const player = GameState.player;
        
        // 简单任务系统
        const quest = {
            type: 'gather',
            target: 'herb',
            count: 5,
            reward: { cultivation: 20, gold: 30 }
        };
        
        return `
            <p>"道友，我正需要一些材料。"</p>
            <p>任务: 采集 ${quest.count} 个灵草</p>
            <p>奖励: ${quest.reward.cultivation} 修炼点, ${quest.reward.gold} 金币</p>
            <div class="dialog-option" onclick="DialogSystem.acceptQuest()">接受任务</div>
        `;
    },
    
    acceptQuest() {
        const npc = this.currentNPC;
        const player = GameState.player;
        
        // 检查任务条件
        if (GameState.hasItem(player, 'herb', 5)) {
            GameState.removeItem(player, 'herb', 5);
            player.cultivation += 20;
            player.gold += 30;
            npc.relationship += 10;
            
            Game.showMessage('任务完成！获得奖励', 'success');
            this.showOptions(npc);
        } else {
            Game.showMessage('任务条件未满足', 'warning');
            document.getElementById('dialogContent').innerHTML = '<p>你还没有收集足够的灵草。</p>';
        }
    },
    
    showCraftMenu(npc) {
        return `
            <p>"我可以帮你打造装备："</p>
            <div style="margin-top: 10px;">
                <button class="action-btn" onclick="DialogSystem.craftItem('sword')">
                    打造剑 (石材x10, 金币x50)
                </button>
                <button class="action-btn" onclick="DialogSystem.craftItem('armor')">
                    打造护甲 (石材x15, 金币x80)
                </button>
            </div>
        `;
    },
    
    craftItem(itemType) {
        const player = GameState.player;
        const costs = {
            sword: { stone: 10, gold: 50 },
            armor: { stone: 15, gold: 80 }
        };
        
        const cost = costs[itemType];
        
        if (GameState.hasItem(player, 'stone', cost.stone) && player.gold >= cost.gold) {
            GameState.removeItem(player, 'stone', cost.stone);
            player.gold -= cost.gold;
            
            if (itemType === 'sword') {
                player.attack += 5;
                Game.showMessage('打造成功！攻击力+5', 'success');
            } else {
                player.defense += 3;
                Game.showMessage('打造成功！防御力+3', 'success');
            }
        } else {
            Game.showMessage('材料不足', 'warning');
        }
    },
    
    showTradeMenu(npc) {
        const items = [
            { id: 'pill_healing', name: '疗伤丹', price: 30 },
            { id: 'pill_cultivation', name: '聚气丹', price: 80 },
            { id: 'herb', name: '灵草', price: 10 }
        ];
        
        let html = '<p>"看看有什么需要的："</p><div style="margin-top: 10px;">';
        
        items.forEach(item => {
            html += `<button class="action-btn" onclick="DialogSystem.buyItem('${item.id}', ${item.price})">
                ${item.name} - ${item.price}金币
            </button>`;
        });
        
        html += '</div>';
        return html;
    },
    
    buyItem(itemId, price) {
        const player = GameState.player;
        
        if (player.gold >= price) {
            player.gold -= price;
            const item = { ...GameData.items[itemId], count: 1 };
            GameState.addItem(player, item);
            Game.showMessage(`购买成功！获得 ${item.name}`, 'success');
        } else {
            Game.showMessage('金币不足', 'warning');
        }
    },
    
    showAlchemyMenu(npc) {
        return `
            <p>"我可以帮你炼制丹药："</p>
            <div style="margin-top: 10px;">
                <button class="action-btn" onclick="DialogSystem.craftPill('healing')">
                    疗伤丹 (灵草x3)
                </button>
                <button class="action-btn" onclick="DialogSystem.craftPill('cultivation')">
                    聚气丹 (灵草x5, 灵石x1)
                </button>
            </div>
        `;
    },
    
    craftPill(type) {
        const player = GameState.player;
        
        if (type === 'healing') {
            if (GameState.hasItem(player, 'herb', 3)) {
                GameState.removeItem(player, 'herb', 3);
                const pill = { ...GameData.items.pill_healing, count: 1 };
                GameState.addItem(player, pill);
                Game.showMessage('炼丹成功！', 'success');
            } else {
                Game.showMessage('材料不足', 'warning');
            }
        } else if (type === 'cultivation') {
            if (GameState.hasItem(player, 'herb', 5) && GameState.hasItem(player, 'spirit_stone', 1)) {
                GameState.removeItem(player, 'herb', 5);
                GameState.removeItem(player, 'spirit_stone', 1);
                const pill = { ...GameData.items.pill_cultivation, count: 1 };
                GameState.addItem(player, pill);
                Game.showMessage('炼丹成功！', 'success');
            } else {
                Game.showMessage('材料不足', 'warning');
            }
        }
    },
    
    async freeChat() {
        const content = document.getElementById('dialogContent');
        const options = document.getElementById('dialogOptions');
        
        content.innerHTML = `
            <p>输入你想说的话：</p>
            <input type="text" id="chatInput" style="width: 100%; padding: 8px; margin-top: 10px; 
                   background: #2a2a4a; border: 1px solid #4a4a8a; color: #fff; border-radius: 4px;"
                   onkeypress="if(event.key==='Enter') DialogSystem.sendChat()">
        `;
        
        options.innerHTML = `
            <div class="dialog-option" onclick="DialogSystem.sendChat()">发送</div>
            <div class="dialog-option" onclick="DialogSystem.showOptions(DialogSystem.currentNPC)">返回</div>
        `;
    },
    
    async sendChat() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const content = document.getElementById('dialogContent');
        content.innerHTML = '<p>思考中...</p>';
        
        // 调用Qwen API
        const response = await this.callQwenAPI(message);
        
        content.innerHTML = `<p>${response}</p>`;
        
        // 记录对话历史
        this.dialogHistory.push({
            role: 'user',
            content: message
        });
        this.dialogHistory.push({
            role: 'assistant',
            content: response
        });
    },
    
    async callQwenAPI(message) {
        const npc = this.currentNPC;
        
        // 构建系统提示
        const systemPrompt = `你是一个修仙世界中的NPC，名字叫${npc.name}，身份是${this.getNPCRole(npc.type)}。
你的性格和说话方式要符合这个身份。
你与玩家的关系值是${npc.relationship}（-100到100，越高越友好）。
当前地点的天气是${WeatherSystem.weatherName}。
请用简洁、符合修仙世界观的语气回复，不要超过100字。`;
        
        // 构建对话历史
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.dialogHistory.slice(-6), // 只保留最近3轮对话
            { role: 'user', content: message }
        ];
        
        try {
            // 注意：这里需要替换为实际的API Key
            // 由于是本地演示，这里提供一个模拟响应
            const response = await this.simulateResponse(message, npc);
            return response;
            
            /* 真实API调用示例：
            const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_API_KEY`
                },
                body: JSON.stringify({
                    model: 'qwen-turbo',
                    input: {
                        messages: messages
                    }
                })
            });
            
            const data = await response.json();
            return data.output.text;
            */
        } catch (error) {
            console.error('API调用失败:', error);
            return this.simulateResponse(message, npc);
        }
    },
    
    simulateResponse(message, npc) {
        // 模拟AI响应（当API不可用时）
        const responses = {
            elder: [
                '修行之道，在于持之以恒。',
                '道友有何困惑？老夫愿为你指点迷津。',
                '天地大道，玄之又玄，需细细体悟。'
            ],
            blacksmith: [
                '我的锻造技术可是祖传的！',
                '想要好装备，得有好材料啊。',
                '铁要趁热打，人要趁早修。'
            ],
            merchant: [
                '客官想要什么？我这里应有尽有！',
                '诚信经营，童叟无欺。',
                '今日特惠，灵丹妙药八折！'
            ],
            disciple: [
                '师弟/师妹有什么指教？',
                '我正要去找师兄请教修炼问题。',
                '门派最近在招募新人呢。'
            ]
        };
        
        const npcResponses = responses[npc.type] || ['嗯，有意思的想法。'];
        return npcResponses[Math.floor(Math.random() * npcResponses.length)];
    },
    
    getNPCRole(type) {
        const roles = {
            elder: '门派长老，德高望重的修仙者',
            blacksmith: '铁匠，专门打造法器的匠人',
            merchant: '商人，四处行商的生意人',
            herbalist: '药农，精通药理的炼丹师',
            disciple: '门派弟子，正在修炼的年轻人',
            leader: '门派掌门，一派之主',
            wanderer: '散修，自由自在的修仙者'
        };
        return roles[type] || '普通修仙者';
    },
    
    endDialog() {
        this.currentNPC = null;
        this.isDialogOpen = false;
        
        document.getElementById('dialogBox').classList.remove('show');
    }
};
