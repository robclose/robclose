"use strict";

import { Pos } from '../Pos.js';

export function drawGrid(grid, ctx, camera) {

    // Calculate the range of the grid visible on screen
    const gridStartX = (Math.floor(camera.x / grid.tileSize) - 660 / grid.tileSize);
    const gridEndX = (Math.floor(camera.x / grid.tileSize) + 660 / grid.tileSize);
    const gridStartY = (Math.floor(camera.y / grid.tileSize) - 660 / grid.tileSize);
    const gridEndY = (Math.floor(camera.y / grid.tileSize) + 660 / grid.tileSize);
    let point = new Pos(0, 0, 0);

    for (let i = gridStartX; i <= gridEndX; i++) {
        for (let j = gridStartY; j <= gridEndY; j++) {
            let alpha;
            let colour;
            (i + j) % 2 == 0 ? alpha = '90%' : alpha = '100%';
            const x0 = i * grid.tileSize;
            const x1 = (i + 1) * grid.tileSize;
            const y0 = j * grid.tileSize;
            const y1 = (j + 1) * grid.tileSize;
            let z = [grid.getHeight(x0, y0),
                    grid.getHeight(x1, y0),
                    grid.getHeight(x1, y1),
                    grid.getHeight(x0, y1)];
            z = z.map(z0 => Math.max(z0, -40));

            colour = `${Math.floor(120 - z[0] * 0.5)} 70% ${Math.floor(50 + z[0] * 0.15)}%`;
            if (grid.isRoad(i, j) && Math.max(...z) > -40) {
                colour = '80 30% 70%';
            }
            if (Math.max(...z) <= -40) {
                colour = '210 70% 40%';
            }

            ctx.fillStyle = `hsl(${colour} / ${alpha})`;
            ctx.beginPath();
            // Draw a filled quad for each grid square
            ctx.moveToIso(point.move(x0, y0, z[0]));
            ctx.lineToIso(point.move(x1, y0, z[1]));
            ctx.lineToIso(point.move(x1, y1, z[2]));
            ctx.lineToIso(point.move(x0, y1, z[3]));
            ctx.closePath();
            ctx.fill();
        }
    }
}