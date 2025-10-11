"use strict";

const ctx = document.getElementById('canvas').getContext('2d');
const gameWidth = document.getElementById('canvas').width;
const gameHeight = document.getElementById('canvas').height;
let keys = [];

class Car {
    constructor (colour) {
        this.frontwheel = {x: 100 + Math.random() * 300, y: 100 + Math.random() * 200};
        this.backwheel = {x:0, y:0};
        this.steering = 0;
        this.speed = 0.5;
        this.length = 30;
        this.width = 18;
        this.colour = colour;
    }
    draw () {
        ctx.fillStyle = this.colour;
        for (let i of this.corners) {
            ctx.fillRect(i.x - 4, i.y - 4, 8, 8);
        }
    }
    get theta () {
        return Math.atan2(this.backwheel.y - this.frontwheel.y, 
            this.backwheel.x - this.frontwheel.x);
    }
    move () {
        let heading = new Vec(this.speed, this.theta + this.steering);
        this.frontwheel = heading.add(this.frontwheel);

        let v = new Vec(this.length, this.theta + Math.PI);
        this.backwheel = v.add(this.frontwheel);

        this.steering *= 0.93;
    }
    get corners () {
        let a = this.theta;
        let left = new Vec(this.width * 0.5, a - Math.PI * 0.5);
        let right = new Vec(this.width * 0.5, a + Math.PI * 0.5);
        return [
            left.add(this.frontwheel),
            right.add(this.frontwheel),
            left.add(this.backwheel),
            right.add(this.backwheel)
        ]
    }
    steerLeft() {
        this.steering = Math.max(this.steering - 0.05, -0.5);
    }
    steerRight() {
        this.steering = Math.min(this.steering + 0.05, 0.5);
    }
}

class Vec {
    constructor (h, theta) {
    this.x = h * -Math.cos(theta);
    this.y = h * -Math.sin(theta);
    }
    add (v) {
        return {x: this.x + v.x, y: this.y + v.y}
    }
}

function gameLoop() {

    ctx.clearRect(0 ,0, gameWidth, gameHeight);
    car1.move();
    car1.draw();

    car2.move();
    car2.draw();
    
    if (keys.includes('a')) { car1.steerLeft(); }
    else if (keys.includes('d')) { car1.steerRight(); }

    if (keys.includes('w')) {
        car1.speed = Math.min(car1.speed + 0.1, 5);
    }
      else if (keys.includes('s')) {
        car1.speed = Math.max(car1.speed - 0.1, -5);
    }

    if (keys.includes('ArrowLeft')) { car2.steerLeft(); }
    else if (keys.includes('ArrowRight')) { car2.steerRight(); }

    if (keys.includes('ArrowUp')) {
        car2.speed = Math.min(car2.speed + 0.1, 5);
    }
      else if (keys.includes('ArrowDown')) {
        car2.speed = Math.max(car2.speed - 0.1, -5);
    }
  
    requestAnimationFrame(gameLoop);
}

let car1 = new Car('red');
let car2 = new Car('dodgerblue');
requestAnimationFrame(gameLoop);

window.addEventListener('keydown', (e) => {
    if (!keys.includes(e.key)) keys.push(e.key);
});

window.addEventListener('keyup', (e) => {
    keys = keys.filter( (k) => e.key !== k);
});