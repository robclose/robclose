"use strict";
import { drawWheel } from './drawWheel.js';
import { Pos } from './Pos.js';
import { ctx } from './towing.js';

export class Car {
    constructor(map, colour) {
        this.speed = 0.5;
        this.length = 40;
        this.trailerLength = 60;
        this.width = 25;
        this.colour = colour;
        this.frontAxle = new Axle(map, 300, 300, 0, this.width, 0);
        this.rearAxle = new Axle(map, 300 - this.length, 300, 0, this.width, 0);
        this.hitch = this.rearAxle.centre.addVec(5, 0);
    }
    get coords() {
        return this.frontAxle.centre;
    }
    draw() {

        const t = this.rearAxle.theta;
        const t2 = this.rearAxle.theta2;

        ctx.strokeStyle = this.colour;

        // Draw the car axles
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveToIso(this.frontAxle.leftHub);
        ctx.lineToIso(this.frontAxle.rightHub);
        ctx.moveToIso(this.rearAxle.leftHub);
        ctx.lineToIso(this.rearAxle.rightHub);
        ctx.stroke();

        // Draw the car body
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveToIso(this.frontAxle.centre);
        ctx.lineToIso(this.hitch);
        ctx.lineToIso(this.rearAxle.centre.addVec3(15, t, t2 - Math.PI * 0.8));
        ctx.moveToIso(this.rearAxle.leftHub.addVec3(15, t, t2 - Math.PI * 0.8));
        ctx.lineToIso(this.rearAxle.rightHub.addVec3(15, t, t2 - Math.PI * 0.8));

        ctx.stroke();

        ['frontAxle', 'rearAxle'].forEach(axle => {
            ['leftHub', 'rightHub'].forEach(h => {
                const hub = this[axle][h];
                drawWheel(ctx, hub.toIso(), 8, this[axle].theta + this[axle].steering + Math.PI * 0.5);
            });
        });
    }

    move() {
        this.frontAxle.centre.moveVec(this.speed, this.frontAxle.theta + this.frontAxle.steering);
        this.frontAxle.ground();
        let t = this.rearAxle.centre.getAngleTo(this.frontAxle.centre);

        this.rearAxle.theta = t;
        this.frontAxle.theta = t;

        this.rearAxle.centre = this.frontAxle.centre.addVec(this.length, t + Math.PI);
        this.rearAxle.ground();
        this.rearAxle.theta2 = this.rearAxle.centre.getVertAngleTo(this.frontAxle.centre);
        this.hitch = this.rearAxle.centre.addVec3(-10, t, this.rearAxle.theta2);

        this.frontAxle.steering *= 0.93;
    }

    steerLeft() {
        this.frontAxle.steering = Math.max(this.frontAxle.steering - 0.05, -0.5);
    }
    steerRight() {
        this.frontAxle.steering = Math.min(this.frontAxle.steering + 0.05, 0.5);
    }
}
export class Trailer {
    constructor(map, hitchedTo, colour) {
        this.length = 50;
        this.width = hitchedTo.width;
        this.colour = colour;
        this.hitchedTo = hitchedTo;
        this.axle = new Axle(map, hitchedTo.hitch.x - this.length, 300, 0, this.width, 0);
        this.hitch = this.axle.centre.addVec(10, 0);
    }
    move() {

        let t = this.axle.centre.getAngleTo(this.hitchedTo.hitch);
        let t2 = this.axle.centre.getVertAngleTo(this.hitchedTo.hitch);
        this.axle.theta = t;
        this.axle.theta2 = t2;

        this.axle.centre = this.hitchedTo.hitch.addVec(this.length, t + Math.PI);
        this.axle.ground();
        this.hitch = this.axle.centre.addVec3(-30, t, t2);

    }

    draw() {
        const t = this.axle.theta;
        const t2 = this.axle.theta2;

        // Cuboid corners
        const blf = this.axle.leftHub.addVec3(30, t, t2);
        const brf = this.axle.rightHub.addVec3(30, t, t2);
        const blr = this.axle.leftHub.addVec3(-30, t, t2);
        const brr = this.axle.rightHub.addVec3(-30, t, t2);
        const tlr = blr.addVec3(25, t, t2 - Math.PI * 0.5);
        const trr = brr.addVec3(25, t, t2 - Math.PI * 0.5);
        const tlf = blf.addVec3(25, t, t2 - Math.PI * 0.5);
        const trf = brf.addVec3(25, t, t2 - Math.PI * 0.5);

        // Wheelarches
        const wlf = this.axle.leftHub.addVec3(8, t, t2);
        const wlr = this.axle.leftHub.addVec3(-8, t, t2);
        const wrf = this.axle.rightHub.addVec3(8, t, t2);
        const wrr = this.axle.rightHub.addVec3(-8, t, t2);

        // Draw the trailer box
        ctx.strokeStyle = this.colour;
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Axle
        ctx.moveToIso(this.axle.leftHub);
        ctx.lineToIso(this.axle.rightHub);
        // Base
        ctx.moveToIso(brf);
        ctx.lineToIso(blf);
        ctx.lineToIso(wlf);
        ctx.moveToIso(wlr);
        ctx.lineToIso(blr);
        ctx.lineToIso(brr);
        ctx.lineToIso(wrr);
        ctx.moveToIso(wrf);
        ctx.lineToIso(brf);

        // Uprights
        ctx.moveToIso(blr);
        ctx.lineToIso(tlr);
        ctx.lineToIso(tlf);
        ctx.lineToIso(blf);

        ctx.moveToIso(brr);
        ctx.lineToIso(trr);
        ctx.lineToIso(trf);
        ctx.lineToIso(brf);

        // Roof ends
        ctx.moveToIso(tlf);
        ctx.lineToIso(trf);

        ctx.moveToIso(tlr);
        ctx.lineToIso(trr);

        // Tow bar
        ctx.moveToIso(this.axle.centre.addVec3(30, t, t2));
        ctx.lineToIso(this.hitchedTo.hitch);
        ctx.stroke();

        ['leftHub', 'rightHub'].forEach(h => {
            const hub = this.axle[h];
            drawWheel(ctx, hub.toIso(), 8, this.axle.theta + Math.PI * 0.5);
        });
    }
}
class Axle {
    constructor(map, x, y, theta, width, steering = 0) {
        this.centre = new Pos(x, y);
        this.theta = theta;
        this.theta2 = 0;
        this.steering = steering;
        this.map = map;
        this.offset = width * 0.5;
    }
    get leftHub() {
        return this.centre.addVec(this.offset, this.theta - Math.PI * 0.5);
    }
    get rightHub() {
        return this.centre.addVec(this.offset, this.theta + Math.PI * 0.5);
    }
    get leftWheel() {
        return [this.leftHub.addVec(8, this.theta + this.steering),
        this.leftHub.addVec(-8, this.theta + this.steering)];
    }
    get rightWheel() {
        return [this.rightHub.addVec(8, this.theta + this.steering),
        this.rightHub.addVec(-8, this.theta + this.steering)];
    }
    ground() {
        this.centre.z = this.map.getHeight(this.centre.x, this.centre.y);
    }
}
