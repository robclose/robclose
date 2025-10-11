"use strict";

const ctx = document.getElementById('canvas').getContext('2d');
const gameWidth = document.getElementById('canvas').width;
const gameHeight = document.getElementById('canvas').height;
let keys = [];

class Car {
    constructor (colour) {
        this.frontwheel = new Pos(300, 300);
        this.steering = 0;
        this.speed = 0.5;
        this.length = 40;
        this.trailerLength = 80;
        this.backwheel = this.frontwheel.addVec(this.length, 0);
        this.hitch = this.backwheel.addVec(20, 0);
        this.trailerWheel = this.backwheel.addVec(this.trailerLength, 0);
        this.width = 25;
        this.colour = colour;
    }
    draw () {
        ctx.strokeStyle = this.colour;

        const w = this.wheels;
        const t = this.carAngle;
        const t2 = this.trailerAngle;

         // Draw the car box
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w.leftFront.x, w.leftFront.y);
        ctx.lineTo(w.rightFront.x, w.rightFront.y);
        ctx.lineTo(w.rightRear.x, w.rightRear.y);
        ctx.lineTo(w.leftRear.x, w.leftRear.y);
        ctx.lineTo(w.leftFront.x, w.leftFront.y);
        ctx.moveTo(w.leftTrailer.x, w.leftTrailer.y);
        ctx.lineTo(w.rightTrailer.x, w.rightTrailer.y);
        ctx.moveTo(this.trailerWheel.x, this.trailerWheel.y);
        ctx.lineTo(this.hitch.x, this.hitch.y);
        ctx.stroke();

        

        let lf1 = w.leftFront.addVec(8, t + this.steering);
        let lf2 = w.leftFront.addVec(-8, t + this.steering);

        let rf1 = w.rightFront.addVec(8, t + this.steering);
        let rf2 = w.rightFront.addVec(-8, t + this.steering);

        let lr1 = w.leftRear.addVec(8, t);
        let lr2 = w.leftRear.addVec(-8, t);

        let rr1 = w.rightRear.addVec(8, t);
        let rr2 = w.rightRear.addVec(-8, t);

        let lt1 = w.leftTrailer.addVec(8, t2);
        let lt2 = w.leftTrailer.addVec(-8, t2);

        let rt1 = w.rightTrailer.addVec(8, t2);
        let rt2 = w.rightTrailer.addVec(-8, t2);
        
        
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(lf1.x, lf1.y);
        ctx.lineTo(lf2.x, lf2.y);
        ctx.moveTo(rf1.x, rf1.y);
        ctx.lineTo(rf2.x, rf2.y);
        ctx.moveTo(lr1.x, lr1.y);
        ctx.lineTo(lr2.x, lr2.y);
        ctx.moveTo(rr1.x, rr1.y);
        ctx.lineTo(rr2.x, rr2.y);
        ctx.moveTo(lt1.x, lt1.y);
        ctx.lineTo(lt2.x, lt2.y);
        ctx.moveTo(rt1.x, rt1.y);
        ctx.lineTo(rt2.x, rt2.y);
        ctx.strokeStyle = "cornflowerblue";
        ctx.stroke();

    }
    get carAngle () {
        return Math.atan2(this.backwheel.y - this.frontwheel.y, 
            this.backwheel.x - this.frontwheel.x);
    }
    get trailerAngle () {
        return Math.atan2(this.trailerWheel.y - this.hitch.y, 
            this.trailerWheel.x - this.hitch.x);
    }
    move () {
        this.frontwheel = this.frontwheel.addVec(this.speed, this.carAngle + this.steering);
        this.backwheel = this.frontwheel.addVec(this.length, this.carAngle + Math.PI);
        this.hitch = this.backwheel.addVec(20, this.carAngle + Math.PI);
        this.trailerWheel = this.hitch.addVec(this.trailerLength, this.trailerAngle + Math.PI);

        this.steering *= 0.93;
    }
    get wheels () {
        let a = this.carAngle;
        let a2 = this.trailerAngle
        return {
            leftFront: this.frontwheel.addVec(this.width * 0.5, a - Math.PI * 0.5),
            rightFront: this.frontwheel.addVec(this.width * 0.5, a + Math.PI * 0.5),
            leftRear: this.backwheel.addVec(this.width * 0.5, a - Math.PI * 0.5),
            rightRear: this.backwheel.addVec(this.width * 0.5, a + Math.PI * 0.5),
            leftTrailer: this.trailerWheel.addVec(this.width * 0.5, a2 - Math.PI * 0.5),
            rightTrailer: this.trailerWheel.addVec(this.width * 0.5, a2 + Math.PI * 0.5),
        }
    }
    steerLeft() {
        this.steering = Math.max(this.steering - 0.05, -0.5);
    }
    steerRight() {
        this.steering = Math.min(this.steering + 0.05, 0.5);
    }
}

class Pos {
    constructor (x, y) {
        this.x = x;
        this.y = y;
    }
    addVec(length, theta) {
        return new Pos(this.x + length * -Math.cos(theta),
                        this.y + length * -Math.sin(theta));
    }

}

function gameLoop() {

    ctx.clearRect(0 ,0, gameWidth, gameHeight);
    car1.move();
    car1.draw();

    if (keys.includes('a')) { car1.steerLeft(); }
    else if (keys.includes('d')) { car1.steerRight(); }

    if (keys.includes('w')) {
        car1.speed = Math.min(car1.speed + 0.1, 5);
    }
      else if (keys.includes('s')) {
        car1.speed = Math.max(car1.speed - 0.1, -5);
    }
  
    requestAnimationFrame(gameLoop);
}

let car1 = new Car('red');
requestAnimationFrame(gameLoop);

window.addEventListener('keydown', (e) => {
    if (!keys.includes(e.key)) keys.push(e.key);
});

window.addEventListener('keyup', (e) => {
    keys = keys.filter( (k) => e.key !== k);
});