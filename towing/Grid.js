"use strict";
import { Pos } from './Pos.js';
import { roadMap } from './roadmap.js';
import { camera } from './towing.js';
 
const gridSize = 30;

export class Grid {
    constructor(ctx, terrainSize, tileSize = gridSize) {
        this.terrain = this.terrainGen(terrainSize, terrainSize, 30);
        this.tileSize = tileSize;
        this.ctx = ctx;
    }

    terrainGen(w, h, numHills) {

        let map = Array.from({ length: h }, () => Array(w).fill(0));

        for (let i = 0; i < numHills; i++) {
            const cx = Math.random() * w;
            const cy = Math.random() * h;
            const r = Math.random() * 8 + 4;
            const hgt = Math.random() * 12 - 5;

            // apply to all nearby grid cells, wrapping around edges
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let dx = Math.abs(x - cx);
                    let dy = Math.abs(y - cy);
                    if (dx > w / 2) dx = w - dx;
                    if (dy > h / 2) dy = h - dy;

                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < r) {
                        map[y][x] += hgt * (1 - d / r);
                    }
                }
            }
        }
        return map;
    }

    getHeight(x, y) {
        const gx = x / this.tileSize;
        const gy = y / this.tileSize;
        const x0 = Math.floor(gx), x1 = Math.ceil(gx);
        const y0 = Math.floor(gy), y1 = Math.ceil(gy);

        const max = this.terrain.length;
        const wrap = (v) => ((v % max) + max) % max;
        const h00 = this.terrain[wrap(y0)][wrap(x0)];
        const h10 = this.terrain[wrap(y0)][wrap(x1)];
        const h01 = this.terrain[wrap(y1)][wrap(x0)];
        const h11 = this.terrain[wrap(y1)][wrap(x1)];

        // Bilinear interpolation
        const tx = gx - x0;
        const ty = gy - y0;
        const a = h00 * (1 - tx) + h10 * tx;
        const b = h01 * (1 - tx) + h11 * tx;
        return 10 * (a * (1 - ty) + b * ty);
    }

    isRoad(x, y) {
        const max = roadMap.length;
        const wrap = (v) => ((v % max) + max) % max;
        return !!roadMap[wrap(x)][wrap(y)];
    }

    draw() {
        // Calculate the range of the grid visible on screen
        const gridStartX = (Math.floor(camera.x / this.tileSize) - 660 / this.tileSize);
        const gridEndX = (Math.floor(camera.x / this.tileSize) + 660 / this.tileSize);
        const gridStartY = (Math.floor(camera.y / this.tileSize) - 660 / this.tileSize);
        const gridEndY = (Math.floor(camera.y / this.tileSize) + 660 / this.tileSize);
        let point = new Pos(0, 0, 0);

        for (let i = gridStartX; i <= gridEndX; i++) {
            for (let j = gridStartY; j <= gridEndY; j++) {
                let alpha;
                let colour;
                (i + j) % 2 == 0 ? alpha = '90%' : alpha = '100%';
                const x0 = i * this.tileSize;
                const x1 = (i + 1) * this.tileSize;
                const y0 = j * this.tileSize;
                const y1 = (j + 1) * this.tileSize;
                let z = [this.getHeight(x0, y0),
                this.getHeight(x1, y0),
                this.getHeight(x1, y1),
                this.getHeight(x0, y1)];
                z = z.map(z0 => Math.max(z0, -40));

                colour = `${Math.floor(120 - z[0] * 0.5)} 70% ${Math.floor(50 + z[0] * 0.15)}%`;
                if (this.isRoad(i, j) && Math.max(...z) > -40) {
                    colour = '80 30% 70%';
                }
                if (Math.max(...z) <= -40) {
                    colour = '210 70% 40%';
                }

                this.ctx.fillStyle = `hsl(${colour} / ${alpha})`;
                this.ctx.beginPath();
                // Draw a filled quad for each grid square
                this.ctx.moveToIso(point.move(x0, y0, z[0]));
                this.ctx.lineToIso(point.move(x1, y0, z[1]));
                this.ctx.lineToIso(point.move(x1, y1, z[2]));
                this.ctx.lineToIso(point.move(x0, y1, z[3]));
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
    }
}
