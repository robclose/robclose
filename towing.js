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
        const fl = iso(this.frontAxle.leftHub);
        const fr = iso(this.frontAxle.rightHub);
        const rl = iso(this.rearAxle.leftHub);
        const rr = iso(this.rearAxle.rightHub);
        const fc = iso(this.frontAxle.centre);
        const rc = iso(this.rearAxle.centre);

        ctx.moveTo(fl.x, fl.y);
        ctx.lineTo(fr.x, fr.y);
        ctx.moveTo(rl.x, rl.y);
        ctx.lineTo(rr.x, rr.y);
        ctx.moveTo(fc.x, fc.y);
        ctx.lineTo(rc.x, rc.y);
        ctx.stroke();
        
        // Draw the car wheels
        // ctx.lineWidth = 6;
        // ctx.beginPath();
        // ['frontAxle', 'rearAxle'].forEach( a => {
        //     ['leftWheel', 'rightWheel'].forEach( w => {
        //         const wheel = this[a][w];
        //         const isoW1 = iso(wheel[0]);
        //         const isoW2 = iso(wheel[1]);
        //         ctx.moveTo(isoW1.x, isoW1.y);
        //         ctx.lineTo(isoW2.x, isoW2.y);
        //     });
        // });
        ['frontAxle', 'rearAxle'].forEach( a => {
            ['leftHub', 'rightHub'].forEach( h => {
                const hub = this[a][h];
                drawTyre(hub, 10, 10, this[a].theta + this[a].steering + Math.PI * 0.25);
            });
        });

        // ctx.strokeStyle = "cornflowerblue";
        // ctx.stroke();

    }

    move () {
        this.frontAxle.centre = this.frontAxle.centre.addVec(this.speed, this.frontAxle.theta + this.frontAxle.steering);
        
        let t = this.rearAxle.centre.getAngleTo(this.frontAxle.centre);
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
        this.colour = 'orange';
        this.hitchedTo = hitchedTo;
        this.axle = new Axle(hitchedTo.hitch.x - this.length, 300, 0, this.width, 0);
        this.hitch = this.axle.centre.addVec(10, 0);
    }
    move () {
        
        let t = this.axle.centre.getAngleTo(this.hitchedTo.hitch);
        this.axle.theta = t;

        this.axle.centre = this.hitchedTo.hitch.addVec(this.length, t + Math.PI);
        this.hitch = this.axle.centre.addVec(10, t + Math.PI);
        
        }
        
        draw () {
        ctx.strokeStyle = this.colour;

        // Draw the trailer box
        ctx.lineWidth = 3;
        const l = iso(this.axle.leftHub);
        const r = iso(this.axle.rightHub);
        const c = iso(this.axle.centre);
        const h = iso(this.hitchedTo.hitch);

        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(r.x, r.y);
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(h.x, h.y);
        ctx.stroke();

        // Draw the car wheels
        // ctx.lineWidth = 6;
        // ctx.beginPath();
        // ctx.moveTo(this.axle.leftWheel[0].x, this.axle.leftWheel[0].y );
        // ctx.lineTo(this.axle.leftWheel[1].x, this.axle.leftWheel[1].y );
        // ctx.moveTo(this.axle.rightWheel[0].x, this.axle.rightWheel[0].y );
        // ctx.lineTo(this.axle.rightWheel[1].x, this.axle.rightWheel[1].y );
        // ctx.strokeStyle = "cornflowerblue";
        // ctx.stroke();

         ['leftHub', 'rightHub'].forEach( h => {
                const hub = this.axle[h];
                drawTyre(hub, 10, 10, this.axle.theta + this.axle.steering + Math.PI * 0.25);
            });

    }
}

class Pos {
    constructor (x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    addVec(length, theta) {
        return new Pos(this.x + length * -Math.cos(theta),
                        this.y + length * -Math.sin(theta));
    }
    getAngleTo(pos) {
        return Math.atan2(this.y - pos.y, 
            this.x - pos.x);
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

function iso(pos, scaleX = 1, scaleY = 0.5, scaleZ = 1) {
  const sx = (pos.x - pos.y) * scaleX;
  const sy = (pos.x + pos.y) * scaleY - pos.z * scaleZ;
  return { x: sx, y: sy };
}

function drawTyre(pos, radius, width, rotation) {
  // Compute screen position of the tyre center
  const { x: sx, y: sy } = iso(pos);

  ctx.save();
  ctx.translate(sx, sy);

  // The tyre faces sideways in isometric space, so we rotate it around Z
  ctx.rotate(rotation);

  // Apply the isometric horizontal squish (simulate perspective)
  ctx.scale(1, 0.5);

  // Draw ellipse (wheel face)
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Optional: inner circle (hub)
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.4, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
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
requestAnimationFrame(gameLoop);

window.addEventListener('keydown', (e) => {
    if (e.key == 'q') {
        train1.push(new Trailer(train1[train1.length - 1]));
    }
    else if (!keys.includes(e.key)) keys.push(e.key);
});

window.addEventListener('keyup', (e) => {
    keys = keys.filter( (k) => e.key !== k);
});