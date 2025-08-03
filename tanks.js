"use strict";

const canvas = document.getElementById('terrainCanvas');
const canvasSky = document.getElementById('skyCanvas');
const ctx = canvas.getContext('2d');
const ctxSky = canvasSky.getContext('2d');
const nightsky = document.getElementById('nightsky');
let bombs = [];
let explosions = [];
let players = [];
let tanks = [];
let slimes = [];
let damages = [];
let keys = [];
let map;
let particles = [];
let timestamp = 0;
let hilliness;
const gravity = 0.01;
const colourSoil = "sienna"
const colourRock = "#4f2706"
const colourTankTrack = "#333333"
const colourTankWheel = "#888888"
const phase = {
  START_GAME: "start_game",
  START_TURN: "start_turn",
  AIMING: "aiming",
  FIRING: "firing",
  END_TURN: "end_turn",
  GAME_OVER: "game_over",
};
let game = {
	state : phase.START_GAME,
	activeTank : 0
}
const pColours = {
	RED: {name: "Red", colour: "red"},
	PINK: {name: "Pink", colour: "#FF69B4"},
	YELLOW: {name: "Yellow", colour: "yellow"},
	ORANGE: {name: "Orange", colour: "#fc9403"},
	BLUE: {name: "Blue", colour: "#03f0fc"},
	GREEN: {name: "Green", colour: "#03fc7f"},
	WHITE: {name: "White", colour: "white"},
	BROWN: {name: "Brown", colour: "#B87333"}
}

class Map  {
	constructor (fluctuation, dDamping, slopeDamping, limitTop, limitBottom) {
		this.terrain = [];
		let slope = 0;
		let dSlope = 0;
		this.terrain[0] = new Column(canvas.height * 0.75);

		for (let i = 1 ; i < canvas.width ; i++) {

			let ySoil;
			dSlope += (Math.random() - 0.5) * fluctuation;
			dSlope *= dDamping; 
			slope += dSlope ;
			slope *= slopeDamping; 
			ySoil = (this.columnAt(i-1).ySoil + slope);
			this.terrain[i] = new Column(ySoil);
			if (ySoil < limitTop) { dSlope += 0.1; slope += 0.5; } 
			if (ySoil > limitBottom) { dSlope -= 0.1; slope -= 0.5; }
			}
		}	

	update () {
	ctx.clearRect(0,0,canvas.width,canvas.height);
	for (let i=0;i<this.terrain.length;i++) {
			let c = this.terrain[i];
			ctx.fillStyle = colourSoil;
			ctx.fillRect(i, c.ySoil, 1, c.yRock - c.ySoil);
			ctx.fillStyle = colourRock;
			ctx.fillRect(i, c.yRock, 1, canvas.height - c.yRock);
			if (c.slimed) {
				ctx.fillStyle = "#66ff00";
				ctx.fillRect(i, c.ySoil - 6, 1, 8);
			}
			
			for (let yDeform of c.yDeforms) { 
					ctx.clearRect(i, yDeform, 1, 1);
					}
			c.update();
		}
	}

		gradientAt (x) {
			x = Math.floor(x);
			if (x < 5) x = 5;
			if (x > canvas.width - 6) x = canvas.width - 6 
			return (this.terrain[x + 5].ySoil - this.terrain[x - 5].ySoil) * 0.1;
	}

	columnAt (x) {
		return this.terrain[Math.floor(x)];
	}

	collisionAt (x, y) {
		x = Math.floor(x);
		y = Math.floor(y);
		return (y > this.terrain[x].ySoil && !this.terrain[x].yDeforms.includes(y)); 
	}
}

class Player {
	constructor(pColour) {
		this.pColour = pColour;
		this.score = 0;
	}

	spawnTank () {
		let x;
		do {
				x = Math.floor(Math.random() * (canvas.width - 40)) + 20;
		} while (tanks.some( t => 
				Math.abs(t.x - x) < canvas.width / (players.length + 2)
		)) 
		
		tanks.push(new Tank(x, this.pColour.colour, this));
	}

drawScore () {
		ctx.fillStyle = this.pColour.colour;
    ctx.font = "18px monospace";
    ctx.textAlign = "start";	
		ctx.fillText(this.score, canvas.width - 30, (players.indexOf(this)+1) * 20 + 13);
		}
}

class Tank {
	constructor(x, colour, player) {
	this.x = x;
	this.fall();
	this.angle = Math.PI / 2;
	this.displayAngle = 90;
	this.power = 40;
	this.alive = true;
	this.health = 100;
	this.player = player;
	this.radius = 6;
	this.ammo = {
		particle: {name: "Particle Beam", stock: 3, burst: 15, timeout: 50, colour: "red", exRadius: 2, bRadius: 2, damage: 2, hasMass: false, bounces: false, fuse: false},
		bomb: {name: "Bomb", stock: 100, burst: 1, timeout: null, colour: "gold", exRadius: 20, bRadius: 3, damage: 30, hasMass: true, bounces: false, fuse: false},
		bigbomb: {name: "Big Bomb", stock: 1, burst: 1, timeout: null, colour: "white", exRadius: 40, bRadius: 8, damage: 55, hasMass: true, bounces: false, fuse: false},
		grenade: {name: "Grenade", stock: 3, burst: 1, timeout: null, colour: "skyblue", exRadius: 25, bRadius: 4, damage: 40, hasMass: true, bounces: 20, fuse: 12, multiplies: false},
		cluster: {name: "Cluster Bombs", stock: 3, burst: 5, timeout: 400, colour: "pink", exRadius: 10, bRadius: 3, damage: 15, hasMass: true, bounces: false, fuse: false},
		bouncebomb: {name: "Bouncing Bomb", stock: 5, burst: 1, timeout: null, colour: "#FF69B4", exRadius: 10, bRadius: 2, damage: 10, hasMass: true, bounces: 2, fuse: false, multiplies: true},
		slimebomb: {name: "Slime Bomb", stock: 10, burst: 1, timeout: null, colour: "#66ff00", exRadius: 0, bRadius: 6, damage: 10, hasMass: true, bounces: false, fuse: false, spawns: "slime"}
		};
	}

	setAngle (event) {
		if (game.state != phase.AIMING) return;
		const rect = canvas.getBoundingClientRect(); // Get canvas position
    const x = event.clientX - rect.left;         // X coordinate relative to canvas
    const y = event.clientY - rect.top;          // Y coordinate relative to canvas
    this.angle = Math.atan2( (this.y - y) , (x - this.x ) );
    this.displayAngle = (this.angle * 360 / 2 / Math.PI).toFixed(0);
	}

	fall (){
		this.x = Math.min (canvas.width - 2, this.x);
		this.x = Math.max (2, this.x);
		this.y = map.columnAt(this.x).ySoil; 
		if (this.y > canvas.height) this.alive = false;
	}

	move () {
		if (!map.columnAt(this.x).slimed) {
			if (keys.includes('z')) this.x -= 0.1;
			if (keys.includes('x')) this.x += 0.1;
		}
	}
	
	update() {
		if (map.columnAt(this.x).slimed) {
			this.x += map.gradientAt(this.x) * 0.05;
		}
		this.fall();

		//Draw tank body
		ctx.fillStyle = this.player.pColour.colour;
		ctx.strokeStyle= this.player.pColour.colour;
		ctx.fillRect(this.x - 2, this.y - 5, 5, 1);
		ctx.fillRect(this.x - 3, this.y - 4, 7, 2);
		ctx.fillRect(this.x - 7, this.y - 2, 15, 2);
		ctx.fillRect(this.x - 8, this.y, 17, 3);
		ctx.fillStyle = colourTankTrack;
		ctx.fillRect(this.x - 8, this.y + 2, 17, 3);
		ctx.fillRect(this.x - 6, this.y + 5, 13, 1);
		ctx.fillStyle = colourTankWheel;
		ctx.fillRect(this.x - 7, this.y + 3, 1, 1);
		ctx.fillRect(this.x - 5, this.y + 3, 2, 2);
		ctx.fillRect(this.x - 2, this.y + 3, 2, 2);
		ctx.fillRect(this.x + 1, this.y + 3, 2, 2);
		ctx.fillRect(this.x + 4, this.y + 3, 2, 2);
		ctx.fillRect(this.x + 7, this.y + 3, 1, 1);

		//Draw turret
		ctx.beginPath(); 
		ctx.moveTo( this.x, this.y - 4); 
		ctx.lineTo(this.x + 10 * Math.cos(this.angle), this.y - 4 - 10 * Math.sin(this.angle)); 
		ctx.closePath();
		ctx.stroke(); 

		//Draw reticle
		if (tanks[game.activeTank] === this) {
			ctx.strokeRect(this.x + 50 * Math.cos(this.angle) - 2, this.y - 4 - 50 * Math.sin(this.angle) - 2, 4, 4 )
		}

		//Draw health bar
		ctx.fillStyle = this.player.pColour.colour;
		ctx.strokeStyle = this.player.pColour.colour;
    ctx.font = "12px monospace";
    ctx.fillText(this.health, canvas.width - 180, (players.indexOf(this.player)+1) * 20 + 12)
		ctx.strokeRect(canvas.width - 150, (players.indexOf(this.player)+1) * 20 , 100, 15);
		ctx.fillRect(canvas.width - 150, (players.indexOf(this.player)+1) * 20, this.health, 15);
	}

	fire(type, number = 0) {
		game.state = phase.FIRING;
		let proj = this.ammo[type];
		bombs.push(new Bomb(this, proj));
		number++; 
		if (number < proj.burst) { 
			setTimeout( () => { this.fire(type, number)}, proj.timeout);
		}
	}
}

class Bomb {
	constructor(tank, ammo) {
		this.x = tank.x;
		this.y = tank.y - 5;
		this.player = tank.player;
		this.exRadius = ammo.exRadius;
		this.bRadius = ammo.bRadius;
		this.hasMass = ammo.hasMass;
		this.colour = ammo.colour;
		this.bounces = ammo.bounces;
		this.multiplies = ammo.multiplies;
		this.damage = ammo.damage;
		this.spawns = ammo.spawns;
		this.fuse = ammo.fuse;
		this.timeFired = null;
		this.power = ammo.hasMass ? tank.power : 80;
		this.vx = this.power * Math.cos(tank.angle) / 20;
		this.vy = -1 * this.power * Math.sin(tank.angle) / 20;
	}

	update (time) {
		
		if (!this.timeFired) this.timeFired = time;

		if (this.fuse && this.timeFired + this.fuse * 1000 < time) { 
			explosions.push(new Explosion(this));
			return;
		}

		if (!this.fuse && !this.spawns) {
			let otherTanks = tanks.filter( t => t.player !== this.player); 
			if (otherTanks.some( t => 
						Math.sqrt((this.x - t.x)**2 + (this.y - t.y)**2) < this.bRadius + t.radius
			)) {
				explosions.push(new Explosion(this));
				return;
			}
		}

		if (map.collisionAt(this.x, this.y)) {
			if (this.bounces) {
				this.bounce(this.x);
			} 
			else if (this.spawns === "slime") {
				slimes.push(new Slime(this));
				return;
			}
			else {
			 explosions.push(new Explosion(this));
			 return;
			}
		}
		
		ctx.fillStyle = this.colour;
		ctx.fillRect(this.x - this.bRadius, this.y - this.bRadius, 2 * this.bRadius, 2 * this.bRadius);
		if (this.fuse) {
			ctx.font = "10px monospace"
			ctx.fillText((this.fuse + (this.timeFired - time)/1000).toFixed(0) , this.x - 3, this.y - 10)
		}

		if (this.y <= -10) {
			ctx.beginPath(); 
			ctx.moveTo(this.x - 5, 25); 
			ctx.lineTo(this.x, 2); 
			ctx.lineTo(this.x + 5, 25); 
			ctx.closePath();
			ctx.fill(); 
		}


		this.x += this.vx;
		this.y += this.vy;
		if (this.hasMass) { 
			this.vy += gravity; 
		}
	}

	bounce (x) {
		const restitution = 0.5;
		this.bounces--;
		if (this.multiplies) {
			this.bRadius *= 2;
			this.exRadius *= 2;
			this.damage *= 2;
		}
		let dy = map.gradientAt(x);
		let normal = this.normalize({x: -dy, y: 1});
		let dot = this.vx * normal.x + this.vy * normal.y;
		this.vx = (this.vx - 2 * dot * normal.x) * restitution;
		this.vy = (this.vy - 2 * dot * normal.y) * restitution;

		this.y = map.columnAt(x).ySoil;
	}	

	normalize(v) {
  let mag = Math.sqrt(v.x * v.x + v.y * v.y);
  return {x: v.x / mag, y: v.y / mag};
	}
}

class Particle {
	constructor(tank) {
		this.x = tank.x;
		this.y = tank.y;
		this.vx = Math.random() * 2 - 1;
		this.vy = -Math.random() * 1;
		this.colour = tank.player.pColour.colour;
		}

	update () {
		if (map.collisionAt(this.x, this.y)) {
				this.vx = this.vy = 0;
				this.x = Math.floor(this.x);	
				this.y = Math.floor(this.y);
			}

		this.x += this.vx;
		this.y += this.vy;
		this.vy += gravity * 2;

		ctx.fillStyle = this.colour;
		ctx.fillRect(this.x,this.y,2,2);
	}
}

class Explosion {
	constructor(bomb) {
		this.x = Math.floor(bomb.x);
		this.y = bomb.y;
		this.damage = bomb.damage;
		this.radius = bomb.exRadius;
		this.player = bomb.player;
		this.explode();
		bombs = bombs.filter((e) => e !== bomb);
	}

	explode () {
		tanks.forEach( (t) => {
				if (Math.sqrt((this.x - t.x)**2 + (this.y - t.y)**2) < this.radius + t.radius) {
					damages.push(new Damage(t, this.damage));
					if (t.health <= 0) {
						t.alive = false;
						for (let i = 0; i < 20 ; i++) {
							particles.push(new Particle(t));
						}
					}
				}
		});

		for (let i = -1 * this.radius ; i < this.radius + 1 ; i++) {
			
			let depth = Math.floor(Math.sqrt(this.radius**2 - i**2));
			let yTop = Math.floor(this.y - depth);

			for (let j = yTop; j <= yTop + 2 * depth ; j++) {
				if (this.x + i >= canvas.width) {break;}
				if (this.x + i < 0) {continue;}
				if (!map.columnAt(this.x + i).yDeforms.includes(j)) {
					map.columnAt(this.x + i).yDeforms.push(j);
				}
			}
		}	
	}

	update () {
		ctx.fillStyle = "yellow";
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		ctx.fill();
		this.radius--;
	}
}

class Damage {
	constructor(tank, points) {
		this.points = points;
		this.life = 60;
		this.colour = tank.player.pColour.colour;
		this.x = Math.floor(tank.x);
		this.y = Math.floor(tank.y) - 20;
		tank.health -= points;
	}

	update () {
		ctx.font = "10px monospace";
		ctx.textAlign = "center";
		ctx.fillStyle = this.colour;
		ctx.fillText (this.points, this.x, this.y);
		this.y--;
		this.life--;
	}
}

class Column {
	constructor(yInit){
		this.ySoil = yInit;
		this.yRock = yInit + Math.floor(5*Math.random() + 10);
		this.yDeforms = [];
		this.slimed = false;
	}

	update () {
		
		if (bombs.length > 0 || explosions.length > 0) {return;}
		
		//Remove deforms above ground
		this.yDeforms = this.yDeforms.filter( (y) => y >= this.ySoil);

		if (this.yDeforms.length == 0 ) {return;}
		
		//Create open crater
		this.yDeforms.sort((a, b) => a - b );
		if (this.yDeforms[0] > this.ySoil) {

			//Handle terrain collapse
			this.collapse();
		}
		while (this.ySoil == this.yDeforms[0]) {
			this.ySoil++
			this.yRock = Math.max(this.yRock, this.ySoil);
			this.yDeforms.shift();
		}
	}

	collapse () {
		let toRemove = this.yDeforms.shift();
		if (toRemove > this.yRock) {
			this.ySoil++;
			this.yRock++;
		}
		else {
			this.ySoil++;
		}
	}
}

class Slime {
	constructor(bomb) {
		this.segments = [];
		this.segments.push({x: bomb.x, y: map.columnAt(bomb.x).ySoil })
		this.vx = bomb.vx;
		this.timer = 0;
		this.size = 15;
		this.stoppedCycles = 8;
		bombs = bombs.filter((e) => e !== bomb);
	}

	update (time) {
		this.vx += map.gradientAt(this.segments[0].x) * 0.02;
		this.vx *= 0.99;
		this.vx = Math.min(this.vx, 1.0);
		this.vx = Math.max(this.vx, -1.0);

		if (time - this.timer > 100) {
			this.timer = time;
			if (Math.abs(this.vx) < 0.05) { this.stoppedCycles-- }
			let newX = this.segments[0].x + this.vx;
			
			if (newX < 0) {
				newX = 0 ;
				this.size--;
				}
				if (newX > canvas.width - 1)
				{
					newX = canvas.width - 1;
					this.size--;
				}
				let newY = map.columnAt(newX).ySoil;
				this.segments.unshift({x: newX, y: newY});
				let startX = Math.floor(Math.min(this.segments[0].x, this.segments[1].x));
				let endX = Math.floor(Math.max(this.segments[0].x, this.segments[1].x));
				for (let i = startX ; i <= endX ; i++) {
					map.columnAt(i).slimed = true;
				}
		}
	
		if (this.segments.length >= this.size) this.segments.pop();

		this.segments.forEach( (s, i) => {
			let r = (this.size - i) * 0.5;
			ctx.fillStyle = '#66ff00';
			ctx.beginPath();
			ctx.arc(s.x, s.y - r, r, 0, 2 * Math.PI);
			ctx.fill();
		});
		if (this.stoppedCycles <=0) {this.size--}
		slimes = slimes.filter( (s) => s.size > 4)	
	}
}

document.getElementById('controls').style.display = "none";
canvas.style.display = "none";
nightsky.style.display = "none";
Object.entries(pColours).forEach( ([key, col]) => {
	let div = document.createElement("div");
	let cb = document.createElement("input");
	cb.type = "checkbox";
	cb.value = key;
	cb.name = col.name;
	cb.id = col.name;
	let lbl = document.createElement('label')
	lbl.htmlFor = col.name;
	lbl.style.color = col.colour;
	lbl.appendChild(document.createTextNode(col.name));
	let spDiv = document.getElementById("setupPlayers");
	div.appendChild(cb);
	div.appendChild(lbl);	
	spDiv.appendChild(div);
	});

setupHandlers();

function startGame() {

	let playerSelection = document.getElementById("setupPlayers").querySelectorAll("input:checked");
	if (playerSelection.length < 2) { return false; }
	playerSelection.forEach ( cb => {
		players.push(new Player(pColours[cb.value]))
	});

	hilliness = document.getElementById('hilliness').value;
	canvas.style.display = "";
	canvasSky.style.display = "";

	ctxSky.drawImage(nightsky, 0, 0, canvasSky.width, canvasSky.height);
	document.getElementById("setupPlayers").style.display = "none";
	document.getElementById("spRange").style.display = "none";
	document.getElementById("spButton").style.display = "none";
	requestAnimationFrame(gameLoop);
}

function gameLoop(time) {
 
 if (game.state === phase.START_GAME) {
    	map = new Map(hilliness, 0.88, 0.92, canvas.height * 0.50, canvas.height * 0.92);
    	tanks.length = 0;
    	players.forEach ( p => p.spawnTank() );
    	particles.length = 0;
		game.activeTank = Math.floor(Math.random() * tanks.length);
		game.state = phase.START_TURN;
	}

	bombs = bombs.filter((b) => b.x > 0 && b.x < canvas.width && 
																b.y < canvas.height && (b.y > 0 || b.hasMass));

	damages = damages.filter( d => d.life > 0);
	particles = particles.filter((p) => p.x > 0 && p.x < canvas.width && p.y < canvas.height);
	explosions = explosions.filter((e) => e.radius > 0);

	map.update();
	players.forEach ( p => p.drawScore());
	bombs.forEach( b => b.update(time) );
	particles.forEach( p => p.update() );
	tanks.filter( t => t.alive).forEach( t => t.update() );
	explosions.forEach( e => e.update() );
	slimes.forEach( s => s.update(time));
	damages.forEach( d => d.update());

switch (game.state) {
    case phase.START_TURN:
    	document.getElementById('controls').style.display="";
    	document.getElementById('powerRange').value = tanks[game.activeTank].power;
    	let weapon = document.getElementById('weapon');
    	weapon.options.length = 0;
    	Object.entries(tanks[game.activeTank].ammo).forEach (([key, ammo]) => { 
    		if (ammo.stock > 0) {
    			weapon.add(new Option(`${ammo.name} (${ammo.stock})`, key ));
    		}
    		weapon.value = "bomb";
    	});
    	
    	game.state = phase.AIMING;
    	timestamp = time;
   	break;

    case phase.AIMING:
    	ctx.fillStyle = tanks[game.activeTank].player.pColour.colour;
			ctx.textAlign = "start"	
	   	ctx.font = "12px monospace"
	   	ctx.fillText(`Angle ${tanks[game.activeTank].displayAngle}`, 10, 25); 
	   	ctx.fillText(`Power ${tanks[game.activeTank].power}`, 10, 40); 
	   	let timeElapsed = time - timestamp;

    	if (timeElapsed < 3000) {
    		ctx.font = "32px monospace"
				ctx.textAlign = "center"	
				ctx.fillText(`Ready ${tanks[game.activeTank].player.pColour.name} Player`, 
				canvas.width * 0.5, canvas.height * 0.33); 
				}

			if (timeElapsed > 3000 && timeElapsed < 23000) {
				ctx.font = "18px monospace"
				ctx.textAlign = "center"	
				ctx.fillText(`Move ${tanks[game.activeTank].player.pColour.name} with Z & X ${(23 - timeElapsed/1000).toFixed(1)}`, 
				canvas.width / 2, 30); 
				tanks[game.activeTank].move();
				}

  	break;

  	case phase.FIRING:
	  if (bombs.length == 0 && explosions.length == 0 && slimes.length == 0 &&
	  		map.terrain.every( e => e.yDeforms.length == 0)) {
	  			game.state = phase.END_TURN;
	  		}
		break;

  	case phase.END_TURN:
  		tanks = tanks.filter( (t) => t.alive )
  		if (tanks.length > 1) {
  			game.activeTank = (game.activeTank + 1) % tanks.length;
	  		game.state = phase.START_TURN;
	  		break;
  		}
  		else if (tanks.length === 1) {
  			tanks[0].player.score++;
  			game.activeTank = 0;
  		}
  		game.state = phase.GAME_OVER;
  		setTimeout( () => game.state = phase.START_GAME, 5000);
  	break;

  	case phase.GAME_OVER:
  		ctx.font = "32px monospace";
			ctx.textAlign = "center";	
			if (tanks[0]) {
				ctx.fillStyle = tanks[0].player.pColour.colour;
				ctx.fillText(`Game over, ${tanks[0].player.pColour.name} Player wins!`, 
					canvas.width * 0.5, canvas.height * 0.33);
			} else {
				ctx.fillStyle = "grey"
				ctx.fillText(`Game over, no winner!`, canvas.width * 0.5, canvas.height * 0.33);
			}
  	break;
  }

  requestAnimationFrame(gameLoop);
}

function setupHandlers () {

	let intervalId = null;
	let eMouse = null;

	canvas.addEventListener('mousemove', e => eMouse = e );

	canvas.addEventListener ( "mousedown", () => {
		if (eMouse) {
			intervalId = setInterval( () => tanks[game.activeTank].setAngle(eMouse), 40);
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
  	if (!keys.includes(e.key)) keys.push(e.key);
  });

  window.addEventListener('keyup', (e) => {
  	keys = keys.filter( (k) => e.key !== k);
  });

  document.getElementById('powerRange').addEventListener('input', (i) => {
  	tanks[game.activeTank].power = i.target.value;
  });

	document.getElementById('fire').addEventListener( "click", (e) => {
		let weapon = document.getElementById("weapon");
		tanks[game.activeTank].fire(weapon.value);
		tanks[game.activeTank].ammo[weapon.value].stock--;
		document.getElementById('controls').style.display="none";
	});

	document.getElementById('spok').addEventListener( "click", startGame);

	document.getElementById('powerminus').addEventListener( "click", (e) => {
		document.getElementById('powerRange').stepDown();
		tanks[game.activeTank].power = document.getElementById('powerRange').value;
	});

	document.getElementById('powerplus').addEventListener( "click", (e) => {
		document.getElementById('powerRange').stepUp();
		tanks[game.activeTank].power = document.getElementById('powerRange').value;
	});
}
