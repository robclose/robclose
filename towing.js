"use strict";

const ctx = document.getElementById('canvas').getContext('2d');
const gameWidth = document.getElementById('canvas').width;
const gameHeight = document.getElementById('canvas').height;
let keys = [];
let train1 = [];

class Car {
    constructor (colour) {
        this.speed = 0.5;
        this.length = 40;
        this.trailerLength = 60;
        this.width = 25;
        this.colour = colour;
        this.frontAxle = new Axle(300, 300, 0, this.width, 0);
        this.rearAxle = new Axle(300 - this.length, 300, 0, this.width, 0);
        this.hitch = this.rearAxle.centre.addVec(10, 0);
    }
    draw () {
        ctx.strokeStyle = this.colour;

         // Draw the car box
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.frontAxle.leftHub.x, this.frontAxle.leftHub.y);
        ctx.lineTo(this.frontAxle.rightHub.x, this.frontAxle.rightHub.y);
        ctx.lineTo(this.rearAxle.rightHub.x, this.rearAxle.rightHub.y);
        ctx.lineTo(this.rearAxle.leftHub.x, this.rearAxle.leftHub.y);
        ctx.lineTo(this.frontAxle.leftHub.x, this.frontAxle.leftHub.y);
        ctx.stroke();
        
        // Draw the car wheels
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(this.frontAxle.leftWheel[0].x, this.frontAxle.leftWheel[0].y );
        ctx.lineTo(this.frontAxle.leftWheel[1].x, this.frontAxle.leftWheel[1].y );
        ctx.moveTo(this.frontAxle.rightWheel[0].x, this.frontAxle.rightWheel[0].y );
        ctx.lineTo(this.frontAxle.rightWheel[1].x, this.frontAxle.rightWheel[1].y );
        ctx.moveTo(this.rearAxle.leftWheel[0].x, this.rearAxle.leftWheel[0].y );
        ctx.lineTo(this.rearAxle.leftWheel[1].x, this.rearAxle.leftWheel[1].y );
        ctx.moveTo(this.rearAxle.rightWheel[0].x, this.rearAxle.rightWheel[0].y );
        ctx.lineTo(this.rearAxle.rightWheel[1].x, this.rearAxle.rightWheel[1].y );
        ctx.strokeStyle = "cornflowerblue";
        ctx.stroke();

    }

    move () {
        this.frontAxle.centre = this.frontAxle.centre.addVec(this.speed, this.frontAxle.theta + this.frontAxle.steering);
        
        let t = Math.atan2(this.rearAxle.centre.y - this.frontAxle.centre.y, 
            this.rearAxle.centre.x - this.frontAxle.centre.x);
        this.rearAxle.theta = t;
        this.frontAxle.theta = t;

        this.rearAxle.centre = this.frontAxle.centre.addVec(this.length, t + Math.PI);
        this.hitch = this.rearAxle.centre.addVec(10, t + Math.PI);
        
        this.frontAxle.steering *= 0.93;
    }

    steerLeft() {
        this.frontAxle.steering = Math.max(this.frontAxle.steering - 0.05, -0.5);
    }
    steerRight() {
        this.frontAxle.steering = Math.min(this.frontAxle.steering + 0.05, 0.5);
    }
}

class Trailer {
    constructor(hitchedTo) {
        this.length = 50;
        this.width = hitchedTo.width;
        this.colour = hitchedTo.colour;
        this.hitchedTo = hitchedTo;
        this.axle = new Axle(hitchedTo.hitch.x - this.length, 300, 0, this.width, 0);
        this.hitch = this.axle.centre.addVec(10, 0);
    }
    move () {
        
        let t = Math.atan2(this.axle.centre.y - this.hitchedTo.hitch.y, 
            this.axle.centre.x - this.hitchedTo.hitch.x);
        this.axle.theta = t;

        this.axle.centre = this.hitchedTo.hitch.addVec(this.length, t + Math.PI);
        this.hitch = this.axle.centre.addVec(10, t + Math.PI);
        
        }
        
        draw () {
        ctx.strokeStyle = this.colour;

        // Draw the trailer box
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.axle.leftHub.x, this.axle.leftHub.y);
        ctx.lineTo(this.axle.rightHub.x, this.axle.rightHub.y);
        ctx.moveTo(this.axle.centre.x, this.axle.centre.y);
        ctx.lineTo(this.hitchedTo.hitch.x, this.hitchedTo.hitch.y);
        ctx.stroke();

        // Draw the car wheels
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(this.axle.leftWheel[0].x, this.axle.leftWheel[0].y );
        ctx.lineTo(this.axle.leftWheel[1].x, this.axle.leftWheel[1].y );
        ctx.moveTo(this.axle.rightWheel[0].x, this.axle.rightWheel[0].y );
        ctx.lineTo(this.axle.rightWheel[1].x, this.axle.rightWheel[1].y );
        ctx.strokeStyle = "cornflowerblue";
        ctx.stroke();

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

class Axle {
    constructor(x, y, theta, width, steering = 0) {
        this.centre = new Pos (x, y);
        this.theta = theta;
        this.steering = steering;
        this.offset = width * 0.5;
    }
    get leftHub () {
        return this.centre.addVec(this.offset, this.theta - Math.PI * 0.5);
    }
    get rightHub () {
        return this.centre.addVec(this.offset, this.theta + Math.PI * 0.5);
    }
    get leftWheel () {
        return [this.leftHub.addVec(8, this.theta + this.steering),
                this.leftHub.addVec(-8, this.theta + this.steering)];
    }
    get rightWheel () {
        return [this.rightHub.addVec(8, this.theta + this.steering),
                this.rightHub.addVec(-8, this.theta + this.steering)];
    }

}


function gameLoop() {

    ctx.clearRect(0 ,0, gameWidth, gameHeight);
    train1.forEach( v => v.move());
    train1.forEach( v => v.draw());

    if (keys.includes('a')) { train1[0].steerLeft(); }
    else if (keys.includes('d')) { train1[0].steerRight(); }

    if (keys.includes('w')) {
        train1[0].speed = Math.min(train1[0].speed + 0.1, 5);
    }
      else if (keys.includes('s')) {
        train1[0].speed = Math.max(train1[0].speed - 0.1, -5);
    }
  
    requestAnimationFrame(gameLoop);
}


train1.push(new Car('red') );
train1.push(new Trailer(train1[train1.length - 1]));
train1.push(new Trailer(train1[train1.length - 1]));
train1.push(new Trailer(train1[train1.length - 1]));
train1.push(new Trailer(train1[train1.length - 1]));
train1.push(new Trailer(train1[train1.length - 1]));
requestAnimationFrame(gameLoop);

window.addEventListener('keydown', (e) => {
    if (!keys.includes(e.key)) keys.push(e.key);
});

window.addEventListener('keyup', (e) => {
    keys = keys.filter( (k) => e.key !== k);
});