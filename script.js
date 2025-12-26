// script.js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let w, h;
let particles = [];
let fireworks = [];
let stars = [];
let horse;

// 初始化畫布與物件
function init() {
    resize();
    horse = new Horse();
    
    // 建立背景星星
    for(let i = 0; i < 100; i++){
        stars.push(new Star());
    }
    
    loop();
}

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);

// 監聽點擊事件：手動施放煙火
window.addEventListener('mousedown', (e) => {
    const targetX = e.clientX;
    const targetY = e.clientY;
    // 從底部發射到滑鼠點擊的位置
    fireworks.push(new Firework(w / 2, h, targetX, targetY));
});

// --- 類別定義 ---

// 1. 背景星星
class Star {
    constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h * 0.7; // 星星只在上半部
        this.size = Math.random() * 2;
        this.twinkle = Math.random() * 0.05;
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(Date.now() * 0.001 + this.x))})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 2. 煙火火箭 (升空階段)
class Firework {
    constructor(sx, sy, tx, ty) {
        this.x = sx;
        this.y = sy;
        this.tx = tx; // 目標 X
        this.ty = ty; // 目標 Y
        this.distanceToTarget = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
        this.angle = Math.atan2(ty - sy, tx - sx);
        this.speed = 2;
        this.acceleration = 1.05;
        this.coordinates = []; // 用於繪製尾巴
        this.coordinateCount = 3;
        while(this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
    }

    update(index) {
        // 更新尾巴座標
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        // 加速
        this.speed *= this.acceleration;
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        
        // 移動
        this.x += vx;
        this.y += vy;

        // 計算剩餘距離
        const distanceTraveled = Math.sqrt(Math.pow(this.x - this.tx, 2) + Math.pow(this.y - this.ty, 2));

        // 如果接近目標，爆炸
        if(distanceTraveled < this.distanceToTarget * 0.1 || this.y <= this.ty) {
            createParticles(this.tx, this.ty);
            fireworks.splice(index, 1);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// 3. 爆炸粒子 (爆炸階段)
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.friction = 0.96; // 摩擦力
        this.gravity = 0.1;   // 重力
    }

    update(index) {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.015;

        if(this.alpha <= 0) {
            particles.splice(index, 1);
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 產生爆炸粒子
function createParticles(x, y) {
    const colors = ['#FF0000', '#FFD700', '#00FF00', '#00FFFF', '#FF00FF', '#FFFFFF'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    let particleCount = 50;
    while(particleCount--) {
        particles.push(new Particle(x, y, color));
    }
}

// 4. 神馬類別
class Horse {
    constructor() {
        this.x = -150;
        this.y = h - 100;
        this.size = 100;
        this.speed = 5;
        this.angle = 0;
        // 用於製作殘影
        this.history = []; 
    }

    update() {
        this.x += this.speed;
        this.y = (h - 100) + Math.sin(this.angle) * 15; // 波浪運動
        this.angle += 0.2;

        // 記錄位置用於殘影
        this.history.push({x: this.x, y: this.y});
        if(this.history.length > 5) this.history.shift();

        // 跑出螢幕後重置
        if (this.x > w + 200) {
            this.x = -150;
            // 每次重跑稍微改變速度
            this.speed = 4 + Math.random() * 2;
        }
    }

    draw() {
        // 繪製殘影
        this.history.forEach((pos, index) => {
            ctx.save();
            ctx.globalAlpha = index * 0.15; // 越舊的越透明
            ctx.translate(pos.x, pos.y);
            ctx.scale(-1, 1);
            ctx.font = `${this.size}px Arial`;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)'; // 金色殘影
            ctx.fillText('🐎', 0, 0);
            ctx.restore();
        });

        // 繪製本體
        ctx.save();
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#FFD700"; // 金色光暈
        ctx.translate(this.x, this.y);
        ctx.scale(-1, 1); // 翻轉
        ctx.font = `${this.size}px Arial`;
        ctx.fillText('🐎', 0, 0);
        ctx.restore();
    }
}

// --- 動畫主迴圈 ---
function loop() {
    // 使用半透明黑色覆蓋，製造拖影效果 (Trail Effect)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);

    // 繪製背景星星
    ctx.fillStyle = '#FFF';
    stars.forEach(star => star.draw());

    // 隨機自動發射煙火 (機率較低，依賴使用者點擊更有趣)
    if(Math.random() < 0.02) {
        const tx = Math.random() * w;
        const ty = Math.random() * h * 0.4;
        fireworks.push(new Firework(Math.random() * w, h, tx, ty));
    }

    // 更新並繪製煙火火箭
    ctx.globalCompositeOperation = 'lighter'; // 讓光亮疊加
    let i = fireworks.length;
    while(i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }

    // 更新並繪製爆炸粒子
    let j = particles.length;
    while(j--) {
        particles[j].draw();
        particles[j].update(j);
    }

    // 繪製馬
    ctx.globalCompositeOperation = 'source-over';
    if(horse) {
        horse.update();
        horse.draw();
    }

    requestAnimationFrame(loop);
}

// 啟動！
init();
