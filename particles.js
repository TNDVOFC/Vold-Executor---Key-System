class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.5 + 0.5;
        this.color = this.getRandomColor();
        this.life = 1.0;
        this.decay = Math.random() * 0.01 + 0.005;
    }

    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;

        // Bounce off walls
        if (this.x <= this.radius || this.x >= this.canvas.width - this.radius) {
            this.vx *= -0.8;
            this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
        }
        if (this.y <= this.radius || this.y >= this.canvas.height - this.radius) {
            this.vy *= -0.8;
            this.y = Math.max(this.radius, Math.min(this.canvas.height - this.radius, this.y));
        }

        // Apply gravity
        this.vy += 0.05;

        // Apply friction
        this.vx *= 0.99;
        this.vy *= 0.99;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity * this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 200;
        this.isRunning = true;
        this.mouse = { x: 0, y: 0 };
        
        this.setupCanvas();
        this.bindEvents();
        this.init();
        this.animate();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        // Resize canvas when window resizes
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });

        // Mouse interaction
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Click to add particles
        this.canvas.addEventListener('click', (e) => {
            for (let i = 0; i < 10; i++) {
                this.addParticleAt(e.clientX, e.clientY);
            }
        });

        // Controls
        const toggleBtn = document.getElementById('toggleAnimation');
        const clearBtn = document.getElementById('clearParticles');
        const countSlider = document.getElementById('particleCount');
        const countValue = document.getElementById('countValue');

        toggleBtn.addEventListener('click', () => {
            this.isRunning = !this.isRunning;
            toggleBtn.textContent = this.isRunning ? 'Pausar' : 'Retomar';
        });

        clearBtn.addEventListener('click', () => {
            this.particles = [];
        });

        countSlider.addEventListener('input', (e) => {
            this.maxParticles = parseInt(e.target.value);
            countValue.textContent = this.maxParticles;
        });
    }

    init() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(new Particle(this.canvas));
        }
    }

    addParticleAt(x, y) {
        const particle = new Particle(this.canvas);
        particle.x = x;
        particle.y = y;
        particle.vx = (Math.random() - 0.5) * 8;
        particle.vy = (Math.random() - 0.5) * 8;
        this.particles.push(particle);
    }

    update() {
        if (!this.isRunning) return;

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();

            // Mouse attraction
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.vx += (dx / distance) * force * 0.3;
                particle.vy += (dy / distance) * force * 0.3;
            }

            // Remove dead particles
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }

        // Add new particles to maintain count
        while (this.particles.length < this.maxParticles) {
            this.particles.push(new Particle(this.canvas));
        }

        // Remove excess particles
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(this.maxParticles);
        }
    }

    draw() {
        // Clear canvas with trailing effect
        this.ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections between nearby particles
        this.drawConnections();

        // Draw particles
        this.particles.forEach(particle => {
            particle.draw(this.ctx);
        });

        // Draw particle count
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Partículas: ${this.particles.length}`, 10, 30);
    }

    drawConnections() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 80) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.globalAlpha = (80 - distance) / 80 * 0.5;
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                }
            }
        }
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the particle system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particleCanvas');
    new ParticleSystem(canvas);
});