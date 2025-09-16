"use strict";

const bgCtx = document.getElementById('bg-canvas').getContext('2d');
const gameCtx = document.getElementById('game-canvas').getContext('2d');
const hudCtx = document.getElementById('hud-canvas').getContext('2d');
const gameWidth = document.getElementById('game-canvas').width;
const gameHeight = document.getElementById('game-canvas').height;
const canvas = document.getElementById('hud-canvas');
let sprites = {};
sprites.alienBoy = document.getElementById('alien-boy');
sprites.alienGirl = document.getElementById('alien-girl'); 
const ctxAudio = new AudioContext();
let missiles = [];
let guns = [];
let particles = [];
const sounds = {};
let timestamp = null;
let gamePhase = 'start';
let wave1;
let missilestoFire;
let hud;
let result;
let tables;
let missilesMax;
let typedTimeStamp = 0;
let currentUser = "rob";

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

class Sound {
    constructor(path) {
        this.path = path;
        this.audioBuffer = null;
        this.load();
    }
async load () {
    const response = await fetch(this.path);
	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await ctxAudio.decodeAudioData(arrayBuffer);
	this.audioBuffer = audioBuffer;
}
play () {
    const trackSource = ctxAudio.createBufferSource();
	trackSource.buffer = this.audioBuffer;
	trackSource.connect(ctxAudio.destination);
	trackSource.start()
}
}

class Fact {
    constructor(obj) {
        this.x = obj.x;
        this.y = obj.y;
        this.bin = obj.bin ?? 0;
        this.lastSeen = obj.lastSeen ?? null;
        this.streak = obj.streak ?? 0;
        this.corrects = obj.corrects ?? 0;
        this.mistakes = obj.mistakes ?? 0;
        this.rnd = Math.random();
    }
    get a () {
        return this.rnd > 0.5 ? this.x : this.y;
    }
    get b () {
        return this.rnd > 0.5 ? this.y : this.x;
    }
    answered (correct) {
        if (correct) {
            this.bin = Math.min(++this.bin, 5);
            this.corrects++;
            this.streak++;
        } else {
            this.bin = 1;
            this.streak = 0;
            this.mistakes++;
        }
        this.lastSeen = new Date();
        this.rnd = Math.random();
        tables.save(currentUser);
    }
}

class Tables {
    constructor () {
        this.facts = [];
        [2,3,5,4,10,6,7,8,9,11,12].forEach( a => {
            for (let b = a; b <= 12; b++ ) {
                this.facts.push(new Fact({x:a, y:b}))
            }
        });
        this.round = [];
        this.current = null;
    }
    createRound () {
        
        this.deck = this.facts.filter(f => f.bin == 1);

        let sorted = []
        for (let i of [0,1,2,3,4,5]) {
            sorted.push(this.facts.filter(f => f.bin == i).sort((a, b) => a.lastSeen - b.lastSeen))
        }

        let binWeights = [  0,0,  2,2,2,2,2,2,2,2,2,2,  3,3,3,3,3,  4,4,  5  ];
        
        while (this.deck.length < 21) {
            
            let targetBin = binWeights[Math.floor(Math.random() * binWeights.length)];
            let f = sorted[targetBin].shift();
           
            if (!f) continue;
            if (f.bin == 0) f.bin = 1;
            this.deck.push(f);
        }

        this.round = this.deck.sort((a,b) => a.rnd - b.rnd);
    }
    next () {
        this.current = this.round.pop();
    }

    save (username) {
        let factExport = JSON.stringify(this.facts.map( f => {
            let ex = {...f};
            delete ex.rnd;
            return ex
        }));
        
        localStorage.setItem(username, factExport);

    }
    load (username) {
        this.facts = JSON.parse(localStorage.getItem(username)).map( f => new Fact(f))
    }

}

class Alien {
    constructor (x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.isDead = false;
        this.sprite = Math.random() > 0.5 ? "alienBoy" : "alienGirl";
    }
    update () {
        this.x += wave1.vx;
        this.y += wave1.vy;
    }

    draw () {
        if (this.isDead) {
            gameCtx.fillStyle = '#331400';
            gameCtx.fillRect(this.x - this.size * 0.5, this.y - this.size * 0.5, this.size, this.size);
        }
        else {
            gameCtx.fillStyle = 'red';
            gameCtx.drawImage(sprites[this.sprite], this.x - this.size * 0.5, this.y - this.size * 0.5, this.size, this.size);
        }
        
    }
}

class Wave {
    constructor(rows, cols, spacing) {
        this.rows = rows;
        this.cols = cols;
        this.spacing = spacing;
        this.vx = 1.0;
        this.nextvx = this.vx;
        this.vy = 0;
        this.aliens = [];
        this.descendCounter = 0;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.aliens.push(new Alien(100 + j * this.spacing, 150 + i * this.spacing, this.spacing - 4))
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
        this.velocity = {x: 2 * (Math.random() - 0.5), y: 0 };
        this.trailLength = 20;
        if (alien) {
            this.target = alien;
            this.target.missile = this;
            this.isDud = false;
        } else {
          this.target = null;
          this.isDud = true;
          this.velocity.y = -3 * Math.random() - 1.5
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
            let accel = 0.2; 
            this.velocity.x += steer.x * accel;
            this.velocity.y += steer.y * accel;
        } else {
            this.velocity.y += 0.02; //gravity
            missiles.filter( m => m.position.y > gameHeight - 50 && !m.hasHitTarget).forEach (m => {
                m.hasHitTarget = true;
                for (let i = 0;i < 6;i++) {
                    particles.push(new Particle(m.position, '#006d12ff'))
                }

            });


        }

        if (!this.isDud && this.distToTarget() < 5) {
            sounds.fire.play();
            this.hasHitTarget = true;
            this.target.isDead = true;
            let liveAliens = wave1.aliens.filter (a => !a.isDead);
            if (liveAliens.length == 0) {
                if (result == 0) {
                    for (let a of wave1.aliens) {
                        setTimeout(() => {
                            for (let i = 0; i<20 ; i++) {
                                let green = Math.floor(Math.random() * 256);
                                let red = Math.floor(Math.random() * 128 + 128);
                                let blue = Math.floor(Math.random() * 128);
                                let alpha = Math.random() * 0.3 + 0.7;
                                particles.push(new Particle({x: a.x, y: a.y}, `rgba(${red}, ${green}, ${blue}, ${alpha})`, 0))
                            }
                            wave1.aliens = wave1.aliens.filter( b => b !== a);
                            }, Math.random() * 300);
                            
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
        let desiredSpeed = 4; 
        let desiredVX = dirX * desiredSpeed;
        let desiredVY = dirY * desiredSpeed;
        return {x: desiredVX - this.velocity.x, y: desiredVY - this.velocity.y};
    }
    draw () {
        gameCtx.fillStyle = 'grey';
        if (!this.hasHitTarget) gameCtx.fillRect(this.position.x - 3, this.position.y - 3, 6, 6);
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
	constructor(position, colour, gravity = 0.02, ) {
		this.position = {x: position.x, y: position.y};
        let theta = Math.random() * 2 * Math.PI;
        let v = Math.random() * 2;
		this.vx = v * Math.sin(theta);
		this.vy = v * Math.cos(theta);
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
        if (this.gravity < 0.08) this.gravity += 0.0002;

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
            sounds.fire = new Sound('sounds/fire.mp3');
            tables = new Tables();
            tables.createRound();
            if (currentUser) {tables.load(currentUser);}

            for (let g = 0; g < 12; g++) {
                guns.push((gameWidth - 100)/12 * g + 50);
                }

            setupHandlers();
            gamePhase = 'spawnWave';
            timestamp = time;
        break;

        case 'spawnWave':
            tables.next();
            if(!tables.current) {
                gamePhase = 'noMoreTables';
                break;}
            wave1 = new Wave(tables.current.a, tables.current.b, 24);
            for (let a of wave1.aliens) {a.draw(); }
            addAnalysisHudElements();
            missilesMax = 150;
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
            tables.current.answered(result == 0)
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
            if (missilestoFire > 0 && time - timestamp > 20) {
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
            break;

            case 'noMoreTables':
                
            break;


    }

    requestAnimationFrame(gameLoop);
} 

requestAnimationFrame(gameLoop);

function randInt(lower, higher) {
    return Math.floor(Math.random() * (higher + 1 - lower) + lower)
}

function addAnalysisHudElements () {

        hud.addElement(300, Infinity, () => {
            if (missilestoFire) hudCtx.fillText(missilestoFire, gameHeight * 0.5, gameHeight - 50);
            hudCtx.strokeRect(50, gameHeight - 30, gameWidth - 250, 10);
            hudCtx.fillRect(50, gameHeight - 30, missilestoFire / missilesMax * (gameWidth - 250), 10 );
            hudCtx.strokeRect(gameWidth - 150, gameHeight - 40, 100, 30);
            hudCtx.fillText("Fire!", gameWidth - 100, gameHeight - 23);
        
        });
            // Flashing rect
         hud.addElement(500, 1500, (dt) => {
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
        hud.addElement(1000, Infinity, (dt) => {
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
        hud.addElement(1500, Infinity, () => {
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