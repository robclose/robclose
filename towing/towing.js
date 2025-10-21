"use strict";

import { Car, Trailer } from './vehicles.js';
import { Grid } from './Grid.js';

export const ctx = document.getElementById('canvas').getContext('2d');
const gameWidth = document.getElementById('canvas').width;
const gameHeight = document.getElementById('canvas').height;
let keys = [];
let train1 = [];
export let camera = null;

function gameLoop() {

    ctx.clearRect(0 ,0, gameWidth, gameHeight);
    camera = map.follow.coords;
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


let map = new Grid(ctx, 30);
train1.push(new Car(map, 'firebrick') );

map.follow = train1[0];
requestAnimationFrame(gameLoop);

window.addEventListener('keydown', (e) => {
    if (e.key == 'q') {
        train1.push(new Trailer(map, train1[train1.length - 1], 'darkmagenta'));
    }
    else if (!keys.includes(e.key)) keys.push(e.key);
});

window.addEventListener('keyup', (e) => {
    keys = keys.filter( (k) => e.key !== k);
});

