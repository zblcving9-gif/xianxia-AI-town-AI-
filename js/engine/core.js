/**
 * 核心物理引擎模块 - 二级节点
 * 封装 Matter.js 物理引擎，提供游戏物理功能
 * 依赖: physics.js (三级节点)
 */

// 物理引擎封装
const Core = {
    engine: null,
    world: null,
    runner: null,
    
    init(canvas) {
        // 创建物理引擎
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.runner = Matter.Runner.create();
        
        // 禁用重力（俯视角游戏）
        this.engine.world.gravity.y = 0;
        this.engine.world.gravity.x = 0;
        
        // 创建物理边界
        this.createBoundaries(canvas.width, canvas.height);
        
        // 启动物理引擎
        Matter.Runner.run(this.runner, this.engine);
        
        // 加载物理工具
        Physics.init(this.engine, this.world);
    },
    
    createBoundaries(width, height) {
        // 创建世界边界（更大的游戏世界）
        const worldWidth = 3000;
        const worldHeight = 2000;
        const wallCollision = { collisionFilter: { category: 0x0002, mask: 0x0001 } };
        
        const walls = [
            // 边界墙
            Matter.Bodies.rectangle(worldWidth / 2, -25, worldWidth, 50, { 
                isStatic: true, label: 'wall_top',
                render: { fillStyle: '#1a1a3a' }, ...wallCollision
            }),
            Matter.Bodies.rectangle(worldWidth / 2, worldHeight + 25, worldWidth, 50, { 
                isStatic: true, label: 'wall_bottom',
                render: { fillStyle: '#1a1a3a' }, ...wallCollision
            }),
            Matter.Bodies.rectangle(-25, worldHeight / 2, 50, worldHeight, { 
                isStatic: true, label: 'wall_left',
                render: { fillStyle: '#1a1a3a' }, ...wallCollision
            }),
            Matter.Bodies.rectangle(worldWidth + 25, worldHeight / 2, 50, worldHeight, { 
                isStatic: true, label: 'wall_right',
                render: { fillStyle: '#1a1a3a' }, ...wallCollision
            })
        ];
        
        Matter.World.add(this.world, walls);
    },
    
    update(dt) {
        Matter.Engine.update(this.engine, dt * 1000);
    },
    
    addBody(body) {
        Matter.World.add(this.world, body);
    },
    
    removeBody(body) {
        Matter.World.remove(this.world, body);
    },
    
    // 创建圆形物体
    createCircle(x, y, radius, options = {}) {
        const body = Matter.Bodies.circle(x, y, radius, {
            friction: options.friction || 0.3,
            restitution: options.restitution || 0.2,
            ...options
        });
        return body;
    },
    
    // 创建矩形物体
    createRectangle(x, y, width, height, options = {}) {
        const body = Matter.Bodies.rectangle(x, y, width, height, {
            friction: options.friction || 0.5,
            restitution: options.restitution || 0.1,
            ...options
        });
        return body;
    },
    
    // 创建静态平台
    createStatic(x, y, width, height, label = 'platform', extraOptions = {}) {
        return Matter.Bodies.rectangle(x, y, width, height, {
            isStatic: true,
            label: label,
            render: { fillStyle: '#3a3a5a' },
            ...extraOptions
        });
    },
    
    // 创建静态圆形（用于资源节点碰撞体）
    createStaticCircle(x, y, radius, label = 'resource', extraOptions = {}) {
        return Matter.Bodies.circle(x, y, radius, {
            isStatic: true,
            label: label,
            render: { visible: false },
            ...extraOptions
        });
    },
    
    // 施加力
    applyForce(body, force) {
        Matter.Body.applyForce(body, body.position, force);
    },
    
    // 设置速度
    setVelocity(body, velocity) {
        Matter.Body.setVelocity(body, velocity);
    },
    
    // 设置位置
    setPosition(body, position) {
        Matter.Body.setPosition(body, position);
    },
    
    // 检测碰撞
    checkCollision(bodyA, bodyB) {
        return Matter.SAT.collides(bodyA, bodyB);
    },
    
    // 获取碰撞对
    getCollisions() {
        return Matter.Pairs.allPairs(this.engine.pairs);
    },
    
    // 查询区域内的物体
    queryRegion(x, y, width, height) {
        return Matter.Query.region(Matter.Composite.allBodies(this.world), {
            min: { x: x - width/2, y: y - height/2 },
            max: { x: x + width/2, y: y + height/2 }
        });
    },
    
    // 射线检测
    raycast(start, end) {
        return Matter.Query.ray(
            Matter.Composite.allBodies(this.world),
            start,
            end
        );
    }
};

// 物理工具类（内联，因为无法引用三级节点）
const Physics = {
    engine: null,
    world: null,
    
    init(engine, world) {
        this.engine = engine;
        this.world = world;
    },
    
    // 计算两点间距离
    distance(a, b) {
        return Math.hypot(b.x - a.x, b.y - a.y);
    },
    
    // 计算角度
    angle(from, to) {
        return Math.atan2(to.y - from.y, to.x - from.x);
    },
    
    // 标准化向量
    normalize(vector) {
        const length = Math.hypot(vector.x, vector.y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: vector.x / length, y: vector.y / length };
    },
    
    // 移动向目标
    moveToward(body, target, speed) {
        const direction = this.normalize({
            x: target.x - body.position.x,
            y: target.y - body.position.y
        });
        Core.setVelocity(body, {
            x: direction.x * speed,
            y: direction.y * speed
        });
    },
    
    // 跳跃
    jump(body, force) {
        const currentVel = body.velocity;
        if (Math.abs(currentVel.y) < 1) {
            Core.setVelocity(body, {
                x: currentVel.x,
                y: -force
            });
        }
    },
    
    // 击退
    knockback(body, source, force) {
        const angle = this.angle(source, body.position);
        Core.applyForce(body, {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force
        });
    },
    
    // 圆形范围内的物体
    bodiesInCircle(x, y, radius) {
        const bodies = Matter.Composite.allBodies(this.world);
        return bodies.filter(b => {
            const dist = this.distance(b.position, { x, y });
            return dist < radius;
        });
    },
    
    // 创建力场
    createForceField(x, y, radius, strength, duration) {
        return {
            x, y, radius, strength, duration,
            apply(bodies) {
                bodies.forEach(body => {
                    const dist = Physics.distance({ x, y }, body.position);
                    if (dist < radius && dist > 0) {
                        const factor = (1 - dist / radius) * strength;
                        const angle = Physics.angle({ x, y }, body.position);
                        Core.applyForce(body, {
                            x: Math.cos(angle) * factor,
                            y: Math.sin(angle) * factor
                        });
                    }
                });
            }
        };
    },
    
    // 爆炸效果
    explode(x, y, radius, force) {
        const bodies = this.bodiesInCircle(x, y, radius);
        bodies.forEach(body => {
            if (!body.isStatic) {
                this.knockback(body, { x, y }, force);
            }
        });
    }
};
