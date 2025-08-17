"use strict";

const bgCtx = document.getElementById('bg-canvas').getContext('2d');
const gameCtx = document.getElementById('game-canvas').getContext('2d');
const hudCtx = document.getElementById('hud-canvas').getContext('2d');
const gameWidth = document.getElementById('game-canvas').width;
const gameHeight = document.getElementById('game-canvas').height;
let missiles = [];
let guns = [];
let timestamp = null;
let gamePhase = 'start';
let wave1;
let missilestoFire;
let hud;

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
    }
    update () {
        this.x += wave1.vx;
        this.y += wave1.vy;
    }

    draw () {
        gameCtx.fillStyle = 'red';
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
        this.velocity = {x: 0, y: 0};
        this.trailLength = 20;
        if (alien) {
            this.target = alien;
            this.target.missile = this;
        } else {
          this.target = {x: randInt(wave1.leftmost, wave1.rightmost), 
                        y: randInt(wave1.topmost, wave1.bottommost)};
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
        let steer = this.steerVector();
        let accel = 0.1; 
        this.velocity.x += steer.x * accel + 2 * (Math.random() - 0.5);
        this.velocity.y += steer.y * accel + 2 * (Math.random() - 0.5);

        if (this.distToTarget() < 5 && this.target.size) {
            this.hasHitTarget = true;
            wave1.aliens = wave1.aliens.filter (a => a !== this.target);
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
        if (!this.hasHitTarget) gameCtx.fillRect(this.position.x, this.position.y, 4, 4);
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

function gameLoop(time) {

    hudCtx.clearRect(0,0,gameWidth, gameHeight);
    gameCtx.clearRect(0,0,gameWidth, gameHeight);

    switch (gamePhase) {

        case 'start':
             hud = new HUD();
            for (let g = 0; g < 12; g++) {
                guns.push((gameWidth - 100)/12 * g + 50);
                }
            gamePhase = 'spawnWave';
            timestamp = time;
        break;

        case 'spawnWave':
            wave1 = new Wave(Math.floor(Math.random() * 10) + 2,Math.floor(Math.random() * 10) + 2);
            for (let a of wave1.aliens) {a.draw(); }
            addAnalysisHudElements();
            gamePhase = 'analysis'; 
            timestamp = time;
        break;

        case 'analysis':
            for (let a of wave1.aliens) {a.update(); }
            for (let a of wave1.aliens) {a.draw(); }
            wave1.update();
            hud.draw(time - timestamp);
            if (time - timestamp > 10 * 1000) {gamePhase = 'playerChooses'}
            break;

        case 'playerChooses':
            hud.elements.length = 0;
            missilestoFire = prompt('How many missiles?');
            timestamp = time;
            gamePhase = 'firing';
            break;

        case 'firing':
                if (wave1.aliens.length == 0 && missiles.filter( m => !m.hasHitTarget).length == 0) {
                gamePhase = 'end'
                timestamp = time
                hud.addElement(0, 3000, (dt) => {
                    hudCtx.fillText("You saved planet Earth!!", gameWidth * 0.5, gameHeight * 0.5)
                });
            }
            else if (wave1.aliens.length == 0 && missiles.filter( m => !m.hasHitTarget).length > 0) {
                gamePhase = 'end'
                timestamp = time
                hud.addElement(0, 3000, (dt) => {
                    hudCtx.fillText("Stray missiles destroy the Earth!!", gameWidth * 0.5, gameHeight * 0.5)
                });
            }
            else if (wave1.aliens.length > 0 && missiles.length == 0 && missilestoFire == 0) {
                gamePhase = 'end'
                timestamp = time
                hud.addElement(0, 3000, (dt) => {
                    hudCtx.fillText(`${wave1.aliens.length} aliens survived to invade the Earth!!`, gameWidth * 0.5, gameHeight * 0.5)
                });
            }
            for (let a of wave1.aliens) {a.update(); }
            for (let a of wave1.aliens) {a.draw(); }
            for (let m of missiles) {m.update();}
            for (let m of missiles) {m.draw();}
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
                wave1.update(); 
                if (time - timestamp > 5000) {gamePhase = 'spawnWave'}

    }

    requestAnimationFrame(gameLoop);
} 


requestAnimationFrame(gameLoop);

let codeScroll = [
'0x7C11 11001001  vector<aliens> fleet_matrix[rows][columns]',
'0xFF02 00011101  formation=GRIDLOCK  integrity=0x3E',
'0xAC34 10100011  anomaly_detected? analysis::pending',
'0x3D77 11101000  calc(rows*columns)=0b01100000',
'0x84F1 01011110  aliens.position[x,y] => formation.align()',
'0x920C 10011001  analysis_subroutine(rows, columns)',
'0x4B5E 11100110  fleet_density=0x7A  formation: STABLE',
'0x1F22 10110011  alien formation: EXPANDING',
'0xA442 01011001  analysis: recalibrate_vectors()',
'0x39B0 11101100  aliens.signal[rows][columns] = ACTIVE',
'0x4E92 00110011  formation.checksum=0x9F  status=VALID',
'0x9B20 10110101  analysis -> status: INCOMPLETE',
'0x7C11 11001001  vector<aliens> fleet_matrix[rows][columns]',
'0xFF02 00011101  formation=GRIDLOCK  integrity=0x3E',
'0xAC34 10100011  anomaly_detected? analysis::pending',
'0x920C 10011001  analysis_subroutine(rows, columns)',
'0x4B5E 11100110  fleet_density=0x7A  formation: STABLE'
]

function randInt(lower, higher) {
    return Math.floor(Math.random() * (higher + 1 - lower) + lower)
}

function addAnalysisHudElements () {
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

        //Scrolling text
        hud.addElement(1500, 4200, (dt) => {
            hudCtx.textAlign = "left"	;
            hudCtx.font = "20px monospace";
            hudCtx.fillText('Analysing alien formation...', 50, 430);
            hudCtx.font = "8px monospace";
            const endOfScroll = 2000;
            const scrollSpeed = 50;
            const linesPassed = Math.floor(dt / scrollSpeed);
            let linesErased = 0;
            if (dt > endOfScroll) {
                linesErased = Math.floor((dt - endOfScroll) / scrollSpeed);
            }
            for (let i = 0; i < codeScroll.length - linesErased; i++) {
                const idx = (i + linesPassed) % codeScroll.length;
                hudCtx.fillText(codeScroll[idx], 50, 450 + i * 9);
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