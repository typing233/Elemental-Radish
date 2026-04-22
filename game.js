// 游戏状态管理
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// 元素类型
const ElementType = {
    FIRE: 'fire',
    ICE: 'ice',
    THUNDER: 'thunder'
};

// 元素反应类型
const ElementReaction = {
    EVAPORATE: 'evaporate', // 火+冰
    OVERLOAD: 'overload',    // 火+雷
    SUPERCONDUCT: 'superconduct', // 冰+雷
    NONE: 'none'
};

// 公主类型
const PrincessType = {
    SNOW: 'snow',
    CINDERELLA: 'cinderella',
    ARIEL: 'ariel'
};

// 游戏配置
const GameConfig = {
    TILE_SIZE: 40,
    GRID_WIDTH: 20,
    GRID_HEIGHT: 15,
    INITIAL_GOLD: 100,
    INITIAL_ENERGY: 0,
    MAX_ENERGY: 100,
    ENERGY_PER_KILL: 5,
    WAVE_DELAY: 3000,
    ENEMY_SPAWN_DELAY: 800
};

// 塔配置
const TowerConfig = {
    fire: {
        name: '火焰塔',
        cost: 50,
        upgradeCost: 100,
        damage: 25,
        range: 120,
        attackSpeed: 1000,
        element: ElementType.FIRE,
        color: '#ff6b6b',
        description: '高伤害，中等范围，攻击速度一般'
    },
    ice: {
        name: '冰霜塔',
        cost: 50,
        upgradeCost: 100,
        damage: 10,
        range: 180,
        attackSpeed: 800,
        element: ElementType.ICE,
        color: '#74b9ff',
        description: '低伤害，大范围，攻击速度快，有减速效果'
    },
    thunder: {
        name: '雷电塔',
        cost: 50,
        upgradeCost: 100,
        damage: 18,
        range: 100,
        attackSpeed: 1200,
        element: ElementType.THUNDER,
        color: '#fdcb6e',
        description: '中等伤害，小范围，攻击速度慢，有连锁效果'
    }
};

// 敌人配置
const EnemyConfig = {
    basic: {
        name: '基本敌人',
        health: 100,
        speed: 1,
        reward: 10,
        color: '#e17055'
    },
    fast: {
        name: '快速敌人',
        health: 60,
        speed: 2,
        reward: 15,
        color: '#fd79a8'
    },
    tank: {
        name: '坦克敌人',
        health: 300,
        speed: 0.5,
        reward: 25,
        color: '#6c5ce7'
    },
    boss: {
        name: 'Boss敌人',
        health: 1000,
        speed: 0.3,
        reward: 100,
        color: '#d63031'
    }
};

// 公主配置
const PrincessConfig = {
    snow: {
        name: '白雪公主',
        ability: '冰霜新星',
        description: '冻结所有敌人并造成伤害',
        color: '#74b9ff',
        ultimate: function(game) {
            const damage = 50 + game.towers.filter(t => t.element === ElementType.ICE).length * 10;
            game.enemies.forEach(enemy => {
                enemy.takeDamage(damage);
                enemy.freeze(3000);
            });
            game.showEffect('冰霜新星！', '#74b9ff');
        }
    },
    cinderella: {
        name: '灰姑娘',
        ability: '南瓜马车',
        description: '召唤马车撞击敌人',
        color: '#fdcb6e',
        ultimate: function(game) {
            const damage = 80 + game.towers.filter(t => t.element === ElementType.FIRE).length * 15;
            game.enemies.forEach(enemy => {
                enemy.takeDamage(damage);
                enemy.knockback(100);
            });
            game.showEffect('南瓜马车！', '#fdcb6e');
        }
    },
    ariel: {
        name: '小美人鱼',
        ability: '潮汐之力',
        description: '击退敌人并减速',
        color: '#00b894',
        ultimate: function(game) {
            const damage = 40 + game.towers.filter(t => t.element === ElementType.THUNDER).length * 8;
            const slowDuration = 5000 + game.towers.filter(t => t.element === ElementType.THUNDER).length * 500;
            game.enemies.forEach(enemy => {
                enemy.takeDamage(damage);
                enemy.slow(0.3, slowDuration);
                enemy.knockback(80);
            });
            game.showEffect('潮汐之力！', '#00b894');
        }
    }
};

// 游戏类
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GameState.MENU;
        
        // 游戏数据
        this.gold = GameConfig.INITIAL_GOLD;
        this.energy = GameConfig.INITIAL_ENERGY;
        this.wave = 1;
        this.kills = 0;
        this.totalGoldEarned = 0;
        this.selectedPrincess = PrincessType.SNOW;
        this.selectedTowerType = null;
        this.selectedTower = null;
        
        // 游戏对象
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.obstacles = [];
        
        // 路径
        this.path = [];
        this.grid = [];
        
        // 公主实体
        this.princess = null;
        
        // 波次管理
        this.waveInProgress = false;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        
        // 动画帧
        this.lastTime = 0;
        
        // 弹窗相关
        this.popupGridX = -1;
        this.popupGridY = -1;
        
        // 初始化
        this.initCanvas();
        this.initGrid();
        this.initPath();
        this.initEventListeners();
    }
    
    // 初始化画布
    initCanvas() {
        this.canvas.width = GameConfig.GRID_WIDTH * GameConfig.TILE_SIZE;
        this.canvas.height = GameConfig.GRID_HEIGHT * GameConfig.TILE_SIZE;
    }
    
    // 初始化网格
    initGrid() {
        this.grid = [];
        for (let y = 0; y < GameConfig.GRID_HEIGHT; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GameConfig.GRID_WIDTH; x++) {
                this.grid[y][x] = {
                    type: 'empty',
                    tower: null,
                    obstacle: null
                };
            }
        }
    }
    
    // 初始化路径
    initPath() {
        // 创建一个蜿蜒的路径
        this.path = [];
        
        // 从左侧中间进入
        const startY = Math.floor(GameConfig.GRID_HEIGHT / 2);
        
        // 向右走
        for (let x = 0; x <= 5; x++) {
            this.path.push({ x: x, y: startY });
            this.grid[startY][x].type = 'path';
        }
        
        // 向上走
        for (let y = startY - 1; y >= 3; y--) {
            this.path.push({ x: 5, y: y });
            this.grid[y][5].type = 'path';
        }
        
        // 向右走
        for (let x = 6; x <= 12; x++) {
            this.path.push({ x: x, y: 3 });
            this.grid[3][x].type = 'path';
        }
        
        // 向下走
        for (let y = 4; y <= 11; y++) {
            this.path.push({ x: 12, y: y });
            this.grid[y][12].type = 'path';
        }
        
        // 向右走
        for (let x = 13; x <= GameConfig.GRID_WIDTH - 1; x++) {
            this.path.push({ x: x, y: 11 });
            this.grid[11][x].type = 'path';
        }
        
        // 初始化公主位置（在路径终点）
        if (this.path.length > 0) {
            const endPoint = this.path[this.path.length - 1];
            this.princess = {
                gridX: endPoint.x,
                gridY: endPoint.y,
                x: endPoint.x * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2,
                y: endPoint.y * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2,
                type: this.selectedPrincess
            };
        }
        
        // 添加一些障碍物
        this.addObstacles();
    }
    
    // 添加障碍物
    addObstacles() {
        const obstaclePositions = [
            { x: 2, y: 2 }, { x: 8, y: 2 }, { x: 15, y: 2 },
            { x: 2, y: 13 }, { x: 8, y: 13 }, { x: 15, y: 13 },
            { x: 3, y: 8 }, { x: 10, y: 6 }, { x: 16, y: 8 }
        ];
        
        obstaclePositions.forEach(pos => {
            if (this.grid[pos.y] && this.grid[pos.y][pos.x] && 
                this.grid[pos.y][pos.x].type === 'empty') {
                const obstacle = {
                    x: pos.x,
                    y: pos.y,
                    health: 50,
                    maxHealth: 50,
                    goldReward: 20,
                    energyReward: 10
                };
                this.obstacles.push(obstacle);
                this.grid[pos.y][pos.x].type = 'obstacle';
                this.grid[pos.y][pos.x].obstacle = obstacle;
            }
        });
    }
    
    // 初始化事件监听器
    initEventListeners() {
        // 开始界面
        document.querySelectorAll('.princess-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.princess-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedPrincess = option.dataset.princess;
            });
        });
        
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('load-button').addEventListener('click', () => {
            this.loadGame();
        });
        
        // 游戏界面
        document.querySelectorAll('.tower-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.tower-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedTowerType = option.dataset.tower;
                this.selectedTower = null;
                this.updateTowerInfo();
            });
        });
        
        document.getElementById('ultimate-button').addEventListener('click', () => {
            this.useUltimate();
        });
        
        document.getElementById('save-button').addEventListener('click', () => {
            this.saveGame();
        });
        
        document.getElementById('menu-button').addEventListener('click', () => {
            this.goToMenu();
        });
        
        document.getElementById('upgrade-button').addEventListener('click', () => {
            this.upgradeTower();
        });
        
        document.getElementById('sell-button').addEventListener('click', () => {
            this.sellTower();
        });
        
        // 画布点击
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // 游戏结束界面
        document.getElementById('restart-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('back-menu-button').addEventListener('click', () => {
            this.goToMenu();
        });
        
        // 塔选择弹窗
        document.querySelectorAll('.popup-tower-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const towerType = option.dataset.tower;
                this.buildTowerFromPopup(towerType);
            });
        });
        
        document.getElementById('cancel-tower-select').addEventListener('click', () => {
            this.hideTowerSelectPopup();
        });
        
        // 游戏失败弹窗
        document.getElementById('popup-restart-button').addEventListener('click', () => {
            this.hideGameOverPopup();
            this.startGame();
        });
        
        document.getElementById('popup-menu-button').addEventListener('click', () => {
            this.hideGameOverPopup();
            this.goToMenu();
        });
        
        // 公主信息弹窗
        document.getElementById('close-princess-popup').addEventListener('click', () => {
            this.hidePrincessInfoPopup();
        });
    }
    
    // 开始游戏
    startGame() {
        this.state = GameState.PLAYING;
        this.gold = GameConfig.INITIAL_GOLD;
        this.energy = GameConfig.INITIAL_ENERGY;
        this.wave = 1;
        this.kills = 0;
        this.totalGoldEarned = 0;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.waveInProgress = false;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        
        // 重置网格和路径
        this.initGrid();
        this.initPath();
        
        // 更新UI
        this.updateUI();
        this.showScreen('game-screen');
        
        // 开始游戏循环
        this.lastTime = performance.now();
        this.gameLoop();
        
        // 开始第一波
        setTimeout(() => this.startWave(), 2000);
    }
    
    // 加载游戏
    loadGame() {
        const saveData = localStorage.getItem('towerDefenseSave');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.selectedPrincess = data.princess || PrincessType.SNOW;
                this.gold = data.gold || GameConfig.INITIAL_GOLD;
                this.energy = data.energy || GameConfig.INITIAL_ENERGY;
                this.wave = data.wave || 1;
                this.kills = data.kills || 0;
                this.totalGoldEarned = data.totalGoldEarned || 0;
                
                // 更新UI
                this.updateUI();
                
                // 选择对应的公主选项
                document.querySelectorAll('.princess-option').forEach(option => {
                    option.classList.remove('selected');
                    if (option.dataset.princess === this.selectedPrincess) {
                        option.classList.add('selected');
                    }
                });
                
                this.state = GameState.PLAYING;
                this.showScreen('game-screen');
                
                // 开始游戏循环
                this.lastTime = performance.now();
                this.gameLoop();
                
                // 加载塔
                if (data.towers) {
                    data.towers.forEach(towerData => {
                        const tower = new Tower(
                            towerData.x,
                            towerData.y,
                            towerData.type,
                            this
                        );
                        tower.level = towerData.level || 1;
                        tower.totalDamage = towerData.damage;
                        tower.totalRange = towerData.range;
                        tower.totalAttackSpeed = towerData.attackSpeed;
                        this.towers.push(tower);
                        this.grid[towerData.y][towerData.x].tower = tower;
                        this.grid[towerData.y][towerData.x].type = 'tower';
                    });
                }
                
                // 如果有波次进行中，开始下一波
                if (!this.waveInProgress) {
                    setTimeout(() => this.startWave(), 2000);
                }
                
                alert('游戏存档加载成功！');
            } catch (e) {
                alert('存档加载失败，开始新游戏');
                this.startGame();
            }
        } else {
            alert('没有找到存档，开始新游戏');
            this.startGame();
        }
    }
    
    // 保存游戏
    saveGame() {
        const saveData = {
            princess: this.selectedPrincess,
            gold: this.gold,
            energy: this.energy,
            wave: this.wave,
            kills: this.kills,
            totalGoldEarned: this.totalGoldEarned,
            towers: this.towers.map(tower => ({
                x: tower.gridX,
                y: tower.gridY,
                type: tower.type,
                level: tower.level,
                damage: tower.totalDamage,
                range: tower.totalRange,
                attackSpeed: tower.totalAttackSpeed
            }))
        };
        
        localStorage.setItem('towerDefenseSave', JSON.stringify(saveData));
        alert('游戏已保存！');
    }
    
    // 回到菜单
    goToMenu() {
        this.state = GameState.MENU;
        this.showScreen('start-screen');
    }
    
    // 显示屏幕
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }
    
    // 处理画布点击
    handleCanvasClick(e) {
        if (this.state !== GameState.PLAYING) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const gridX = Math.floor(x / GameConfig.TILE_SIZE);
        const gridY = Math.floor(y / GameConfig.TILE_SIZE);
        
        if (gridX < 0 || gridX >= GameConfig.GRID_WIDTH || gridY < 0 || gridY >= GameConfig.GRID_HEIGHT) return;
        
        const cell = this.grid[gridY][gridX];
        
        // 如果点击的是公主，显示公主信息
        if (this.princess && gridX === this.princess.gridX && gridY === this.princess.gridY) {
            this.showPrincessInfoPopup();
            return;
        }
        
        // 如果点击的是障碍物，可以尝试清除
        if (cell.type === 'obstacle' && cell.obstacle) {
            // 检查是否有塔在范围内可以攻击障碍物
            const obstacle = cell.obstacle;
            const damage = 20; // 点击造成的伤害
            
            obstacle.health -= damage;
            this.showDamageEffect(
                gridX * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2,
                gridY * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2,
                damage
            );
            
            if (obstacle.health <= 0) {
                // 清除障碍物
                this.obstacles = this.obstacles.filter(o => o !== obstacle);
                cell.type = 'empty';
                cell.obstacle = null;
                
                // 奖励
                this.gold += obstacle.goldReward;
                this.energy = Math.min(GameConfig.MAX_ENERGY, this.energy + obstacle.energyReward);
                this.totalGoldEarned += obstacle.goldReward;
                
                this.showEffect(`清除障碍物！+${obstacle.goldReward}金币 +${obstacle.energyReward}能量`, '#f7dc6f');
                this.updateUI();
            }
            return;
        }
        
        // 如果点击的是已有的塔，选中它
        if (cell.type === 'tower' && cell.tower) {
            this.selectedTower = cell.tower;
            this.selectedTowerType = null;
            document.querySelectorAll('.tower-option').forEach(opt => opt.classList.remove('selected'));
            this.updateTowerInfo();
            return;
        }
        
        // 如果点击的是空白格子，显示塔选择弹窗
        if (cell.type === 'empty') {
            this.showTowerSelectPopup(gridX, gridY, e.clientX, e.clientY);
            return;
        }
        
        // 其他情况，取消选中
        this.selectedTower = null;
        this.selectedTowerType = null;
        document.querySelectorAll('.tower-option').forEach(opt => opt.classList.remove('selected'));
        this.updateTowerInfo();
    }
    
    // 建造塔
    buildTower(gridX, gridY, type) {
        const config = TowerConfig[type];
        if (this.gold < config.cost) {
            this.showEffect('金币不足！', '#ff6b6b');
            return;
        }
        
        const tower = new Tower(gridX, gridY, type, this);
        this.towers.push(tower);
        this.grid[gridY][gridX].tower = tower;
        this.grid[gridY][gridX].type = 'tower';
        
        this.gold -= config.cost;
        this.showEffect(`建造${config.name}成功！`, config.color);
        this.updateUI();
    }
    
    // 从弹窗建造塔
    buildTowerFromPopup(type) {
        if (this.popupGridX < 0 || this.popupGridY < 0) return;
        
        this.buildTower(this.popupGridX, this.popupGridY, type);
        this.hideTowerSelectPopup();
    }
    
    // 显示塔选择弹窗
    showTowerSelectPopup(gridX, gridY, screenX, screenY) {
        this.popupGridX = gridX;
        this.popupGridY = gridY;
        
        const popup = document.getElementById('tower-select-popup');
        popup.classList.remove('hidden');
        
        // 计算弹窗位置
        const gameBoard = document.getElementById('game-board');
        const boardRect = gameBoard.getBoundingClientRect();
        
        // 相对于game-board定位
        const relativeX = screenX - boardRect.left;
        const relativeY = screenY - boardRect.top;
        
        popup.style.left = `${relativeX}px`;
        popup.style.top = `${relativeY}px`;
    }
    
    // 隐藏塔选择弹窗
    hideTowerSelectPopup() {
        const popup = document.getElementById('tower-select-popup');
        popup.classList.add('hidden');
        this.popupGridX = -1;
        this.popupGridY = -1;
    }
    
    // 显示游戏失败弹窗
    showGameOverPopup() {
        document.getElementById('popup-final-wave').textContent = this.wave;
        document.getElementById('popup-final-kills').textContent = this.kills;
        
        const popup = document.getElementById('game-over-popup');
        popup.classList.remove('hidden');
    }
    
    // 隐藏游戏失败弹窗
    hideGameOverPopup() {
        const popup = document.getElementById('game-over-popup');
        popup.classList.add('hidden');
    }
    
    // 显示公主信息弹窗
    showPrincessInfoPopup() {
        const princessConfig = PrincessConfig[this.selectedPrincess];
        
        document.getElementById('popup-princess-name').textContent = princessConfig.name;
        document.getElementById('popup-ability-name').textContent = princessConfig.ability;
        document.getElementById('popup-ability-desc').textContent = princessConfig.description;
        document.getElementById('popup-tower-count').textContent = this.towers.length;
        
        // 设置公主图标
        let icon = '❄️';
        if (this.selectedPrincess === PrincessType.CINDERELLA) icon = '✨';
        else if (this.selectedPrincess === PrincessType.ARIEL) icon = '🧜‍♀️';
        document.getElementById('popup-princess-icon').textContent = icon;
        
        const popup = document.getElementById('princess-info-popup');
        popup.classList.remove('hidden');
    }
    
    // 隐藏公主信息弹窗
    hidePrincessInfoPopup() {
        const popup = document.getElementById('princess-info-popup');
        popup.classList.add('hidden');
    }
    
    // 升级塔
    upgradeTower() {
        if (!this.selectedTower) return;
        
        const config = TowerConfig[this.selectedTower.type];
        const upgradeCost = config.upgradeCost * this.selectedTower.level;
        
        if (this.gold < upgradeCost) {
            this.showEffect('金币不足！', '#ff6b6b');
            return;
        }
        
        if (this.selectedTower.level >= 3) {
            this.showEffect('塔已达到最高等级！', '#fdcb6e');
            return;
        }
        
        this.gold -= upgradeCost;
        this.selectedTower.upgrade();
        this.showEffect(`${TowerConfig[this.selectedTower.type].name}升级到${this.selectedTower.level}级！`, config.color);
        this.updateUI();
        this.updateTowerInfo();
    }
    
    // 出售塔
    sellTower() {
        if (!this.selectedTower) return;
        
        const config = TowerConfig[this.selectedTower.type];
        const sellValue = Math.floor((config.cost + config.upgradeCost * (this.selectedTower.level - 1)) * 0.5);
        
        this.gold += sellValue;
        this.totalGoldEarned += sellValue;
        
        // 从网格和塔列表中移除
        const gridX = this.selectedTower.gridX;
        const gridY = this.selectedTower.gridY;
        this.grid[gridY][gridX].tower = null;
        this.grid[gridY][gridX].type = 'empty';
        this.towers = this.towers.filter(t => t !== this.selectedTower);
        
        this.selectedTower = null;
        this.showEffect(`出售塔获得${sellValue}金币！`, '#f7dc6f');
        this.updateUI();
        this.updateTowerInfo();
    }
    
    // 使用大招
    useUltimate() {
        if (this.energy < GameConfig.MAX_ENERGY) return;
        
        const princessConfig = PrincessConfig[this.selectedPrincess];
        princessConfig.ultimate(this);
        
        this.energy = 0;
        this.updateUI();
    }
    
    // 更新塔信息
    updateTowerInfo() {
        const infoPanel = document.getElementById('selected-tower-info');
        const detailsDiv = document.getElementById('selected-tower-details');
        const upgradeButton = document.getElementById('upgrade-button');
        const sellButton = document.getElementById('sell-button');
        
        if (this.selectedTower) {
            const config = TowerConfig[this.selectedTower.type];
            const upgradeCost = config.upgradeCost * this.selectedTower.level;
            const sellValue = Math.floor((config.cost + config.upgradeCost * (this.selectedTower.level - 1)) * 0.5);
            
            infoPanel.classList.remove('hidden');
            detailsDiv.innerHTML = `
                <div><strong>${config.name}</strong> (等级 ${this.selectedTower.level})</div>
                <div>伤害: ${this.selectedTower.totalDamage}</div>
                <div>范围: ${this.selectedTower.totalRange}</div>
                <div>攻击速度: ${(1000 / this.selectedTower.totalAttackSpeed).toFixed(1)}/秒</div>
            `;
            
            upgradeButton.textContent = this.selectedTower.level >= 3 ? '已达最高级' : `升级 (💰 ${upgradeCost})`;
            upgradeButton.disabled = this.selectedTower.level >= 3;
            sellButton.textContent = `出售 (💰 ${sellValue})`;
        } else {
            infoPanel.classList.add('hidden');
        }
    }
    
    // 更新UI
    updateUI() {
        document.getElementById('gold').textContent = this.gold;
        document.getElementById('energy-fill').style.width = `${(this.energy / GameConfig.MAX_ENERGY) * 100}%`;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('princess-name').textContent = PrincessConfig[this.selectedPrincess].name;
        
        // 更新大招按钮状态
        const ultimateButton = document.getElementById('ultimate-button');
        if (this.energy >= GameConfig.MAX_ENERGY) {
            ultimateButton.classList.remove('disabled');
            ultimateButton.disabled = false;
        } else {
            ultimateButton.classList.add('disabled');
            ultimateButton.disabled = true;
        }
    }
    
    // 开始波次
    startWave() {
        if (this.state !== GameState.PLAYING) return;
        
        this.waveInProgress = true;
        this.showEffect(`第 ${this.wave} 波开始！`, '#f7dc6f');
        
        // 生成敌人列表
        this.enemiesToSpawn = this.generateWaveEnemies(this.wave);
        this.spawnTimer = 0;
    }
    
    // 生成波次敌人
    generateWaveEnemies(wave) {
        const enemies = [];
        
        // 基础敌人数量
        const basicCount = 5 + wave * 2;
        
        // 快速敌人数量
        const fastCount = Math.floor(wave * 1.5);
        
        // 坦克敌人数量（从第3波开始）
        const tankCount = wave >= 3 ? Math.floor(wave / 2) : 0;
        
        // Boss（每5波一个）
        const bossCount = wave % 5 === 0 ? 1 : 0;
        
        // 添加敌人
        for (let i = 0; i < basicCount; i++) {
            enemies.push('basic');
        }
        
        for (let i = 0; i < fastCount; i++) {
            enemies.push('fast');
        }
        
        for (let i = 0; i < tankCount; i++) {
            enemies.push('tank');
        }
        
        for (let i = 0; i < bossCount; i++) {
            enemies.push('boss');
        }
        
        // 打乱顺序
        for (let i = enemies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [enemies[i], enemies[j]] = [enemies[j], enemies[i]];
        }
        
        return enemies;
    }
    
    // 生成敌人
    spawnEnemy(type) {
        const config = EnemyConfig[type];
        const startPoint = this.path[0];
        
        const enemy = new Enemy(
            startPoint.x * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2,
            startPoint.y * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2,
            type,
            this
        );
        
        this.enemies.push(enemy);
    }
    
    // 游戏结束
    gameOver(won) {
        this.state = GameState.GAME_OVER;
        
        if (!won) {
            // 游戏失败，显示弹窗
            this.showGameOverPopup();
        } else {
            // 游戏胜利，显示原来的界面
            document.getElementById('game-over-title').textContent = '恭喜胜利！';
            document.getElementById('game-over-message').textContent = '你成功守护了公主！继续挑战更高波次吧！';
            document.getElementById('final-wave').textContent = this.wave;
            document.getElementById('final-kills').textContent = this.kills;
            document.getElementById('final-gold').textContent = this.totalGoldEarned;
            
            this.showScreen('game-over-screen');
        }
    }
    
    // 显示效果
    showEffect(text, color) {
        this.effects.push({
            type: 'text',
            text: text,
            color: color,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            duration: 2000,
            startTime: performance.now()
        });
    }
    
    // 显示伤害效果
    showDamageEffect(x, y, damage) {
        this.effects.push({
            type: 'damage',
            text: `-${Math.round(damage)}`,
            color: '#ff6b6b',
            x: x,
            y: y,
            duration: 1000,
            startTime: performance.now()
        });
    }
    
    // 检查元素反应
    checkElementReaction(enemy) {
        // 检查敌人身上的元素状态
        const elements = enemy.activeElements;
        if (elements.length < 2) return;
        
        // 检查所有可能的元素组合
        for (let i = 0; i < elements.length - 1; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const elem1 = elements[i];
                const elem2 = elements[j];
                
                let reaction = ElementReaction.NONE;
                let damage = 0;
                let effect = null;
                
                // 火 + 冰 = 蒸发
                if ((elem1 === ElementType.FIRE && elem2 === ElementType.ICE) ||
                    (elem1 === ElementType.ICE && elem2 === ElementType.FIRE)) {
                    reaction = ElementReaction.EVAPORATE;
                    damage = 40;
                    effect = () => {
                        this.showEffect('蒸发！', '#74b9ff');
                    };
                }
                // 火 + 雷 = 超载
                else if ((elem1 === ElementType.FIRE && elem2 === ElementType.THUNDER) ||
                         (elem1 === ElementType.THUNDER && elem2 === ElementType.FIRE)) {
                    reaction = ElementReaction.OVERLOAD;
                    damage = 50;
                    effect = () => {
                        this.showEffect('超载！', '#fdcb6e');
                        // 范围伤害
                        this.enemies.forEach(e => {
                            if (e !== enemy && this.getDistance(enemy.x, enemy.y, e.x, e.y) < 100) {
                                e.takeDamage(damage * 0.5);
                            }
                        });
                    };
                }
                // 冰 + 雷 = 超导
                else if ((elem1 === ElementType.ICE && elem2 === ElementType.THUNDER) ||
                         (elem1 === ElementType.THUNDER && elem2 === ElementType.ICE)) {
                    reaction = ElementReaction.SUPERCONDUCT;
                    damage = 30;
                    effect = () => {
                        this.showEffect('超导！', '#a29bfe');
                        // 降低敌人防御
                        enemy.reduceDefense(0.3, 5000);
                    };
                }
                
                if (reaction !== ElementReaction.NONE) {
                    // 触发反应
                    enemy.takeDamage(damage);
                    if (effect) effect();
                    
                    // 清除已触发的元素
                    enemy.activeElements = enemy.activeElements.filter(e => e !== elem1 && e !== elem2);
                    return;
                }
            }
        }
    }
    
    // 计算两点距离
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    // 游戏主循环
    gameLoop(currentTime = performance.now()) {
        if (this.state !== GameState.PLAYING) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新游戏逻辑
        this.update(deltaTime);
        
        // 渲染
        this.render();
        
        // 继续循环
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // 更新游戏逻辑
    update(deltaTime) {
        // 生成敌人
        if (this.waveInProgress && this.enemiesToSpawn.length > 0) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= GameConfig.ENEMY_SPAWN_DELAY) {
                this.spawnEnemy(this.enemiesToSpawn.shift());
                this.spawnTimer = 0;
            }
        }
        
        // 检查波次是否结束
        if (this.waveInProgress && this.enemiesToSpawn.length === 0 && this.enemies.length === 0) {
            this.waveInProgress = false;
            this.wave++;
            this.showEffect(`第 ${this.wave - 1} 波完成！准备下一波...`, '#4ecdc4');
            
            // 波次奖励
            const waveBonus = 50 + (this.wave - 1) * 20;
            this.gold += waveBonus;
            this.totalGoldEarned += waveBonus;
            this.showEffect(`波次奖励：+${waveBonus}金币`, '#f7dc6f');
            this.updateUI();
            
            // 开始下一波
            setTimeout(() => this.startWave(), GameConfig.WAVE_DELAY);
        }
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });
        
        // 移除死亡的敌人
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.health <= 0) {
                // 奖励
                this.gold += enemy.reward;
                this.energy = Math.min(GameConfig.MAX_ENERGY, this.energy + GameConfig.ENERGY_PER_KILL);
                this.kills++;
                this.totalGoldEarned += enemy.reward;
                this.updateUI();
                return false;
            }
            return true;
        });
        
        // 更新塔
        this.towers.forEach(tower => {
            tower.update(deltaTime);
        });
        
        // 更新弹道
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
        });
        
        // 移除完成的弹道
        this.projectiles = this.projectiles.filter(projectile => {
            return !projectile.completed;
        });
        
        // 移除过期的效果
        const currentTime = performance.now();
        this.effects = this.effects.filter(effect => {
            return currentTime - effect.startTime < effect.duration;
        });
    }
    
    // 渲染
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.renderGrid();
        
        // 绘制路径
        this.renderPath();
        
        // 绘制障碍物
        this.renderObstacles();
        
        // 绘制塔
        this.renderTowers();
        
        // 绘制敌人
        this.renderEnemies();
        
        // 绘制公主
        this.renderPrincess();
        
        // 绘制弹道
        this.renderProjectiles();
        
        // 绘制效果
        this.renderEffects();
        
        // 绘制选中塔的范围
        if (this.selectedTower) {
            this.renderTowerRange(this.selectedTower);
        }
    }
    
    // 绘制公主
    renderPrincess() {
        if (!this.princess) return;
        
        const x = this.princess.x;
        const y = this.princess.y;
        
        // 绘制发光效果
        const princessConfig = PrincessConfig[this.selectedPrincess];
        const glowColor = princessConfig.color + '40';
        
        this.ctx.fillStyle = glowColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制公主背景
        this.ctx.fillStyle = princessConfig.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制公主图标
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let icon = '❄️';
        if (this.selectedPrincess === PrincessType.CINDERELLA) icon = '✨';
        else if (this.selectedPrincess === PrincessType.ARIEL) icon = '🧜‍♀️';
        
        this.ctx.fillText(icon, x, y);
        
        // 绘制提示文字
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#f7dc6f';
        this.ctx.fillText('点击查看', x, y + 28);
    }
    
    // 绘制网格
    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= GameConfig.GRID_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * GameConfig.TILE_SIZE, 0);
            this.ctx.lineTo(x * GameConfig.TILE_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= GameConfig.GRID_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * GameConfig.TILE_SIZE);
            this.ctx.lineTo(this.canvas.width, y * GameConfig.TILE_SIZE);
            this.ctx.stroke();
        }
    }
    
    // 绘制路径
    renderPath() {
        this.ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
        
        this.path.forEach(point => {
            this.ctx.fillRect(
                point.x * GameConfig.TILE_SIZE,
                point.y * GameConfig.TILE_SIZE,
                GameConfig.TILE_SIZE,
                GameConfig.TILE_SIZE
            );
        });
    }
    
    // 绘制障碍物
    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            const x = obstacle.x * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
            const y = obstacle.y * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
            
            // 绘制障碍物
            this.ctx.fillStyle = '#636e72';
            this.ctx.fillRect(
                obstacle.x * GameConfig.TILE_SIZE + 5,
                obstacle.y * GameConfig.TILE_SIZE + 5,
                GameConfig.TILE_SIZE - 10,
                GameConfig.TILE_SIZE - 10
            );
            
            // 绘制血条
            const healthPercent = obstacle.health / obstacle.maxHealth;
            this.ctx.fillStyle = '#2d3436';
            this.ctx.fillRect(
                obstacle.x * GameConfig.TILE_SIZE + 5,
                obstacle.y * GameConfig.TILE_SIZE - 8,
                GameConfig.TILE_SIZE - 10,
                5
            );
            
            this.ctx.fillStyle = healthPercent > 0.5 ? '#00b894' : healthPercent > 0.25 ? '#fdcb6e' : '#ff6b6b';
            this.ctx.fillRect(
                obstacle.x * GameConfig.TILE_SIZE + 5,
                obstacle.y * GameConfig.TILE_SIZE - 8,
                (GameConfig.TILE_SIZE - 10) * healthPercent,
                5
            );
        });
    }
    
    // 绘制塔
    renderTowers() {
        this.towers.forEach(tower => {
            tower.render(this.ctx);
        });
    }
    
    // 绘制塔范围
    renderTowerRange(tower) {
        this.ctx.strokeStyle = 'rgba(247, 220, 111, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y, tower.totalRange, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    // 绘制敌人
    renderEnemies() {
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx);
        });
    }
    
    // 绘制弹道
    renderProjectiles() {
        this.projectiles.forEach(projectile => {
            projectile.render(this.ctx);
        });
    }
    
    // 绘制效果
    renderEffects() {
        const currentTime = performance.now();
        
        this.effects.forEach(effect => {
            const elapsed = currentTime - effect.startTime;
            const progress = elapsed / effect.duration;
            
            if (effect.type === 'text') {
                // 屏幕中心效果
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = effect.color;
                this.ctx.globalAlpha = 1 - progress * 0.5;
                
                this.ctx.fillText(effect.text, effect.x, effect.y - progress * 50);
                this.ctx.globalAlpha = 1;
            } else if (effect.type === 'damage') {
                // 伤害数字效果
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = effect.color;
                this.ctx.globalAlpha = 1 - progress;
                
                this.ctx.fillText(effect.text, effect.x, effect.y - progress * 30);
                this.ctx.globalAlpha = 1;
            }
        });
    }
}

// 塔类
class Tower {
    constructor(gridX, gridY, type, game) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.x = gridX * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
        this.y = gridY * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
        this.type = type;
        this.game = game;
        
        // 塔属性
        const config = TowerConfig[type];
        this.level = 1;
        this.baseDamage = config.damage;
        this.baseRange = config.range;
        this.baseAttackSpeed = config.attackSpeed;
        this.element = config.element;
        this.color = config.color;
        
        this.totalDamage = this.baseDamage;
        this.totalRange = this.baseRange;
        this.totalAttackSpeed = this.baseAttackSpeed;
        
        this.attackTimer = 0;
        this.target = null;
    }
    
    // 升级
    upgrade() {
        this.level++;
        
        // 提升属性
        const damageMultiplier = 1 + (this.level - 1) * 0.5;
        const rangeMultiplier = 1 + (this.level - 1) * 0.2;
        const attackSpeedMultiplier = 1 + (this.level - 1) * 0.15;
        
        this.totalDamage = Math.floor(this.baseDamage * damageMultiplier);
        this.totalRange = Math.floor(this.baseRange * rangeMultiplier);
        this.totalAttackSpeed = Math.floor(this.baseAttackSpeed / attackSpeedMultiplier);
    }
    
    // 更新
    update(deltaTime) {
        this.attackTimer += deltaTime;
        
        // 寻找目标
        this.findTarget();
        
        // 攻击
        if (this.target && this.attackTimer >= this.totalAttackSpeed) {
            this.attack();
            this.attackTimer = 0;
        }
    }
    
    // 寻找目标
    findTarget() {
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        this.game.enemies.forEach(enemy => {
            const distance = this.game.getDistance(this.x, this.y, enemy.x, enemy.y);
            
            if (distance <= this.totalRange && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        this.target = closestEnemy;
    }
    
    // 攻击
    attack() {
        if (!this.target) return;
        
        // 创建弹道
        const projectile = new Projectile(
            this.x,
            this.y,
            this.target,
            this.totalDamage,
            this.element,
            this.color,
            this.game
        );
        
        this.game.projectiles.push(projectile);
        
        // 雷电塔有连锁效果
        if (this.element === ElementType.THUNDER) {
            this.chainLightning();
        }
    }
    
    // 连锁闪电
    chainLightning() {
        if (!this.target) return;
        
        const chainTargets = [];
        const maxChains = 2 + this.level;
        
        // 找到附近的其他敌人
        this.game.enemies.forEach(enemy => {
            if (enemy !== this.target) {
                const distance = this.game.getDistance(this.target.x, this.target.y, enemy.x, enemy.y);
                if (distance <= 100) {
                    chainTargets.push(enemy);
                }
            }
        });
        
        // 按距离排序
        chainTargets.sort((a, b) => {
            const distA = this.game.getDistance(this.target.x, this.target.y, a.x, a.y);
            const distB = this.game.getDistance(this.target.x, this.target.y, b.x, b.y);
            return distA - distB;
        });
        
        // 取前几个目标
        const targets = chainTargets.slice(0, maxChains);
        
        // 创建连锁弹道
        targets.forEach((target, index) => {
            setTimeout(() => {
                const chainDamage = this.totalDamage * (0.7 - index * 0.1);
                const projectile = new Projectile(
                    this.target.x,
                    this.target.y,
                    target,
                    chainDamage,
                    this.element,
                    this.color,
                    this.game
                );
                this.game.projectiles.push(projectile);
            }, index * 100);
        });
    }
    
    // 渲染
    render(ctx) {
        // 绘制塔基座
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(
            this.x - GameConfig.TILE_SIZE / 2 + 5,
            this.y - GameConfig.TILE_SIZE / 2 + 5,
            GameConfig.TILE_SIZE - 10,
            GameConfig.TILE_SIZE - 10
        );
        
        // 绘制塔主体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制元素图标
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '';
        if (this.element === ElementType.FIRE) icon = '🔥';
        else if (this.element === ElementType.ICE) icon = '❄️';
        else if (this.element === ElementType.THUNDER) icon = '⚡';
        
        ctx.fillText(icon, this.x, this.y);
        
        // 绘制等级
        if (this.level > 1) {
            ctx.fillStyle = '#f7dc6f';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(`Lv.${this.level}`, this.x, this.y + 18);
        }
    }
}

// 敌人类
class Enemy {
    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        
        // 敌人属性
        const config = EnemyConfig[type];
        this.maxHealth = config.health;
        this.health = config.health;
        this.baseSpeed = config.speed;
        this.speed = config.speed;
        this.reward = config.reward;
        this.color = config.color;
        
        // 路径跟踪
        this.pathIndex = 0;
        this.completedPath = false;
        
        // 状态效果
        this.frozen = false;
        this.frozenTimer = 0;
        this.slowed = false;
        this.slowTimer = 0;
        this.slowMultiplier = 1;
        this.defenseReduced = false;
        this.defenseReductionTimer = 0;
        this.defenseReduction = 0;
        
        // 元素状态
        this.activeElements = [];
        this.elementTimers = {};
        
        // 击退
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackSpeed = 5;
    }
    
    // 更新
    update(deltaTime) {
        // 更新状态效果
        this.updateStatusEffects(deltaTime);
        
        // 更新元素状态
        this.updateElementStatus(deltaTime);
        
        // 如果冻结，不移动
        if (this.frozen) return;
        
        // 处理击退
        if (Math.abs(this.knockbackX) > 0.1 || Math.abs(this.knockbackY) > 0.1) {
            this.x += this.knockbackX * deltaTime / 16;
            this.y += this.knockbackY * deltaTime / 16;
            
            this.knockbackX *= 0.9;
            this.knockbackY *= 0.9;
        }
        
        // 沿路径移动
        if (!this.completedPath && this.pathIndex < this.game.path.length) {
            const targetPoint = this.game.path[this.pathIndex];
            const targetX = targetPoint.x * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
            const targetY = targetPoint.y * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                // 到达当前点，移动到下一个点
                this.pathIndex++;
                
                if (this.pathIndex >= this.game.path.length) {
                    // 到达终点
                    this.completedPath = true;
                    this.game.gameOver(false);
                }
            } else {
                // 向目标点移动
                const moveDistance = this.speed * this.slowMultiplier * deltaTime / 16;
                this.x += (dx / distance) * moveDistance;
                this.y += (dy / distance) * moveDistance;
            }
        }
    }
    
    // 更新状态效果
    updateStatusEffects(deltaTime) {
        // 冻结
        if (this.frozen) {
            this.frozenTimer -= deltaTime;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
            }
        }
        
        // 减速
        if (this.slowed) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.slowed = false;
                this.slowMultiplier = 1;
            }
        }
        
        // 防御降低
        if (this.defenseReduced) {
            this.defenseReductionTimer -= deltaTime;
            if (this.defenseReductionTimer <= 0) {
                this.defenseReduced = false;
                this.defenseReduction = 0;
            }
        }
    }
    
    // 更新元素状态
    updateElementStatus(deltaTime) {
        // 检查元素状态是否过期
        const currentTime = performance.now();
        const elementsToRemove = [];
        
        this.activeElements.forEach(element => {
            if (this.elementTimers[element] && currentTime > this.elementTimers[element]) {
                elementsToRemove.push(element);
            }
        });
        
        elementsToRemove.forEach(element => {
            this.activeElements = this.activeElements.filter(e => e !== element);
            delete this.elementTimers[element];
        });
    }
    
    // 受到伤害
    takeDamage(damage) {
        const actualDamage = damage * (1 - this.defenseReduction);
        this.health -= actualDamage;
        
        this.game.showDamageEffect(this.x, this.y, actualDamage);
    }
    
    // 冻结
    freeze(duration) {
        this.frozen = true;
        this.frozenTimer = Math.max(this.frozenTimer, duration);
    }
    
    // 减速
    slow(multiplier, duration) {
        this.slowed = true;
        this.slowMultiplier = Math.min(this.slowMultiplier, multiplier);
        this.slowTimer = Math.max(this.slowTimer, duration);
    }
    
    // 降低防御
    reduceDefense(reduction, duration) {
        this.defenseReduced = true;
        this.defenseReduction = Math.max(this.defenseReduction, reduction);
        this.defenseReductionTimer = Math.max(this.defenseReductionTimer, duration);
    }
    
    // 击退
    knockback(distance) {
        // 向路径反方向击退
        if (this.pathIndex > 0 && this.pathIndex < this.game.path.length) {
            const currentPoint = this.game.path[this.pathIndex];
            const prevPoint = this.game.path[Math.max(0, this.pathIndex - 1)];
            
            const dx = prevPoint.x - currentPoint.x;
            const dy = prevPoint.y - currentPoint.y;
            const distanceNorm = Math.sqrt(dx * dx + dy * dy) || 1;
            
            this.knockbackX = (dx / distanceNorm) * distance;
            this.knockbackY = (dy / distanceNorm) * distance;
        }
    }
    
    // 添加元素状态
    addElement(element) {
        if (!this.activeElements.includes(element)) {
            this.activeElements.push(element);
        }
        
        // 重置元素计时器（5秒）
        this.elementTimers[element] = performance.now() + 5000;
        
        // 检查元素反应
        this.game.checkElementReaction(this);
    }
    
    // 渲染
    render(ctx) {
        // 绘制敌人主体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 冻结效果
        if (this.frozen) {
            ctx.strokeStyle = '#74b9ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 减速效果
        if (this.slowed) {
            ctx.fillStyle = 'rgba(116, 185, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制血条
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(this.x - 15, this.y - 25, 30, 5);
        
        ctx.fillStyle = healthPercent > 0.5 ? '#00b894' : healthPercent > 0.25 ? '#fdcb6e' : '#ff6b6b';
        ctx.fillRect(this.x - 15, this.y - 25, 30 * healthPercent, 5);
        
        // 绘制元素状态图标
        if (this.activeElements.length > 0) {
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let offsetX = - (this.activeElements.length - 1) * 8;
            this.activeElements.forEach(element => {
                let icon = '';
                if (element === ElementType.FIRE) icon = '🔥';
                else if (element === ElementType.ICE) icon = '❄️';
                else if (element === ElementType.THUNDER) icon = '⚡';
                
                ctx.fillText(icon, this.x + offsetX, this.y - 32);
                offsetX += 16;
            });
        }
    }
}

// 弹道类
class Projectile {
    constructor(x, y, target, damage, element, color, game) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.element = element;
        this.color = color;
        this.game = game;
        
        this.speed = 8;
        this.completed = false;
    }
    
    // 更新
    update(deltaTime) {
        if (this.completed || !this.target || this.target.health <= 0) {
            this.completed = true;
            return;
        }
        
        // 计算方向
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) {
            // 命中目标
            this.target.takeDamage(this.damage);
            this.target.addElement(this.element);
            
            // 冰霜塔有减速效果
            if (this.element === ElementType.ICE) {
                this.target.slow(0.5, 2000);
            }
            
            this.completed = true;
        } else {
            // 向目标移动
            const moveDistance = this.speed * deltaTime / 16;
            this.x += (dx / distance) * moveDistance;
            this.y += (dy / distance) * moveDistance;
        }
    }
    
    // 渲染
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 发光效果
        ctx.fillStyle = `${this.color}80`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 初始化游戏
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
