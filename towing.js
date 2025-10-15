"use strict";

const ctx = document.getElementById('canvas').getContext('2d');
const gameWidth = document.getElementById('canvas').width;
const gameHeight = document.getElementById('canvas').height;
const gridSize = 30;
let keys = [];
let train1 = [];
let terrain = {
    arr: [],
    z: function (x, y) {
        let grid = [Math.floor(x/gridSize), Math.ceil(x/gridSize),
                    Math.floor(y/gridSize), Math.ceil(y/gridSize)];
        let mod = grid.map ( g => {
            let m = g % this.arr[0].length;
            if (m < 0) m += this.arr[0].length;
            return m;
        });
        let heights = []
        heights[0] = this.arr[mod[0]][mod[2]]; 
        heights[1] = this.arr[mod[1]][mod[2]]; 
        heights[2] = this.arr[mod[0]][mod[3]]; 
        heights[3] = this.arr[mod[1]][mod[3]];

        const tx = x / gridSize - grid[0];
        const ty = y / gridSize - grid[2];

        const a = heights[0] * (1 - tx) + heights[1] * tx;
        const b = heights[2] * (1 - tx) + heights[3] * tx;

        return 10 *( a * (1 - ty) + b * ty);

    },
    gen: function (w, h, numHills) {
    const map = Array.from({ length: h }, () => Array(w).fill(0));

    for (let i = 0; i < numHills; i++) {
        const cx = Math.random() * w;
        const cy = Math.random() * h;
        const r = Math.random() * 8 + 4;
        const hgt = Math.random() * 12 - 5;  // can be hill or valley

        // apply to all nearby grid cells, wrapping around edges
        for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let dx = Math.abs(x - cx);
            let dy = Math.abs(y - cy);
            if (dx > w / 2) dx = w - dx;
            if (dy > h / 2) dy = h - dy;

            const d = Math.sqrt(dx*dx + dy*dy);
            if (d < r) {
            map[y][x] += hgt * (1 - d / r);
            }
        }
    }
  }
    this.arr = map;
}
}
const roadMap = { arr: [
[0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
[0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
[0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
[0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,0,0,0],
[0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1,1,1,1,1,0,0],
[1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1],
[1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0]
],
isRoad: function (x, y) {
            let m = x % this.arr[0].length;
            if (m < 0) m += this.arr[0].length;
            let n = y % this.arr[0].length;
            if (n < 0) n += this.arr[0].length;
            return !!this.arr[m][n];
        }
    
}
const map = {
    draw: function () {
        // Calculate the range of the grid visible on screen
        const gridStartX = (Math.floor(map.follow.coords.x / gridSize) - 660/gridSize);
        const gridEndX = (Math.floor(map.follow.coords.x / gridSize) + 660/gridSize);
        const gridStartY = (Math.floor(map.follow.coords.y / gridSize) - 660/gridSize);
        const gridEndY = (Math.floor(map.follow.coords.y / gridSize) + 660/gridSize);

        for (let i = gridStartX ; i <= gridEndX ; i++) {
            for (let j = gridStartY; j <= gridEndY ; j++) {
                let alpha;
                let colour;
                (i+j) % 2 == 0 ? alpha = '90%' : alpha = '100%' ;
                ctx.beginPath();
                const x0 = i * gridSize;
                const x1 = (i + 1) * gridSize;
                const y0 = j * gridSize;
                const y1 = (j + 1) * gridSize;
                let z = [terrain.z(x0, y0),
                    terrain.z(x1, y0),
                    terrain.z(x1, y1),
                    terrain.z(x0, y1)];
                z = z.map ( z0 => Math.max(z0, -40));
                   

            colour = `${Math.floor(180 - z[0] * 0.8)} 70% ${Math.floor(50 + z[0] * 0.1)}%`;
            if (roadMap.isRoad(i, j) && Math.min(...z) > -40) {
                colour = '50 5% 70%';
            }


            ctx.fillStyle = `hsl(${colour} / ${alpha})`;
                // Draw a 4 sided shape for each grid square
                new Pos(x0, y0, z[0]).moveToIso();
                new Pos(x1, y0, z[1]).lineToIso();
                new Pos(x1, y1, z[2]).lineToIso();
                new Pos(x0, y1, z[3]).lineToIso();
                ctx.closePath();
                ctx.fill();
            }
        }
    },
    follow: null
}

class Car {
    constructor (colour) {
        this.speed = 0.5;
        this.length = 40;
        this.trailerLength = 60;
        this.width = 25;
        this.colour = colour;
        this.frontAxle = new Axle(300, 300, 0, this.width, 0);
        this.rearAxle = new Axle(300 - this.length, 300, 0, this.width, 0);
        this.hitch = this.rearAxle.centre.addVec(5, 0);
    }
    get coords () {
        return this.frontAxle.centre;
    }
    draw () {
        
        const t = this.rearAxle.theta;
        const t2 = this.rearAxle.theta2;
        
        ctx.strokeStyle = this.colour;

         // Draw the car axles
        ctx.lineWidth = 3;
        ctx.beginPath();
        this.frontAxle.leftHub.moveToIso();
        this.frontAxle.rightHub.lineToIso();
        this.rearAxle.leftHub.moveToIso();
        this.rearAxle.rightHub.lineToIso();
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.beginPath();
        this.frontAxle.centre.moveToIso();
        this.hitch.lineToIso();
        this.rearAxle.centre.addVec3(15, t, t2 - Math.PI * 0.8).lineToIso();
        this.rearAxle.leftHub.addVec3(15, t, t2 - Math.PI * 0.8).moveToIso();
        this.rearAxle.rightHub.addVec3(15, t, t2 - Math.PI * 0.8).lineToIso();

        ctx.stroke();
        
        ['frontAxle', 'rearAxle'].forEach( a => {
            ['leftHub', 'rightHub'].forEach( h => {
                const hub = this[a][h];
                drawWheel(hub.x, hub.y, hub.z, 8, this[a].theta + this[a].steering + Math.PI * 0.5, this.colour);
            });
        });

    }

    move () {
        this.frontAxle.centre = this.frontAxle.centre.addVec(this.speed, this.frontAxle.theta + this.frontAxle.steering);
        this.frontAxle.ground();
        let t = this.rearAxle.centre.getAngleTo(this.frontAxle.centre);
        
        this.rearAxle.theta = t;
        this.frontAxle.theta = t;

        this.rearAxle.centre = this.frontAxle.centre.addVec(this.length, t + Math.PI);
        this.rearAxle.ground();
        this.rearAxle.theta2 = this.rearAxle.centre.getVertAngleTo(this.frontAxle.centre);
        this.hitch = this.rearAxle.centre.addVec3(-10, t, this.rearAxle.theta2);
        
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
    constructor(hitchedTo, colour) {
        this.length = 50;
        this.width = hitchedTo.width;
        this.colour = colour;
        this.hitchedTo = hitchedTo;
        this.axle = new Axle(hitchedTo.hitch.x - this.length, 300, 0, this.width, 0);
        this.hitch = this.axle.centre.addVec(10, 0);
    }
    move () {
        
        let t = this.axle.centre.getAngleTo(this.hitchedTo.hitch);
        let t2 = this.axle.centre.getVertAngleTo(this.hitchedTo.hitch);
        this.axle.theta = t;
        this.axle.theta2 = t2;

        this.axle.centre = this.hitchedTo.hitch.addVec(this.length, t + Math.PI);
        this.axle.ground();
        this.hitch = this.axle.centre.addVec3(-30, t, t2);
        
        }
        
        draw () {
        const t = this.axle.theta;
        const t2 = this.axle.theta2;

        // Cuboid corners
        const blf = this.axle.leftHub.addVec3(30, t, t2);
        const brf = this.axle.rightHub.addVec3(30, t, t2);
        const blr = this.axle.leftHub.addVec3(-30, t, t2);
        const brr = this.axle.rightHub.addVec3(-30, t, t2);
        const tlr = blr.addVec3(25, t, t2 - Math.PI * 0.5);
        const trr = brr.addVec3(25, t, t2 - Math.PI * 0.5);
        const tlf = blf.addVec3(25, t, t2 - Math.PI * 0.5);
        const trf = brf.addVec3(25, t, t2 - Math.PI * 0.5);

        // Wheelarches
        const wlf = this.axle.leftHub.addVec3(8, t, t2);
        const wlr = this.axle.leftHub.addVec3(-8, t, t2);
        const wrf = this.axle.rightHub.addVec3(8, t, t2);
        const wrr = this.axle.rightHub.addVec3(-8, t, t2);
        
        // Draw the trailer box
        ctx.strokeStyle = this.colour;
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Axle
        this.axle.leftHub.moveToIso()
        this.axle.rightHub.lineToIso()
        // Base
        brf.moveToIso();
        blf.lineToIso();
        wlf.lineToIso();
        wlr.moveToIso();
        blr.lineToIso();
        brr.lineToIso();
        wrr.lineToIso();
        wrf.moveToIso();
        brf.lineToIso();
        
        // Uprights
        blr.moveToIso();
        tlr.lineToIso();
        tlf.lineToIso();
        blf.lineToIso();

        brr.moveToIso();
        trr.lineToIso();
        trf.lineToIso();
        brf.lineToIso();

        tlf.moveToIso();
        trf.lineToIso();
        
        tlr.moveToIso();
        trr.lineToIso();

        // Tow bar
        this.axle.centre.addVec3(30, t, t2).moveToIso()
        this.hitchedTo.hitch.lineToIso()
        ctx.stroke();

         ['leftHub', 'rightHub'].forEach( h => {
                const hub = this.axle[h];
                drawWheel(hub.x, hub.y, hub.z, 8, this.axle.theta + Math.PI * 0.5, this.colour);
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
                        this.y + length * -Math.sin(theta),
                        this.z);
    }
    addVec3(length, theta1, theta2) {
        return new Pos(this.x + length * -Math.cos(theta1) * Math.cos(theta2),
                        this.y + length * -Math.sin(theta1) * Math.cos(theta2),
                        this.z + length * -Math.sin(theta2));
    }
    getAngleTo(pos) {
        return Math.atan2(this.y - pos.y, 
            this.x - pos.x);
    }
    getVertAngleTo (pos) {
        return Math.atan2(this.z - pos.z, 
            Math.hypot(this.x - pos.x,this.y - pos.y));
    }
    toIso () {
        const x = this.x - map.follow.coords.x + 250;
        const y = this.y - map.follow.coords.y + 250;
        const sx = (x - y);
        const sy = (x + y) * 0.5 * 1.0 - this.z;
        return { x: sx + 500, y: sy + 100 };
    }
    moveToIso () {
        const isoPos = this.toIso();
        ctx.moveTo(isoPos.x, isoPos.y);
    }
    lineToIso () {
        const isoPos = this.toIso();
        ctx.lineTo(isoPos.x, isoPos.y);
    }

}

class Axle {
    constructor(x, y, theta, width, steering = 0) {
        this.centre = new Pos (x, y);
        this.theta = theta;
        this.theta2 = 0;
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
    ground () {
        this.centre.z = terrain.z(this.centre.x, this.centre.y);
    }

}

function gameLoop() {

    ctx.clearRect(0 ,0, gameWidth, gameHeight);
    map.draw();
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

train1.push(new Car('firebrick') );
terrain.gen(30, 30, 30);

map.follow = train1[0];
requestAnimationFrame(gameLoop);

window.addEventListener('keydown', (e) => {
    if (e.key == 'q') {
        train1.push(new Trailer(train1[train1.length - 1], 'darkmagenta'));
    }
    else if (!keys.includes(e.key)) keys.push(e.key);
});

window.addEventListener('keyup', (e) => {
    keys = keys.filter( (k) => e.key !== k);
});

// * Genius AI maths stuff below *

// Linear projection of a 3D vector (no translation) -- used to map basis vectors
function projectVector(vec3) {
  return {
    x: (vec3.x - vec3.y) * 1,
    y: (vec3.x + vec3.y) * 0.5 - vec3.z * 1
  };
}

function normalize(v) {
  const L = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / L, y: v.y / L, z: v.z / L };
}

// Main: draw a wheel as properly projected ellipse
// center (cx,cy,cz) in world space, radius r, heading 'heading' (radians)
function drawWheel(cx, cy, cz, r, headingRad, colour='#aaa') {
  // forward vector in world XY plane
  const f = { x: Math.cos(headingRad), y: Math.sin(headingRad), z: 0 };

  // choose two orthonormal basis vectors spanning wheel plane:
  // we want the wheel plane to be perpendicular to forward 'f' and include vertical axis.
  // Let v = world up (0,0,1)
  const vUp = { x: 0, y: 0, z: 1 };

  // u = normalized( f cross vUp )  -- this runs across the wheel (left-right)
  // cross(f, vUp) = (f.y*1 - 0, 0 - f.x*1, f.x*0 - f.y*0) = (f.y, -f.x, 0)
  let u = { x: f.y, y: -f.x, z: 0 };
  // ensure normalized (it will be length 1 if f is unit)
  u = normalize(u);
  // v vector in plane: vertical axis mapped into wheel plane: use vUp (0,0,1)
  const v = vUp; // already normalized

  // project u and v into screen space (linear)
  const pu = projectVector(u); // {x,y}
  const pv = projectVector(v); // {x,y}

  // Matrix A = [ pu pv ]  where A maps [cos t; sin t] -> screen (without center)
  // Compute symmetric matrix M = A * A^T = pu*pu^T + pv*pv^T
  const m00 = pu.x * pu.x + pv.x * pv.x;
  const m01 = pu.x * pu.y + pv.x * pv.y;
  const m11 = pu.y * pu.y + pv.y * pv.y;

  // eigenvalues of 2x2 symmetric matrix:
  const trace = m00 + m11;
  const det = m00 * m11 - m01 * m01;
  const disc = Math.max(0, trace * trace - 4 * det);
  const sqrtDisc = Math.sqrt(disc);
  const lambda1 = (trace + sqrtDisc) / 2;
  const lambda2 = (trace - sqrtDisc) / 2;

  // singular values = sqrt(eigenvalues), multiplied by radius
  const s1 = r * Math.sqrt(lambda1);
  const s2 = r * Math.sqrt(Math.max(0, lambda2)); // numerical safety

  // eigenvector for lambda1 (major axis direction)
  let ax = 1, ay = 0; // fallback
  if (Math.abs(m01) > 1e-6 || Math.abs(lambda1 - m00) > 1e-6) {
    ax = m01;
    ay = lambda1 - m00;
    // if that is near-zero, try alternate form
    if (Math.abs(ax) < 1e-8 && Math.abs(ay) < 1e-8) {
      ax = lambda1 - m11;
      ay = m01;
    }
  } else {
    // special case: matrix is diagonal
    ax = 1;
    ay = 0;
  }
  // normalize axis
  const aLen = Math.hypot(ax, ay) || 1;
  ax /= aLen;
  ay /= aLen;

  // angle for canvas ellipse
  const angle = Math.atan2(ay, ax);

  // screen center
  const center = new Pos(cx, cy, cz).toIso();

  // draw filled ellipse & outline
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(0, 0, s1, s2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#88888866';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#444';
  ctx.stroke();
  ctx.restore();
}