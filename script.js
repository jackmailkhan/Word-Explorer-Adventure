
        // Game configuration
        const CONFIG = {
            WIDTH: 1200,
            HEIGHT: 800
        };

        // Particle class
        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 5;
                this.vy = Math.random() * -5 - 2;
                this.life = 1;
                this.color = color;
                this.size = Math.random() * 4 + 2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.2;
                this.life -= 0.02;
                return this.life > 0;
            }

            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // Letter tile class
        class Letter {
            constructor(char, x, y, index) {
                this.char = char;
                this.x = x;
                this.y = y;
                this.targetX = x;
                this.targetY = y;
                this.index = index;
                this.selected = false;
                this.size = 70;
                this.scale = 1;
            }

            update() {
                this.x += (this.targetX - this.x) * 0.15;
                this.y += (this.targetY - this.y) * 0.15;
                this.scale += ((this.selected ? 1.1 : 1) - this.scale) * 0.15;
            }

            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.scale(this.scale, this.scale);

                // Shadow
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 5;

                // Background
                const gradient = ctx.createLinearGradient(-35, -35, 35, 35);
                if (this.selected) {
                    gradient.addColorStop(0, '#FFD700');
                    gradient.addColorStop(1, '#FFA500');
                } else {
                    gradient.addColorStop(0, '#4facfe');
                    gradient.addColorStop(1, '#00f2fe');
                }
                ctx.fillStyle = gradient;
                
                ctx.beginPath();
                ctx.roundRect(-35, -35, 70, 70, 10);
                ctx.fill();

                // Border
                ctx.strokeStyle = this.selected ? '#FFD700' : '#fff';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Letter
                ctx.shadowColor = 'transparent';
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.char, 0, 0);

                ctx.restore();
            }

            contains(px, py) {
                const dx = px - this.x;
                const dy = py - this.y;
                return Math.abs(dx) < 35 && Math.abs(dy) < 35;
            }
        }

        // Main game class
        class Game {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.setupCanvas();
                
                this.state = 'menu';
                this.score = 0;
                this.level = 1;
                this.combo = 0;
                this.time = 180;
                
                this.particles = [];
                this.letters = [];
                this.selectedLetters = [];
                this.targetWord = '';
                this.foundWords = [];
                
                this.menuButtons = [];
                this.stars = [];
                
                this.setupInput();
                this.initMenu();
                this.lastTime = performance.now();
                this.animate();
            }

            setupCanvas() {
                const container = this.canvas.parentElement;
                const rect = container.getBoundingClientRect();
                this.canvas.width = CONFIG.WIDTH;
                this.canvas.height = CONFIG.HEIGHT;
            }

            initMenu() {
                // Create stars
                for (let i = 0; i < 100; i++) {
                    this.stars.push({
                        x: Math.random() * CONFIG.WIDTH,
                        y: Math.random() * CONFIG.HEIGHT,
                        size: Math.random() * 2 + 1,
                        speed: Math.random() * 0.5 + 0.2
                    });
                }

                // Create menu buttons
                const buttonY = CONFIG.HEIGHT / 2 + 50;
                this.menuButtons = [
                    { text: 'Play Game', y: buttonY, action: () => this.startGame() },
                    { text: 'Daily Challenge', y: buttonY + 80, action: () => this.startGame() },
                    { text: 'Achievements', y: buttonY + 160, action: () => this.showAchievements() }
                ];
            }

            startGame() {
                this.state = 'game';
                this.time = 180;
                this.selectedLetters = [];
                
                // Word lists by difficulty
                const words = [
                    ['CAT', 'DOG', 'HAT', 'BAT'],
                    ['SNOW', 'COLD', 'WIND', 'STAR'],
                    ['WINTER', 'SPRING', 'SUMMER'],
                    ['EXPLORER', 'TREASURE', 'JOURNEY']
                ];
                
                const listIndex = Math.min(Math.floor(this.level / 5), words.length - 1);
                const wordList = words[listIndex];
                this.targetWord = wordList[Math.floor(Math.random() * wordList.length)];
                
                // Create shuffled letters
                const chars = this.targetWord.split('');
                for (let i = chars.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [chars[i], chars[j]] = [chars[j], chars[i]];
                }
                
                const startX = CONFIG.WIDTH / 2 - (chars.length * 80) / 2;
                this.letters = chars.map((char, i) => 
                    new Letter(char, startX + i * 80, CONFIG.HEIGHT - 150, i)
                );
            }

            showAchievements() {
                alert('🏆 Achievements:\n\n⭐ First Word - Complete your first level\n🎯 Combo Master - Reach 5x combo\n👑 Word Explorer - Complete 20 levels\n🔥 Speed Runner - Finish in under 60 seconds');
            }

            setupInput() {
                const getPos = (e) => {
                    const rect = this.canvas.getBoundingClientRect();
                    const scaleX = CONFIG.WIDTH / rect.width;
                    const scaleY = CONFIG.HEIGHT / rect.height;
                    const clientX = e.clientX || (e.touches?.[0]?.clientX) || 0;
                    const clientY = e.clientY || (e.touches?.[0]?.clientY) || 0;
                    return {
                        x: (clientX - rect.left) * scaleX,
                        y: (clientY - rect.top) * scaleY
                    };
                };

                const handleClick = (e) => {
                    e.preventDefault();
                    const pos = getPos(e);

                    if (this.state === 'menu') {
                        this.menuButtons.forEach(btn => {
                            if (pos.y > btn.y - 30 && pos.y < btn.y + 30) {
                                this.playSound(440);
                                btn.action();
                            }
                        });
                    } else if (this.state === 'game') {
                        this.letters.forEach(letter => {
                            if (letter.contains(pos.x, pos.y)) {
                                if (!letter.selected) {
                                    letter.selected = true;
                                    this.selectedLetters.push(letter);
                                    this.playSound(523);
                                    this.createParticles(letter.x, letter.y, 10);
                                    this.checkWord();
                                } else {
                                    letter.selected = false;
                                    this.selectedLetters = this.selectedLetters.filter(l => l !== letter);
                                    this.playSound(392);
                                }
                            }
                        });
                    } else if (this.state === 'complete') {
                        if (pos.y > CONFIG.HEIGHT/2 + 80 && pos.y < CONFIG.HEIGHT/2 + 140) {
                            this.level++;
                            this.startGame();
                        }
                    }
                };

                this.canvas.addEventListener('mousedown', handleClick);
                this.canvas.addEventListener('touchstart', handleClick);
            }

            checkWord() {
                const word = this.selectedLetters.map(l => l.char).join('');
                if (word === this.targetWord) {
                    this.score += 100 * (this.combo + 1);
                    this.combo++;
                    this.playSound(659);
                    this.createParticles(CONFIG.WIDTH/2, 300, 50);
                    this.state = 'complete';
                }
            }

            createParticles(x, y, count) {
                const colors = ['#FFD700', '#FFA500', '#FF6347', '#4facfe'];
                for (let i = 0; i < count; i++) {
                    this.particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
                }
            }

            playSound(freq) {
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.1);
                } catch (e) {}
            }

            update(dt) {
                if (this.state === 'game') {
                    this.time -= dt;
                    if (this.time <= 0) {
                        this.state = 'menu';
                    }
                    this.letters.forEach(l => l.update());
                } else if (this.state === 'menu') {
                    this.stars.forEach(s => {
                        s.y += s.speed;
                        if (s.y > CONFIG.HEIGHT) {
                            s.y = 0;
                            s.x = Math.random() * CONFIG.WIDTH;
                        }
                    });
                }
                
                this.particles = this.particles.filter(p => p.update());
            }

            draw() {
                const ctx = this.ctx;
                
                // Background
                const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.HEIGHT);
                gradient.addColorStop(0, '#1e3c72');
                gradient.addColorStop(1, '#2a5298');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

                // Stars
                ctx.fillStyle = '#fff';
                this.stars.forEach(s => {
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                    ctx.fill();
                });

                if (this.state === 'menu') {
                    this.drawMenu(ctx);
                } else if (this.state === 'game') {
                    this.drawGame(ctx);
                } else if (this.state === 'complete') {
                    this.drawGame(ctx);
                    this.drawComplete(ctx);
                }

                // Particles
                this.particles.forEach(p => p.draw(ctx));
            }

            drawMenu(ctx) {
                // Title
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 64px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText('Word Explorer', CONFIG.WIDTH/2, 200);
                
                ctx.font = '28px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.fillText('Adventure Awaits!', CONFIG.WIDTH/2, 260);
                ctx.shadowColor = 'transparent';

                // Buttons
                this.menuButtons.forEach(btn => {
                    const gradient = ctx.createLinearGradient(
                        CONFIG.WIDTH/2 - 150, btn.y - 30,
                        CONFIG.WIDTH/2 + 150, btn.y + 30
                    );
                    gradient.addColorStop(0, '#4facfe');
                    gradient.addColorStop(1, '#00f2fe');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.roundRect(CONFIG.WIDTH/2 - 150, btn.y - 30, 300, 60, 15);
                    ctx.fill();
                    
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText(btn.text, CONFIG.WIDTH/2, btn.y);
                });
            }

            drawGame(ctx) {
                // Target word area
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.beginPath();
                ctx.roundRect(CONFIG.WIDTH/2 - 300, 150, 600, 150, 20);
                ctx.fill();
                
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 4;
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Form: ${this.targetWord}`, CONFIG.WIDTH/2, 200);
                
                const current = this.selectedLetters.map(l => l.char).join('');
                ctx.font = 'bold 48px Arial';
                ctx.fillStyle = current === this.targetWord ? '#00FF00' : '#FFD700';
                ctx.fillText(current || '___', CONFIG.WIDTH/2, 260);

                // UI boxes
                this.drawUIBox(ctx, 40, 40, 180, 70, 'Score', this.score);
                this.drawUIBox(ctx, 40, 130, 180, 70, 'Level', this.level);
                this.drawUIBox(ctx, CONFIG.WIDTH - 220, 40, 180, 70, 'Time', Math.ceil(this.time));
                if (this.combo > 0) {
                    this.drawUIBox(ctx, CONFIG.WIDTH - 220, 130, 180, 70, 'Combo', `x${this.combo}`);
                }

                // Letters
                this.letters.forEach(l => l.draw(ctx));
            }

            drawUIBox(ctx, x, y, w, h, label, value) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, 10);
                ctx.fill();
                
                ctx.strokeStyle = '#4facfe';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(label, x + w/2, y + 25);
                
                ctx.font = 'bold 28px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.fillText(value.toString(), x + w/2, y + 55);
            }

            drawComplete(ctx) {
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
                
                ctx.fillStyle = 'rgba(0,0,0,0.9)';
                ctx.beginPath();
                ctx.roundRect(CONFIG.WIDTH/2 - 300, CONFIG.HEIGHT/2 - 200, 600, 400, 30);
                ctx.fill();
                
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 5;
                ctx.stroke();
                
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 56px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Level Complete!', CONFIG.WIDTH/2, CONFIG.HEIGHT/2 - 80);
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 36px Arial';
                ctx.fillText(`Score: ${this.score}`, CONFIG.WIDTH/2, CONFIG.HEIGHT/2);
                ctx.fillText(`Next Level: ${this.level + 1}`, CONFIG.WIDTH/2, CONFIG.HEIGHT/2 + 50);
                
                // Continue button
                ctx.fillStyle = '#4facfe';
                ctx.beginPath();
                ctx.roundRect(CONFIG.WIDTH/2 - 150, CONFIG.HEIGHT/2 + 80, 300, 60, 15);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 28px Arial';
                ctx.fillText('Continue', CONFIG.WIDTH/2, CONFIG.HEIGHT/2 + 110);
            }

            animate(currentTime = 0) {
                const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
                this.lastTime = currentTime;
                
                this.update(dt);
                this.draw();
                
                requestAnimationFrame((t) => this.animate(t));
            }
        }

        // Polyfill for roundRect
        if (!CanvasRenderingContext2D.prototype.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
                this.beginPath();
                this.moveTo(x + r, y);
                this.lineTo(x + w - r, y);
                this.arcTo(x + w, y, x + w, y + r, r);
                this.lineTo(x + w, y + h - r);
                this.arcTo(x + w, y + h, x + w - r, y + h, r);
                this.lineTo(x + r, y + h);
                this.arcTo(x, y + h, x, y + h - r, r);
                this.lineTo(x, y + r);
                this.arcTo(x, y, x + r, y, r);
                this.closePath();
            };
        }

        // Initialize
        let game;
        let loadProgress = 0;

        function simulateLoading() {
            const bar = document.getElementById('progressBar');
            const screen = document.getElementById('loadingScreen');
            
            const interval = setInterval(() => {
                loadProgress += Math.random() * 20;
                if (loadProgress >= 100) {
                    loadProgress = 100;
                    bar.style.width = '100%';
                    bar.textContent = '100%';
                    setTimeout(() => {
                        screen.classList.add('hidden');
                        game = new Game();
                    }, 500);
                    clearInterval(interval);
                } else {
                    bar.style.width = loadProgress + '%';
                    bar.textContent = Math.floor(loadProgress) + '%';
                }
            }, 150);
        }

        window.addEventListener('load', simulateLoading);
  
