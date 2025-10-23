"use strict";
import { Pos } from './Pos.js';

export class Car {
    constructor(colour) {
        this.speed = 0.5;
        this.length = 40;
        this.trailerLength = 60;
        this.width = 25;
        this.colour = colour;
        this.frontAxle = new Axle(300, 300, 0, this.width, 0);
        this.rearAxle = new Axle(300 - this.length, 300, 0, this.width, 0);
        this.hitch = this.rearAxle.centre.addVec(5, 0);
    }

    move(map) {
        this.frontAxle.centre.moveVec(this.speed, this.frontAxle.theta + this.frontAxle.steering);
        this.frontAxle.ground(map);
        let t = this.rearAxle.centre.getAngleTo(this.frontAxle.centre);

        this.rearAxle.theta = t;
        this.frontAxle.theta = t;

        this.rearAxle.centre = this.frontAxle.centre.addVec(this.length, t + Math.PI);
        this.rearAxle.ground(map);
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
    constructor(hitchedTo, colour) {
        this.length = 50;
        this.width = hitchedTo.width;
        this.colour = colour;
        this.hitchedTo = hitchedTo;
        this.axle = new Axle(hitchedTo.hitch.x - this.length, 300, 0, this.width, 0);
        this.hitch = this.axle.centre.addVec(10, 0);
    }
    move(map) {

        let t = this.axle.centre.getAngleTo(this.hitchedTo.hitch);
        let t2 = this.axle.centre.getVertAngleTo(this.hitchedTo.hitch);
        this.axle.theta = t;
        this.axle.theta2 = t2;

        this.axle.centre = this.hitchedTo.hitch.addVec(this.length, t + Math.PI);
        this.axle.ground(map);
        this.hitch = this.axle.centre.addVec3(-30, t, t2);

    }
}
class Axle {
    constructor(x, y, theta, width, steering = 0) {
        this.centre = new Pos(x, y);
        this.theta = theta;
        this.theta2 = 0;
        this.steering = steering;
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
    ground(map) {
        this.centre.z = map.getHeight(this.centre.x, this.centre.y);
    }
}
