"use strict";
import { camera } from "./towing.js";

export class Pos {
    constructor(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    addVec(length, theta) {
        return new Pos(this.x + length * -Math.cos(theta),
            this.y + length * -Math.sin(theta),
            this.z);
    }
    moveVec(length, theta) {
        this.x += length * -Math.cos(theta);
        this.y += length * -Math.sin(theta);
        return this;
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
    getVertAngleTo(pos) {
        return Math.atan2(this.z - pos.z,
            Math.hypot(this.x - pos.x, this.y - pos.y));
    }
    toIso() {
        const x = this.x - camera.x + 250;
        const y = this.y - camera.y + 250;
        const sx = (x - y);
        const sy = (x + y) * 0.5 * 1.0 - this.z;
        return { x: sx + 500, y: sy + 100 };
    }
    moveToIso(ctx) {
        const isoPos = this.toIso();
        ctx.moveTo(isoPos.x, isoPos.y);
        return this;
    }
    lineToIso(ctx) {
        const isoPos = this.toIso();
        ctx.lineTo(isoPos.x, isoPos.y);
        return this;
    }
    move(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

}
