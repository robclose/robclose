"use strict";

const bgCtx = document.getElementById('bg-canvas').getContext('2d');
const gameCtx = document.getElementById('game-canvas').getContext('2d');
const hudCtx = document.getElementById('hud-canvas').getContext('2d');
const gameWidth = document.getElementById('game-canvas').width;
const gameHeight = document.getElementById('game-canvas').height;
const canvas = document.getElementById('hud-canvas')
let missiles = [];
let guns = [];
let particles = [];
let timestamp = null;
let gamePhase = 'start';
let wave1;
let missilestoFire;
let hud;
let result;
let tables = [2, 3, 4, 5, 10];
let missilesMax;
let typedTimeStamp = 0;

class HUD {
    constructor() {
        this.elements = [];
    }
    addElement (start, end, action) {
        let done;
        let f = (dt) => {
            if (dt >= start && dt <= end && !done)
            { done = action(dt-start); }
            if (dt > end ) { done = true }
            return !done;
        }
        this.elements.push(f);
    }
    draw (timeElapsed) {
        hudCtx.globalAlpha = 0.6;
        hudCtx.fillStyle = 'cyan';
        hudCtx.strokeStyle = 'cyan';
        hudCtx.textAlign = "center"	;
        hudCtx.textBaseline = "middle";
        hudCtx.font = "20px monospace";
        this.elements = this.elements.filter ( e => e(timeElapsed));
    }
}

class Alien {
    constructor (x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.isDead = false;
    }
    update () {
        this.x += wave1.vx;
        this.y += wave1.vy;
    }

    draw () {
        if (this.isDead) {
            gameCtx.fillStyle = '#331400';
        }
        else {
            gameCtx.fillStyle = 'red';
        }
        gameCtx.fillRect(this.x - this.size * 0.5, this.y - this.size * 0.5, this.size, this.size);
    }
}

class Wave {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.vx = 1.0;
        this.nextvx = this.vx;
        this.vy = 0;
        this.aliens = [];
        this.descendCounter = 0;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.aliens.push(new Alien(100 + j * 15, 150 + i * 15))
            }
        }
    }
    update () {
        if (this.aliens.length == 0) {return}
        if (this.vx != 0 && (this.rightmost >= 750 || this.leftmost <= 50)) {
            this.nextvx = -this.vx ;
            this.vy = 1;
            this.vx = 0
            this.descendCounter = 30;
            }
        
        if (this.descendCounter == 0) {
            this.vy = 0;
            this.vx = this.nextvx;
        }
        if (this.descendCounter >= 0) {
        this.descendCounter--;
        }

    }
    get leftmost () { return this.aliens[0].x  }
    get topmost () { return this.aliens[0].y  }
    get rightmost () {
        let aliensX = this.aliens.map( a => a.x);
        return Math.max(...aliensX)
    }
    get bottommost () {
        let aliensY = this.aliens.map( a => a.y);
        return Math.max(...aliensY);
    }
}

class Missile {
    constructor (alien, x) {
        this.trail = [];
        this.position = {x: x, y: gameHeight - 50 };
        this.velocity = {x: (Math.random() - 0.5), y: -3 * Math.random() - 1.5};
        this.trailLength = 20;
        if (alien) {
            this.target = alien;
            this.target.missile = this;
            this.isDud = false;
        } else {
          this.target = null;
          this.isDud = true;
          }
        this.hasHitTarget = false;
    }
    update () {
        if (this.hasHitTarget) {
            this.trail.pop();
            if (this.trail.length < 2) {
            missiles = missiles.filter( m => m !== this);
            }
        return
        }
        
        this.trail.unshift({x: this.position.x, y: this.position.y});
        if (this.trail.length > this.trailLength) this.trail.pop();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (!this.isDud) {
            let steer = this.steerVector();
            let accel = 0.1; 
            this.velocity.x += steer.x * accel + 2 * (Math.random() - 0.5);
            this.velocity.y += steer.y * accel + 2 * (Math.random() - 0.5);
        } else {
            // this.velocity.x -= this.velocity.x * 0.02
            this.velocity.y += 0.02; //gravity
            missiles.filter( m => m.position.y > gameHeight - 50 && !m.hasHitTarget).forEach (m => {
                m.hasHitTarget = true;
                for (let i = 0;i < 6;i++) {
                    particles.push(new Particle(m.position, '#006d12ff'))
                }

            });


        }

        if (!this.isDud && this.distToTarget() < 5) {
            this.hasHitTarget = true;
            this.target.isDead = true;
            particles.push(new Particle(this.position, 'red', 0.1),
                            new Particle(this.position, 'red', 0.1),
                            new Particle(this.position, 'red', 0.1))
            let liveAliens = wave1.aliens.filter (a => !a.isDead);
            if (liveAliens.length == 0) {
                if (result == 0) {
                    for (let a of wave1.aliens) {
                        setTimeout(() => {
                            for (let i = 0; i<50 ; i++) {
                                let green = Math.floor(Math.random() * 256);
                                let red = Math.floor(Math.random() * 128 + 128);
                                let blue = Math.floor(Math.random() * 128);
                                let alpha = Math.random() * 0.3 + 0.7;
                                particles.push(new Particle({x: a.x, y: a.y}, `rgba(${red}, ${green}, ${blue}, ${alpha})`, 0))
                            }
                            wave1.aliens = wave1.aliens.filter( b => b !== a);
                            }, Math.random() * 3000);
                            
                        }
                    } else {
                        wave1.aliens.length = 0;
                    }
                }
            }
        
        
    }
    distToTarget () {
        let dx = this.target.x - this.position.x;
        let dy = this.target.y - this.position.y;
        return Math.hypot(dx, dy);
    }
    steerVector () {
        let dx = this.target.x - this.position.x;
        let dy = this.target.y - this.position.y;
        let dist = this.distToTarget();
        let dirX = dx / dist;
        let dirY = dy / dist;
        let desiredSpeed = 6; 
        let desiredVX = dirX * desiredSpeed;
        let desiredVY = dirY * desiredSpeed;
        return {x: desiredVX - this.velocity.x, y: desiredVY - this.velocity.y};
    }
    draw () {
        gameCtx.fillStyle = 'grey';
        if (!this.hasHitTarget) gameCtx.fillRect(this.position.x - 4, this.position.y - 4, 8, 8);
        let gradient = gameCtx.createLinearGradient(this.trail[0].x, this.trail[0].y, 
                            this.trail[this.trail.length-1].x, this.trail[this.trail.length-1].y);
        gradient.addColorStop(0, "rgba(255, 128, 0, 1)");   // solid orange
        gradient.addColorStop(1, "rgba(255, 255, 0, 0)");   // fully transparent yellow

        gameCtx.strokeStyle = gradient;
        gameCtx.beginPath();
        gameCtx.moveTo(this.position.x, this.position.y);
        for (let point of this.trail) {
            gameCtx.lineTo (point.x, point.y);
        }
        gameCtx.stroke();
    }
}

class Particle {
	constructor(position, colour, gravity = 0.02) {
		this.position = {x: position.x, y: position.y};
		this.vx = Math.random() * 2 - 1;
		this.vy = Math.random() * 2 - 1;
		this.colour = colour;
        this.trail = [];
        this.trailLength = 8;
        this.gravity = gravity;
		}

	update () {
		
        this.trail.unshift({x: this.position.x, y: this.position.y});
        if (this.trail.length > this.trailLength) this.trail.pop();
		this.position.x += this.vx;
		this.position.y += this.vy;
		this.vy += this.gravity;
        if (this.gravity < 0.015) this.gravity += 0.00005;

        if (this.position.y > gameHeight) particles = particles.filter (p => p !== this)

    }
    draw () {

		gameCtx.fillStyle = this.colour;
        let gradient = gameCtx.createLinearGradient(this.trail[0].x, this.trail[0].y, 
                            this.trail[this.trail.length-1].x, this.trail[this.trail.length-1].y);
        gradient.addColorStop(0, this.colour); 
        gradient.addColorStop(1, 'rgba(200, 255, 0, 0)'); 

        gameCtx.strokeStyle = gradient;
        gameCtx.beginPath();
        gameCtx.moveTo(this.position.x, this.position.y);
        for (let point of this.trail) {
            gameCtx.lineTo (point.x, point.y);
        }
        gameCtx.stroke();

	}
} 

function gameLoop(time) {

    hudCtx.clearRect(0,0,gameWidth, gameHeight);
    gameCtx.clearRect(0,0,gameWidth, gameHeight);

    switch (gamePhase) {

        case 'start':
             hud = new HUD();
            for (let g = 0; g < 12; g++) {
                guns.push((gameWidth - 100)/12 * g + 50);
                }

            setupHandlers();
            gamePhase = 'spawnWave';
            timestamp = time;
        break;

        case 'spawnWave':
            wave1 = new Wave(tables[Math.floor(Math.random() * tables.length)],Math.floor(Math.random() * 10) + 2);
            for (let a of wave1.aliens) {a.draw(); }
            addAnalysisHudElements();
            missilesMax = 12 * tables[tables.length - 1] + 10;
            gamePhase = 'analysis'; 
            particles.length = 0
            timestamp = time;
        break;

        case 'analysis':
            for (let a of wave1.aliens) {a.update(); }
            for (let a of wave1.aliens) {a.draw(); }
            wave1.update();
            hud.draw(time - timestamp);
            break;

        case 'playerChooses':
            hud.elements.length = 0;
            timestamp = time;
            result = missilestoFire - wave1.aliens.length;
            gamePhase = 'firing';
            break;

        case 'firing':
                if (result == 0 && wave1.aliens.length == 0) {
                gamePhase = 'end'
                timestamp = time
                hud.addElement(0, 3000, (dt) => {
                    hudCtx.fillText("You saved planet Earth!!", gameWidth * 0.5, gameHeight * 0.5)
                });
                break;
            }
            else if (result > 0 && missilestoFire == 0 && missiles.length == 0) {
                gamePhase = 'end'
                timestamp = time
                hud.addElement(0, 3000, (dt) => {
                    hudCtx.fillText(`${result} stray missiles destroyed the Earth!!`, gameWidth * 0.5, gameHeight * 0.5)
                });
                break;
            }
            else if (result < 0 && missiles.length == 0 && missilestoFire == 0) {
                gamePhase = 'end'
                timestamp = time
                hud.addElement(0, 3000, (dt) => {
                    hudCtx.fillText(`${-result} aliens survived to invade the Earth!!`, gameWidth * 0.5, gameHeight * 0.5)
                });
                break;
            }
            for (let a of wave1.aliens) {a.update(); }
            for (let a of wave1.aliens) {a.draw(); }
            for (let m of missiles) {m.update();}
            for (let m of missiles) {m.draw();}
            for (let p of particles) {p.update();}
            for (let p of particles) {p.draw();}
            wave1.update(); 
            if (missilestoFire > 0 && time - timestamp > 50) {
                timestamp = time;
                missilestoFire--;
                let untargetedAliens = wave1.aliens.filter ( a => !a.missile );
                missiles.push(new Missile(untargetedAliens[untargetedAliens.length - 1], guns[Math.floor(Math.random() * 12)]));
            }
            break;

            case 'end':
                hud.draw(time - timestamp);
                for (let a of wave1.aliens) {a.update(); }
                for (let a of wave1.aliens) {a.draw(); }
                for (let m of missiles) {m.update();}
                for (let m of missiles) {m.draw();}
                for (let p of particles) {p.update();}
                for (let p of particles) {p.draw();}
                wave1.update(); 
                if (time - timestamp > 5000 && particles.length == 0) {gamePhase = 'spawnWave'}

    }

    requestAnimationFrame(gameLoop);
} 

requestAnimationFrame(gameLoop);

function randInt(lower, higher) {
    return Math.floor(Math.random() * (higher + 1 - lower) + lower)
}

function addAnalysisHudElements () {

        hud.addElement(1000, Infinity, () => {
            if (missilestoFire) hudCtx.fillText(missilestoFire, gameHeight * 0.5, gameHeight - 50);
            hudCtx.strokeRect(50, gameHeight - 30, gameWidth - 250, 10);
            hudCtx.fillRect(50, gameHeight - 30, missilestoFire / missilesMax * (gameWidth - 250), 10 );
            hudCtx.strokeRect(gameWidth - 150, gameHeight - 40, 100, 30);
            hudCtx.fillText("Fire!", gameWidth - 100, gameHeight - 23);
        
        });
            // Flashing rect
         hud.addElement(1500, 3000, (dt) => {
            if (Math.floor(dt/200) % 2 == 0 ) {
                hudCtx.strokeRect(
                    wave1.leftmost - 10, 
                    wave1.topmost - 10, 
                    wave1.rightmost - wave1.leftmost + 20,
                    wave1.bottommost - wave1.topmost + 20);
                hudCtx.globalAlpha = 0.2;
                hudCtx.fillRect(
                    wave1.leftmost - 10, 
                    wave1.topmost - 10, 
                    wave1.rightmost - wave1.leftmost + 20,
                    wave1.bottommost - wave1.topmost + 20);
                hudCtx.globalAlpha = 0.6;
            }
        });

        // Tick marks 
        hud.addElement(2000, Infinity, (dt) => {
            let colTickNum = Math.min(wave1.cols, Math.floor(dt/100));
            for (let c = 0; c < colTickNum; c++) {
                hudCtx.beginPath();
                hudCtx.moveTo(wave1.aliens[c].x, wave1.topmost - 15);
                hudCtx.lineTo(wave1.aliens[c].x, wave1.topmost - 20);
                hudCtx.stroke();
            }   
            // Column tick joiner
            hudCtx.beginPath();
                hudCtx.moveTo(wave1.leftmost, wave1.topmost - 20);
                hudCtx.lineTo(wave1.rightmost, wave1.topmost - 20);
                hudCtx.stroke();
            // Row ticks
            let rowTickNum = Math.min(wave1.rows, Math.floor(dt/100));
            for (let r = 0; r < rowTickNum; r++) {
                hudCtx.beginPath();
                hudCtx.moveTo(wave1.leftmost - 15, wave1.aliens[r * wave1.cols + 1].y);
                hudCtx.lineTo(wave1.leftmost - 20, wave1.aliens[r * wave1.cols + 1].y);
                hudCtx.stroke();
            }  
            // Row tick joiner
            hudCtx.beginPath();
                hudCtx.moveTo(wave1.leftmost - 20, wave1.topmost);
                hudCtx.lineTo(wave1.leftmost - 20, wave1.bottommost);
                hudCtx.stroke();
        });
        // Row/col count digits
        hud.addElement(3500, Infinity, () => {
            hudCtx.textAlign = "center"	;
            hudCtx.font = "20px monospace";
            let middleX = wave1.leftmost + 0.5 * (wave1.rightmost - wave1.leftmost);
            let middleY = wave1.topmost + 0.5 * (wave1.bottommost - wave1.topmost);
            hudCtx.fillText(wave1.rows, wave1.leftmost - 40, middleY );
            hudCtx.fillText(wave1.cols, middleX, wave1.topmost - 40);
        });
}

function setupHandlers () {

	let intervalId = null;
	let eMouse = null;

	canvas.addEventListener('mousemove', e => eMouse = e );

	canvas.addEventListener ( "mousedown", () => {
		if (eMouse) {
			intervalId = setInterval( () => setMissilesChoice(eMouse), 40);
		}
	});

	canvas.addEventListener('mouseup', () => {
    clearInterval(intervalId);
    intervalId = null;
  });

  canvas.addEventListener('mouseleave', () => {
    clearInterval(intervalId);
    intervalId = null;
  });

    window.addEventListener('keydown', (e) => {

        if (gamePhase !== 'analysis') return;

        if (Number.parseInt(e.key) >= 0) {
            if (e.timeStamp - typedTimeStamp < 5 * 1000 && missilestoFire) {
                missilestoFire = missilestoFire.toString() + e.key.toString();
            } else {
                missilestoFire = e.key;
            }
        } else if (e.key == 'Backspace' && missilestoFire) {
            missilestoFire = missilestoFire.toString().slice(0, -1);
        } else if (e.key == 'Enter' && missilestoFire > 0) {
            gamePhase = 'playerChooses'
            return;
        }
        missilestoFire = Math.min(missilestoFire, missilesMax);
        typedTimeStamp = e.timeStamp;
        
  });



}
function setMissilesChoice (eMouse) {

    if (gamePhase !== 'analysis') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = eMouse.clientX - rect.left;    
    const y = eMouse.clientY - rect.top;   
    const min = 50;
    const max = gameWidth - 200;

    if (x > gameWidth - 150 && x < gameWidth - 50 
        && y > gameHeight - 40 && y < gameHeight - 10
        && missilestoFire > 0) {
            gamePhase = 'playerChooses'
            return;
        } else if (x > min - 20 && x < max + 20) {

        let number = missilesMax / (max - min) * (x - min)
        number = Math.floor(number);
        number = Math.min(number, missilesMax);
        number = Math.max(1, number);
        missilestoFire = number;
        }
    
}