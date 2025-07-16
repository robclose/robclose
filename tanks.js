"use strict";

const canvas = document.getElementById('terrainCanvas');
const ctx = canvas.getContext('2d');
let terrainMap = [];
let slopeMap = [];
let bombs = [];
let explosions = [];
let tanks = [];
let particles = [];
const gravity = 0.01;
const colourSoil = "limegreen"
const colourRock = "saddlebrown"
const GameState = {
  START_GAME: "start_game",
  START_TURN: "start_turn",
  AIMING: "aiming",
  FIRING: "firing",
  END_TURN: "end_turn",
  GAME_OVER: "game_over",
};
let currentState = GameState.START_GAME;
let currentPlayerIndex = 0;
let timestamp;

let map = {
	gen () {
		let slope = 0;
		let dSlope = 0;
		let ddSlope = 0;
		terrainMap[0] = new Column(520);

		for (let i = 1 ; i < canvas.width ; i++) {

			let ySoil;
			ddSlope = (Math.random() - 0.5);
			dSlope += ddSlope;
			dSlope -= dSlope * 0.1;
			slope += dSlope ;
			slope -= slope * 0.2;
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

class Tank {
	constructor(x, colour) {
	this.x = x;
	this.fall();
	this.colour = colour;
	this.angle = Math.PI / 2;
	this.displayAngle = 90;
	this.power = 40;
	this.alive = true;
	}

	setAngle (event) {
		if (currentState != GameState.AIMING) return;
		const rect = canvas.getBoundingClientRect(); // Get canvas position
    const x = event.clientX - rect.left;         // X coordinate relative to canvas
    const y = event.clientY - rect.top;          // Y coordinate relative to canvas
    this.angle = Math.atan2( (this.y - y) , (x - this.x ) );
    this.displayAngle = (this.angle * 360 / 2 / Math.PI).toFixed(0);
	}

	fall (){
		this.y = terrainMap[this.x].ySoil - 5; 
	}
	
	update() {
		if (this.alive) {
			this.fall();
			ctx.fillStyle = this.colour;
			ctx.strokeStyle= this.colour;
			ctx.fillRect(this.x - 5, this.y - 2, 10, 8);
			ctx.strokeRect(this.x + 35 * Math.cos(this.angle) - 2, this.y - 35 * Math.sin(this.angle) - 2, 4, 4 )
		}
	}

	fire() {
		bombs.push(new Bomb(this, "white"));
		currentState = GameState.FIRING;
	}

	killed () {
		this.alive = false;
		let survivors = tanks.filter( (t) => t.alive )
		if (survivors.length == 1) {
			currentState = GameState.GAME_OVER;
			currentPlayerIndex = tanks.indexOf(survivors[0]);
			setTimeout( () => currentState = GameState.START_GAME, 5000);
		}
		tanks = survivors;
	}
}

class Bomb {
	constructor(player, colour) {
		this.x = player.x;
		this.y = player.y;
		this.vx = player.power * Math.cos(player.angle) / 20;
		this.vy = -1 * player.power * Math.sin(player.angle) / 20;
	}

	update () {
		
		let iCol = Math.floor(this.x);
		if (terrainMap[iCol].collisionAt(Math.floor(this.y))) {
					explosions.push(new Explosion(this, 20));
				
			}

		this.x += this.vx;
		this.y += this.vy;
		this.vy += gravity;
		
		bombs = bombs.filter((b) => b.x > 0 && b.x < canvas.width && b.y < canvas.height);
		ctx.fillStyle = "gold"
		ctx.fillRect(this.x,this.y,3,3);

		if (this.y <= 0) {
			ctx.beginPath(); 
			ctx.moveTo( this.x - 5, 25); 
			ctx.lineTo(this.x, 2); 
			ctx.lineTo(this.x + 5, 25); 
			ctx.closePath();
			ctx.fill(); 
		}
}

}

class Particle {
	constructor(player, explosion) {
		this.x = player.x;
		this.y = player.y;
		this.bias = player.x - explosion.x
		this.vx = Math.random() * 2 - 1;
		this.vy = -Math.random() * 1;
		this.colour = player.colour;
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
	constructor(bomb, radius) {
		this.x = Math.floor(bomb.x);
		this.y = bomb.y;
		this.radius = radius;
		this.explode();
		bombs = bombs.filter((e) => e !== bomb);
	}

	explode () {
		tanks.forEach( (t) => {
				if (Math.sqrt((this.x - t.x)**2 + (this.y - t.y)**2) < this.radius) {
					for (let i = 0; i < 20 ; i++) {
						particles.push(new Particle(t, this));
					}
					t.killed();
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

setupButtons();
gameLoop();

function gameLoop(time) {

if (currentState == GameState.START_GAME) {
    	map.gen();
    	tanks.length = 0;
    	particles.length = 0;
			tanks.push(	new Tank(50, "yellow"),
					new Tank(350, "dodgerblue"), 
					new Tank(750, "#FF69B4"));  // Hot pink
		currentPlayerIndex = Math.floor(Math.random() * tanks.length);
		currentState = GameState.START_TURN;
 }

	map.update();
	bombs.forEach( b => b.update() );
	particles.forEach( p => p.update() );
	tanks.forEach( t => t.update() );
	explosions.forEach( e => e.update() );

  switch (currentState) {

    case GameState.START_TURN:
    	document.getElementById('controls').style.display="";
    	document.getElementById('powerRange').value = tanks[currentPlayerIndex].power;
    	currentState = GameState.AIMING;
    	timestamp = time;
   	break;

    case GameState.AIMING:
    	ctx.fillStyle = tanks[currentPlayerIndex].colour;
    	ctx.font = "18px monospace"
			ctx.textAlign = "start"	
	   	ctx.fillText(`Player ${currentPlayerIndex + 1}`, 10, 30); 
	   	ctx.font = "12px monospace"
	   	ctx.fillText(`Angle ${tanks[currentPlayerIndex].displayAngle}`, 10, 45); 
	   	ctx.fillText(`Power ${tanks[currentPlayerIndex].power}`, 10, 60); 

    	if (time - timestamp < 3000) {
    		ctx.font = "32px monospace"
				ctx.textAlign = "center"	
				ctx.fillText(`Ready Player ${currentPlayerIndex + 1}`, 
				canvas.width / 2, canvas.height / 2); 
				}

  	break;

  	case GameState.FIRING:
	  if (bombs.length == 0 && explosions.length == 0 &&
	  		terrainMap.every( e => e.yDeforms.length == 0)) {
	  			currentState = GameState.END_TURN;
	  		}
	break;

  	case GameState.END_TURN:
		currentPlayerIndex = (currentPlayerIndex + 1) % tanks.length;
	  	currentState = GameState.START_TURN;
  	break;

  	case GameState.GAME_OVER:
  		ctx.fillStyle = tanks[0].colour;
  		ctx.font = "32px monospace";
		ctx.textAlign = "center";	
		ctx.fillText(`Game over, Player ${currentPlayerIndex + 1} wins!`, 
			canvas.width / 2, canvas.height / 2);
  	break;
  }

  requestAnimationFrame(gameLoop);
}

function setupButtons () {

	let intervalId = null;
	let eMouse = null;

	canvas.addEventListener('mousemove', e => eMouse = e );

	canvas.addEventListener ( "mousedown", () => {
		if (eMouse) {
			intervalId = setInterval( () => tanks[currentPlayerIndex].setAngle(eMouse), 40);
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

  document.getElementById('powerRange').addEventListener('input', (i) => {
  	tanks[currentPlayerIndex].power = i.target.value;
  });

	document.getElementById('fire').addEventListener( "click", (e) => {
		tanks[currentPlayerIndex].fire();
		document.getElementById('controls').style.display="none";
	});

	document.getElementById('powerminus').addEventListener( "click", (e) => {
		document.getElementById('powerRange').stepDown();
		tanks[currentPlayerIndex].power = document.getElementById('powerRange').value;
	});

	document.getElementById('powerplus').addEventListener( "click", (e) => {
		document.getElementById('powerRange').stepUp();
		tanks[currentPlayerIndex].power = document.getElementById('powerRange').value;
	});
}
