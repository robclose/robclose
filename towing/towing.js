"use strict";

import { Car, Trailer } from './vehicles.js';
import { Grid } from './Grid.js';
import { drawCar, drawTrailer } from './canvas/drawVehicles.js';
import { drawGrid } from './canvas/drawGrid.js';

const ctx = document.getElementById('canvas').getContext('2d');
const gameWidth = document.getElementById('canvas').width;
const gameHeight = document.getElementById('canvas').height;
let keys = new Set();
let trailers1 = [];

function gameLoop() {

    car1.move(map);
    trailers1.forEach(t => t.move(map));

    ctx.clearRect(0 ,0, gameWidth, gameHeight);
    drawGrid(map, ctx, camera);
    drawCar(car1, ctx, camera);
    trailers1.forEach(t => drawTrailer(t, ctx, camera));

    if (keys.has('ArrowLeft')) { car1.steerLeft(); }
    else if (keys.has('ArrowRight')) { car1.steerRight(); }

    if (keys.has('ArrowUp')) {
        car1.speed = Math.min(car1.speed + 0.1, 5);
    }
      else if (keys.has('ArrowDown')) {
        car1.speed = Math.max(car1.speed - 0.1, -5);
    }
  
    requestAnimationFrame(gameLoop);
}

let map = new Grid(30);
let car1 = new Car('firebrick');
trailers1.push(new Trailer(car1, 'darkmagenta'));

const camera = car1.frontAxle.centre;
ctx.lineToIso = function(pos)  {
        const isoPos = pos.toIso(camera);
        this.lineTo(isoPos.x, isoPos.y);
    }
ctx.moveToIso = function(pos) {
    const isoPos = pos.toIso(camera);
    this.moveTo(isoPos.x, isoPos.y);
}

requestAnimationFrame(gameLoop);

window.addEventListener('keydown', (e) => {
    if (e.key == 'q') {
        trailers1.push(new Trailer(trailers1.at(-1) ?? car1, 'darkmagenta'));
    }
    else if (e.key == 'a') {
        trailers1.pop();
    } else { 
        keys.add(e.key);
    }
});

window.addEventListener('keyup', (e) => {
    keys.delete(e.key);
});

