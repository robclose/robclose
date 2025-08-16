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
    drawAnalysis (timeElapsed) {
        hudCtx.fillStyle = 'skyblue';
        hudCtx.strokeStyle = 'skyblue';
        hudCtx.textAlign = "center"	;
        hudCtx.textBaseline = "middle";
        hudCtx.font = "20px monospace";
        let leftmost = wave1.aliens[0].x;
        let rightmost = wave1.aliens[wave1.cols - 1].x;
        let topmost = wave1.aliens[0].y;
        let bottommost = wave1.aliens[wave1.aliens.length - 1].y;
        if (timeElapsed < 2500) {
            hudCtx.fillText('Analysing alien formation...', gameWidth * 0.5, gameHeight * 0.1); 
            }
        if (timeElapsed > 1000){
            // Column ticks
            for (let c = 0; c < wave1.cols; c++) {
                hudCtx.beginPath();
                hudCtx.moveTo(wave1.aliens[c].x, topmost - 15);
                hudCtx.lineTo(wave1.aliens[c].x, topmost - 20);
                hudCtx.stroke();
            }   
            // Column tick joiner
            hudCtx.beginPath();
                hudCtx.moveTo(leftmost, topmost - 20);
                hudCtx.lineTo(rightmost, topmost - 20);
                hudCtx.stroke();
            // Row ticks
            for (let r = 0; r < wave1.rows; r++) {
                hudCtx.beginPath();
                hudCtx.moveTo(leftmost - 15, wave1.aliens[r * wave1.cols + 1].y);
                hudCtx.lineTo(leftmost - 20, wave1.aliens[r * wave1.cols + 1].y);
                hudCtx.stroke();
            }  
            // Row tick joiner
            hudCtx.beginPath();
                hudCtx.moveTo(leftmost - 20, topmost);
                hudCtx.lineTo(leftmost - 20, bottommost);
                hudCtx.stroke();

            }
        if (timeElapsed > 2000) {
            let middleX = leftmost + 0.5 * (rightmost - leftmost);
            let middleY = topmost + 0.5 * (bottommost - topmost);
            hudCtx.fillText(wave1.rows, leftmost - 40, middleY );
            hudCtx.fillText(wave1.cols, middleX, topmost - 40);
            

        }
    }
}

class Alien {
    constructor (x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.vx = 0.5;
        this.vy = 0;
    }
    update () {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x >= 750 || this.x <= 50) {this.vx = -this.vx}
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
        this.aliens = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.aliens.push(new Alien(100 + j * 15, 150 + i * 15))
            }
        }
    }
}

class Missile {
    constructor (alien, x) {
        this.trail = [];
        this.position = {x: x, y: gameHeight - 50 };
        this.velocity = {x: 0, y: 0};
        this.trailLength = 20;
        this.target = alien;
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

        if (this.distToTarget() < 5) {
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
        break;

        case 'spawnWave':
            wave1 = new Wave(Math.floor(Math.random() * 10) + 2,Math.floor(Math.random() * 10) + 2);
            for (let a of wave1.aliens) {a.draw(); }
            gamePhase = 'analysis';
            timestamp = time;
        break;

        case 'analysis':
            
            for (let a of wave1.aliens) {a.update(); }
            for (let a of wave1.aliens) {a.draw(); }
            hud.drawAnalysis(time - timestamp);
            if (time - timestamp > 10 * 1000) {gamePhase = 'playerChooses'}
            break;

        case 'playerChooses':
            missilestoFire = wave1.aliens.length;
            timestamp = time;
            gamePhase = 'firing';
            break;

        case 'firing':
            for (let a of wave1.aliens) {a.update(); }
            for (let a of wave1.aliens) {a.draw(); }
            for (let m of missiles) {m.update();}
            for (let m of missiles) {m.draw();}

            if (missilestoFire > 0 && time - timestamp > 50) {
                timestamp = time;
                missilestoFire--;
                missiles.push(new Missile(wave1.aliens[missilestoFire], guns[Math.floor(Math.random() * 12)]));
            }

            if (wave1.aliens.length == 0) {gamePhase = 'spawnWave'}
            break;

    }

    requestAnimationFrame(gameLoop);
} 


requestAnimationFrame(gameLoop);