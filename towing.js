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
        const fl = this.frontAxle.leftHub.toIso();
        const fr = this.frontAxle.rightHub.toIso()
        const rl = this.rearAxle.leftHub.toIso()
        const rr = this.rearAxle.rightHub.toIso()
        const fc = this.frontAxle.centre.toIso()
        const rc = this.rearAxle.centre.toIso()

        ctx.moveTo(fl.x, fl.y);
        ctx.lineTo(fr.x, fr.y);
        ctx.moveTo(rl.x, rl.y);
        ctx.lineTo(rr.x, rr.y);
        ctx.moveTo(fc.x, fc.y);
        ctx.lineTo(rc.x, rc.y);
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
        const l = this.axle.leftHub.toIso()
        const r = this.axle.rightHub.toIso()
        const c = this.axle.centre.toIso()
        const h = this.hitchedTo.hitch.toIso()

        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(r.x, r.y);
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(h.x, h.y);
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
                        this.y + length * -Math.sin(theta));
    }
    getAngleTo(pos) {
        return Math.atan2(this.y - pos.y, 
            this.x - pos.x);
    }
    toIso () {
        const sx = (this.x - this.y);
        const sy = (this.x + this.y) * 0.5 - this.z;
        return { x: sx, y: sy };
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

// * Genius AI maths stuff below *

// Linear projection of a 3D vector (no translation) -- used to map basis vectors
function projectVector(vec3) {
  // vec3: {x,y,z}
  return {
    x: (vec3.x - vec3.y) * 1,
    y: (vec3.x + vec3.y) * 0.5 - vec3.z * 1
  };
}

// normalize helper
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
  ctx.fillStyle = '#555';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = colour;
  ctx.stroke();
  ctx.restore();
}