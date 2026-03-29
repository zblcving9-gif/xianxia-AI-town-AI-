/**
 * 天气系统模块 - 二级节点
 * 管理游戏中的天气变化和效果
 */

const WeatherSystem = {
    type: 'clear', // clear, rain, snow, fog, storm
    intensity: 0,
    temperature: 25,
    windDirection: 0,
    windStrength: 0,
    
    weatherTimer: 0,
    weatherDuration: 120, // 秒
    
    weatherName: '晴朗',
    weatherIcon: '☀️',
    
    // 天气对游戏的影响
    effects: {
        cultivation: 1,
        stamina: 1,
        health: 0,
        visibility: 1
    },
    
    init() {
        this.changeWeather();
    },
    
    update(dt) {
        this.weatherTimer -= dt;
        
        if (this.weatherTimer <= 0) {
            this.changeWeather();
        }
        
        // 应用天气效果
        this.applyWeatherEffects(dt);
    },
    
    changeWeather() {
        const weathers = [
            { type: 'clear', name: '晴朗', icon: '☀️', intensity: 0, temp: 25, 
              effects: { cultivation: 1, stamina: 1, health: 0, visibility: 1 } },
            { type: 'cloudy', name: '多云', icon: '☁️', intensity: 0.3, temp: 22,
              effects: { cultivation: 1.1, stamina: 0.95, health: 0, visibility: 0.9 } },
            { type: 'rain', name: '小雨', icon: '🌧️', intensity: 0.5, temp: 18,
              effects: { cultivation: 1.2, stamina: 0.85, health: -0.5, visibility: 0.7 } },
            { type: 'rain', name: '大雨', icon: '🌧️', intensity: 1, temp: 15,
              effects: { cultivation: 1.3, stamina: 0.7, health: -1, visibility: 0.5 } },
            { type: 'snow', name: '小雪', icon: '🌨️', intensity: 0.3, temp: -2,
              effects: { cultivation: 1.5, stamina: 0.8, health: -0.3, visibility: 0.8 } },
            { type: 'snow', name: '大雪', icon: '🌨️', intensity: 0.8, temp: -8,
              effects: { cultivation: 2, stamina: 0.6, health: -1.5, visibility: 0.4 } },
            { type: 'fog', name: '浓雾', icon: '🌫️', intensity: 0.7, temp: 12,
              effects: { cultivation: 0.8, stamina: 0.9, health: 0, visibility: 0.3 } },
            { type: 'storm', name: '雷暴', icon: '⛈️', intensity: 1, temp: 20,
              effects: { cultivation: 3, stamina: 0.5, health: -2, visibility: 0.3 } }
        ];
        
        // 随机选择天气，但倾向于合理过渡
        const roll = Math.random();
        let weather;
        
        if (roll < 0.4) {
            // 40% 晴朗
            weather = weathers[0];
        } else if (roll < 0.6) {
            // 20% 多云
            weather = weathers[1];
        } else if (roll < 0.75) {
            // 15% 雨
            weather = weathers[2 + Math.floor(Math.random() * 2)];
        } else if (roll < 0.85) {
            // 10% 雪
            weather = weathers[4 + Math.floor(Math.random() * 2)];
        } else if (roll < 0.95) {
            // 10% 雾
            weather = weathers[6];
        } else {
            // 5% 雷暴
            weather = weathers[7];
        }
        
        this.type = weather.type;
        this.weatherName = weather.name;
        this.weatherIcon = weather.icon;
        this.intensity = weather.intensity;
        this.temperature = weather.temp;
        this.effects = weather.effects;
        
        // 设置下一次天气变化时间
        this.weatherDuration = 60 + Math.random() * 180;
        this.weatherTimer = this.weatherDuration;
        
        // 风向
        this.windDirection = Math.random() * Math.PI * 2;
        this.windStrength = weather.type === 'storm' ? 20 : (Math.random() * 5);
        
        Game.showMessage(`天气变化: ${weather.name} ${weather.icon}`);
    },
    
    applyWeatherEffects(dt) {
        const player = GameState.player;
        
        // 修炼加成
        if (this.effects.cultivation !== 1) {
            player.cultivationSpeed = this.effects.cultivation;
        }
        
        // 体力消耗
        if (this.effects.stamina < 1 && player.velocityX !== 0) {
            player.stamina -= (1 - this.effects.stamina) * dt;
        }
        
        // 健康影响
        if (this.effects.health < 0) {
            // 只有在免疫力低或没有保护时才会受伤
            if (player.immunity < 50) {
                player.health += this.effects.health * dt * (1 - player.immunity / 100);
            }
        }
        
        // 温度影响
        if (this.temperature < 0) {
            // 寒冷
            player.immunity = Math.max(0, player.immunity - dt * 0.5);
        } else if (this.temperature > 30) {
            // 炎热
            player.stamina = Math.max(0, player.stamina - dt * 0.3);
        }
        
        // 雷暴特殊效果
        if (this.type === 'storm' && Math.random() < 0.001) {
            this.lightningStrike();
        }
    },
    
    lightningStrike() {
        // 随机位置闪电
        const x = Math.random() * 3000;
        const y = Math.random() * 2000;
        
        // 检查是否击中玩家
        const player = GameState.player;
        const dist = Math.hypot(x - player.x, y - player.y);
        
        if (dist < 50) {
            player.health -= 20;
            Game.showMessage('被闪电击中了！', 'danger');
            GameState.addParticle(player.x, player.y, '#ffff00', 30);
        } else if (dist < 200) {
            Game.showMessage('闪电就在附近！');
        }
        
        // 视觉效果
        GameState.addParticle(x, y, '#ffffff', 20);
    },
    
    // 获取可见度（影响视野范围）
    getVisibility() {
        return this.effects.visibility;
    },
    
    // 获取修炼加成
    getCultivationBonus() {
        return this.effects.cultivation;
    },
    
    // 检查是否是火源友好的天气
    isFireFriendly() {
        return this.type !== 'rain' && this.type !== 'storm';
    },
    
    // 获取天气对灵力的影响
    getSpiritualBonus() {
        const bonuses = {
            clear: 1,
            cloudy: 1.1,
            rain: 1.2,
            snow: 1.5,
            fog: 0.8,
            storm: 2
        };
        return bonuses[this.type] || 1;
    }
};
