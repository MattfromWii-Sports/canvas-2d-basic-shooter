const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d'); //canvas context

canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector('#score-el');
const startGameBtn = document.querySelector('.start-btn');
const modalContainer = document.querySelector('.modal-container');
const scoreFinalEl = document.querySelector('#final-score');

class Player {
    constructor(x, y, radius, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        if(('ArrowDown' in keysDown || mobileTouch === 'down')&& this.y + this.radius < canvas.height - this.speed) {
            this.y += this.speed;
        }
        if('ArrowUp' in keysDown && this.y - this.radius > 0) {
            this.y -= this.speed;
        }
        if('ArrowLeft' in keysDown && this.x - this.radius > 0) {
            this.x -= this.speed;
        }
        if('ArrowRight' in keysDown && this.x + this.radius < canvas.width - this.speed) {
            this.x += this.speed;
        }
        this.draw();
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y; 
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x,);
        this.velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        this.x += this.velocity.x;
        this.y += this.velocity.y; 
        this.draw();
    }
}

const friction = 0.97;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y; 
        this.alpha -= 0.01;
    }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 15, 'white', 3);
let projectiles = [];
let enemies = [];
let particles = [];

//reset
function init() {
    player = new Player(x, y, 15, 'white', 5);
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.textContent = score;
    scoreFinalEl.textContent = score;

}
//enemy spawn
function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (35 - 5) + 5;
        let x;
        let y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

        const angle = Math.atan2(player.y - y, player.x - x,);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1200);
}

let animationId;
let score = 0;
function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0,0,0,0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();

player.update();

    particles.forEach((particle, index) => {
        if(particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();
        //remove projectiles from edges of screen
        if(projectile.x + projectile.radius < 0 || 
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 || 
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });

    enemies.forEach((enemy, index) => {
        enemy.update();
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        //ends game, player hit
        if(dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            modalContainer.style.display = 'flex';
            scoreFinalEl.textContent = score;
        }

        //Projectile to Enemy collision
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if(dist - enemy.radius - projectile.radius < 1) {
            
                //create particle explosion
                for(let i = 0; i < enemy.radius * 1.5; i++) {
                    particles.push(new Particle(projectile.x, 
                        projectile.y, 
                        Math.random() * 2, 
                        enemy.color, 
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 5), 
                            y: (Math.random() - 0.5) * (Math.random() * 5)
                        }));
                }

                if(enemy.radius - 10 > 6) {
                    //decrease enemy size
                    score += 100;
                    scoreEl.textContent = score; 

                    gsap.to(enemy, {radius: enemy.radius - 10});
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                } else {
                    //remove enemy
                    score += 250;
                    scoreEl.textContent = score;

                    setTimeout(() => {
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }
            }
        })
    })
}

//player movement - desktop
let keysDown = {};
addEventListener('keydown', function(e) {
    keysDown[e.key] = true;
}, false);
addEventListener('keyup', function(e) {
    delete keysDown[e.key];
}, false);
//player movement - phone
let mobileTouch;
addEventListener('touchmove', (e) => {
    mobileTouch = 'down';
});
addEventListener('touchend', (e) => {
    mobileTouch = null;
});

//projectile spawn
addEventListener('click', (e) => {
    const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x,);
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(new Projectile(
        player.x, 
        player.y, 
        5, 
        'white', 
        velocity))
});
//start loop
startGameBtn.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    modalContainer.style.display = 'none';
});