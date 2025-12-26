// script.js (修正版)
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let w, h;
let particles = [];
let fireworks = [];
let stars = [];
let horse;

// 初始化
function init() {
    resize();
    // 建立背景星星
    for(let i=0; i<100; i++) stars.push(new Star());
    horse = new Horse();
    loop();
}

// 視窗大小調整
function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);

// 處理點擊與觸控 (關鍵修正)
function handleInteraction(e) {
    let clientX = e.clientX;
    let clientY = e.clientY;
    
    // 如果是手機觸控
    if(e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    // 發射煙火
    fireworks.push(new Firework(w / 2, h, clientX, clientY));
}

// 同時監聽滑鼠與手指
window.addEventListener('mousedown', handleInteraction);
window.addEventListener('touchstart', handleInteraction);

// --- 類別定義 ---

class Star {
    constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h * 0.7;
        this.size = Math.random() * 2;
        this.offset = Math.random() * 100;
    }
    draw() {
        let alpha = Math.abs(Math.sin(Date.now() * 0.001 + this.offset));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Firework {
    constructor(sx, sy, tx, ty) {
        this.x = sx;
        this.y = sy;
        this.targetY = ty;
        this.angle = Math.atan2(ty - sy, tx - sx);
        this.speed = 2;
        this.acceleration = 1.05;
        this.coordinates = [[this.x, this.y], [this.x, this.y], [this.x, this.y]];
    }
    update(index) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        this.speed *= this.acceleration;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if(this.y <= this.targetY || this.x < 0 || this.x > w) {
            createParticles(this.x, this.y);
            fireworks.splice(index, 1);
        }
    }
    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

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
        this.friction = 0.96;
        this.gravity = 0.15;
    }
    update(index) {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
        if(this.alpha <= 0) particles.splice(index, 1);
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Horse {
    constructor() { this.reset(); }
    reset() {
        this.x = -150;
        this.y = h - 100;
        this.size = Math.min(100, w * 0.2);
        this.speed = w * 0.005 + 2;
        this.angle = 0;
        this.history = [];
    }
    update() {
        this.x += this.speed;
        this.y = (h - this.size) + Math.sin(this.angle) * 15;
        this.angle += 0.2;
        this.history.push({x: this.x, y: this.y});
        if(this.history.length > 5) this.history.shift();
        if(this.x > w + 200) this.reset();
    }
    draw() {
        this.history.forEach((pos, index) => {
            ctx.save();
            ctx.globalAlpha = index * 0.15;
            ctx.translate(pos.x, pos.y);
            ctx.scale(-1, 1);
            ctx.font = `${this.size}px Arial`;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.fillText('🐎', 0, 0);
            ctx.restore();
        });
        ctx.save();
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#FFD700";
        ctx.translate(this.x, this.y);
        ctx.scale(-1, 1);
        ctx.font = `${this.size}px Arial`;
        ctx.fillText('🐎', 0, 0);
        ctx.restore();
    }
}

function createParticles(x, y) {
    const colors = ['#FF0000', '#FFD700', '#00FF00', '#00FFFF', '#FF00FF', '#FFFFFF'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    for(let i=0; i<40; i++) particles.push(new Particle(x, y, color));
}

function loop() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.globalCompositeOperation = 'lighter';
    stars.forEach(s => s.draw());

    if(Math.random() < 0.015) {
        fireworks.push(new Firework(Math.random()*w, h, Math.random()*w, h*0.3));
    }

    let i = fireworks.length;
    while(i--) { fireworks[i].draw(); fireworks[i].update(i); }

    let j = particles.length;
    while(j--) { particles[j].draw(); particles[j].update(j); }

    ctx.globalCompositeOperation = 'source-over';
    if(horse) { horse.update(); horse.draw(); }

    requestAnimationFrame(loop);
}

// 啟動
init();