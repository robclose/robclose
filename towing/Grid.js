"use strict";

import { roadMap } from './roadmap.js';
 
const gridSize = 30;

export class Grid {
    constructor(terrainSize, tileSize = gridSize) {
        this.terrain = this.terrainGen(terrainSize, terrainSize, 30);
        this.tileSize = tileSize;
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

   
}
