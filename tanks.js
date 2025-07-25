"use strict";

const canvas = document.getElementById('terrainCanvas');
const canvasSky = document.getElementById('skyCanvas');
const ctx = canvas.getContext('2d');
const ctxSky = canvasSky.getContext('2d');
const nightsky = document.getElementById('nightsky');
let terrainMap = [];
let bombs = [];
let explosions = [];
let players = [];
let tanks = [];
let keys = [];
let particles = [];
let timestamp = 0;
const gravity = 0.01;
const colourSoil = "limegreen"
const colourRock = "#6f370f"
const colourTankTrack = "#333333"
const colourTankWheel = "#888888"
const phase = {
	SETUP_PLAYERS_INIT: "setup_players_init",
	SETUP_PLAYERS_WAIT: "setup_players_wait",
	SETUP_PLAYERS_FINAL: "setup_players_final",
  START_GAME: "start_game",
  START_TURN: "start_turn",
  AIMING: "aiming",
  FIRING: "firing",
  END_TURN: "end_turn",
  GAME_OVER: "game_over",
};
let game = {
	state : phase.SETUP_PLAYERS_INIT,
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

let map = {
	gen () {
		let slope = 0;
		let dSlope = 0;
		terrainMap[0] = new Column(520);

		for (let i = 1 ; i < canvas.width ; i++) {

			let ySoil;
			dSlope += (Math.random() - 0.5);
			dSlope *= 0.9;
			slope += dSlope ;
			slope *= 0.8;
			ySoil = Math.floor(terrainMap[i-1].ySoil + slope);
			terrainMap[i] = new Column(ySoil);
			if (ySoil < 400) { dSlope += 0.1; slope += 0.5; }
			if (ySoil > 550) { dSlope -= 0.1; slope -= 0.5; }
			}
		},	

	update () {
	ctx.clearRect(0,0,canvas.width,canvas.height);
	for (let i=0;i<terrainMap.length;i++) {
			let c = terrainMap[i];
			ctx.fillStyle = colourSoil;
			ctx.fillRect(i, c.ySoil, 1, c.yRock - c.ySoil);
			ctx.fillStyle = colourRock;
			ctx.fillRect(i, c.yRock, 1, canvas.height - c.yRock);
			
			for (let yDeform of c.yDeforms) { 
					ctx.clearRect(i, yDeform, 1, 1);
					}
			c.update();
		}
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
		bouncebomb: {name: "Ellie's Bouncing Bomb", stock: 5, burst: 1, timeout: null, colour: "#FF69B4", exRadius: 10, bRadius: 2, damage: 10, hasMass: true, bounces: 2, fuse: false, multiplies: true},
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
		this.y = terrainMap[Math.floor(this.x)].ySoil; 
		if (this.y > canvas.height) this.killed();
	}

	move () {
		if (keys.includes('z')) this.x -= 0.1;
		if (keys.includes('x')) this.x += 0.1;
	}
	
	update() {
		if (this.alive) {
			this.fall();
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
			ctx.beginPath(); 
			ctx.moveTo( this.x, this.y - 4); 
			ctx.lineTo(this.x + 10 * Math.cos(this.angle), this.y - 4 - 10 * Math.sin(this.angle)); 
			ctx.closePath();
			ctx.stroke(); 
			if (tanks[game.activeTank] === this) {
				ctx.strokeRect(this.x + 50 * Math.cos(this.angle) - 2, this.y - 4 - 50 * Math.sin(this.angle) - 2, 4, 4 )
			}
		}
		this.drawHealth();
	}

		drawHealth () {
		ctx.fillStyle = this.player.pColour.colour;
		ctx.strokeStyle = this.player.pColour.colour;
    ctx.font = "18px monospace";
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

	killed () {
		this.alive = false;
		for (let i = 0; i < 20 ; i++) {
						particles.push(new Particle(this));
					}
		let survivors = tanks.filter( (t) => t.alive )
		if (survivors.length == 1) {
			game.state = phase.GAME_OVER;
			game.activeTank = tanks.indexOf(survivors[0]);
			survivors[0].player.score++;
			setTimeout( () => game.state = phase.START_GAME, 5000);
		}
		tanks = survivors;
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
		this.fuse = ammo.fuse;
		this.timeFired = null;
		this.power = ammo.hasMass ? tank.power : 80;
		this.vx = this.power * Math.cos(tank.angle) / 20;
		this.vy = -1 * this.power * Math.sin(tank.angle) / 20;
	}

	update (time) {
		
		if (!this.timeFired) this.timeFired = time;

		if (this.fuse && this.timeFired + this.fuse * 1000 < time) { explosions.push(new Explosion(this)) }

		let iCol = Math.floor(this.x);
		if (terrainMap[iCol].collisionAt(Math.floor(this.y))) {
					this.bounces ? this.bounce(iCol) : explosions.push(new Explosion(this))
			}

		this.x += this.vx;
		this.y += this.vy;
		if (this.hasMass) { 
			this.vy += gravity; 
		}
		
		if (!this.fuse) {
			let otherTanks = tanks.filter( t => t.player !== this.player); 
			if (otherTanks.some( t => 
						Math.sqrt((this.x - t.x)**2 + (this.y - t.y)**2) < this.bRadius + t.radius
			)) {
				explosions.push(new Explosion(this));
			}
		}

		bombs = bombs.filter((b) => b.x > 0 && b.x < canvas.width && 
																b.y < canvas.height && (b.y > 0 || this.hasMass));
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
	}

	bounce (iCol) {
		const restitution = 0.5;
		this.bounces--;
		if (this.multiplies) {
			this.bRadius *= 2;
			this.exRadius *= 2;
			this.damage *= 2;
		}
		let dy = (terrainMap[iCol + 1].ySoil - terrainMap[iCol - 1].ySoil) * 0.5;
		let normal = this.normalize({x: -dy, y: 1});
		let dot = this.vx * normal.x + this.vy * normal.y;
		this.vx = (this.vx - 2 * dot * normal.x) * restitution;
		this.vy = (this.vy - 2 * dot * normal.y) * restitution;

		this.y = terrainMap[iCol].ySoil
		//this.x -= this.bRadius * 0.1 * normal.x 

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
		//this.bias = tank.x - explosion.x
		this.vx = Math.random() * 2 - 1;
		this.vy = -Math.random() * 1;
		this.colour = tank.player.pColour.colour;
		}

	update () {
		let iCol = Math.floor(this.x);
		if (terrainMap[iCol].collisionAt(Math.floor(this.y))) {
				this.vx = this.vy = 0;
				this.x = Math.floor(this.x);	
				this.y = Math.floor(this.y);
			}

		this.x += this.vx;
		this.y += this.vy;
		this.vy += gravity * 2;

		particles = particles.filter((p) => p.x > 0 && p.x < canvas.width && p.y < canvas.height);

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
					t.health -= this.damage;
					if (t.health <= 0) t.killed();
				}
					
		});

		for (let i = -1 * this.radius ; i < this.radius + 1 ; i++) {
			
			let depth = Math.floor(Math.sqrt(this.radius**2 - i**2));
			let yTop = Math.floor(this.y - depth);

			for (let j = yTop; j <= yTop + 2 * depth ; j++) {
				if (this.x + i >= canvas.width) {break;}
				if (this.x + i < 0) {continue;}
				if (!terrainMap[this.x + i].yDeforms.includes(j)) {
					terrainMap[this.x + i].yDeforms.push(j);
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
		explosions = explosions.filter((e) => e.radius > 0)
	}
}

class Column {
	constructor(yInit){
		this.ySoil = yInit;
		this.yRock = yInit + Math.floor(5*Math.random() + 10);
		this.yDeforms = [];
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

	collisionAt (y) {
		return (y > this.ySoil && !this.yDeforms.includes(y)); 
	}
}


gameLoop(0);

function gameLoop(time) {

	switch(game.state) {

	case phase.SETUP_PLAYERS_INIT:
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
		game.state = phase.SETUP_PLAYERS_WAIT;

	break;

	case phase.SETUP_PLAYERS_WAIT:

	break;

	case phase.SETUP_PLAYERS_FINAL:
			document.getElementById("setupPlayers").querySelectorAll("input").forEach ( cb => {
				if (cb.checked) { players.push(new Player(pColours[cb.value]))}
			});
			
		canvas.style.display = "";
		canvasSky.style.display = "";

		ctxSky.drawImage(nightsky, 0, 0, canvasSky.width, canvasSky.height);
		document.getElementById("setupPlayers").style.display = "none";
		document.getElementById("spok").style.display = "none";
		game.state = phase.START_GAME;
	break; 

 	case phase.START_GAME:
    	map.gen();
    	tanks.length = 0;
    	players.forEach ( p => p.spawnTank() );
    	particles.length = 0;
		game.activeTank = Math.floor(Math.random() * tanks.length);
		game.state = phase.START_TURN;
		break;
 }

	map.update();
	players.forEach ( p => p.drawScore());
	bombs.forEach( b => b.update(time) );
	particles.forEach( p => p.update() );
	tanks.forEach( t => t.update() );
	explosions.forEach( e => e.update() );

  switch (game.state) {

    case phase.START_TURN:
    	if (tanks.length == 0) {
    		game.state = phase.START_GAME;
    		break;
    	}
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
				canvas.width / 2, canvas.height / 2); 
				}

			if (timeElapsed > 3000 && timeElapsed < 13000) {
				ctx.font = "18px monospace"
				ctx.textAlign = "center"	
				ctx.fillText(`Move ${tanks[game.activeTank].player.pColour.name} with Z & X ${(13 - timeElapsed/1000).toFixed(1)}`, 
				canvas.width / 2, 30); 
				tanks[game.activeTank].move();
				}

  	break;

  	case phase.FIRING:
	  if (bombs.length == 0 && explosions.length == 0 &&
	  		terrainMap.every( e => e.yDeforms.length == 0)) {
	  			game.state = phase.END_TURN;
	  		}
	break;

  	case phase.END_TURN:
			game.activeTank = (game.activeTank + 1) % tanks.length;
	  	game.state = phase.START_TURN;
  	break;

  	case phase.GAME_OVER:
  		ctx.fillStyle = tanks[0].player.pColour.colour;
  		ctx.font = "32px monospace";
			ctx.textAlign = "center";	
			ctx.fillText(`Game over, ${tanks[0].player.pColour.name} Player wins!`, 
			canvas.width / 2, canvas.height / 2);
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
  	console.log (keys);
  });

  window.addEventListener('keyup', (e) => {
  	keys = keys.filter( (k) => e.key !== k);
  	console.log (keys);
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

	document.getElementById('spok').addEventListener( "click", (e) => {
		game.state = phase.SETUP_PLAYERS_FINAL;
	});

	document.getElementById('powerminus').addEventListener( "click", (e) => {
		document.getElementById('powerRange').stepDown();
		tanks[game.activeTank].power = document.getElementById('powerRange').value;
	});

	document.getElementById('powerplus').addEventListener( "click", (e) => {
		document.getElementById('powerRange').stepUp();
		tanks[game.activeTank].power = document.getElementById('powerRange').value;
	});
}
