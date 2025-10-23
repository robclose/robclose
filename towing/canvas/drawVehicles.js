import { drawWheel } from './drawWheel.js'

export function drawCar (car, ctx, camera) {
    
    const t = car.rearAxle.theta;
    const t2 = car.rearAxle.theta2;

    ctx.strokeStyle = car.colour;

    // Draw the car axles
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveToIso(car.frontAxle.leftHub);
    ctx.lineToIso(car.frontAxle.rightHub);
    ctx.moveToIso(car.rearAxle.leftHub);
    ctx.lineToIso(car.rearAxle.rightHub);
    ctx.stroke();

    // Draw the car body
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveToIso(car.frontAxle.centre);
    ctx.lineToIso(car.hitch);
    ctx.lineToIso(car.rearAxle.centre.addVec3(15, t, t2 - Math.PI * 0.8));
    ctx.moveToIso(car.rearAxle.leftHub.addVec3(15, t, t2 - Math.PI * 0.8));
    ctx.lineToIso(car.rearAxle.rightHub.addVec3(15, t, t2 - Math.PI * 0.8));

    ctx.stroke();

    ['frontAxle', 'rearAxle'].forEach(axle => {
        ['leftHub', 'rightHub'].forEach(h => {
            const hub = car[axle][h];
            drawWheel(ctx, hub.toIso(camera), 8, car[axle].theta + car[axle].steering + Math.PI * 0.5);
        });
    });
}

export function drawTrailer(trailer, ctx, camera) {
    const t = trailer.axle.theta;
    const t2 = trailer.axle.theta2;

    // Cuboid corners
    const blf = trailer.axle.leftHub.addVec3(30, t, t2);
    const brf = trailer.axle.rightHub.addVec3(30, t, t2);
    const blr = trailer.axle.leftHub.addVec3(-30, t, t2);
    const brr = trailer.axle.rightHub.addVec3(-30, t, t2);
    const tlr = blr.addVec3(25, t, t2 - Math.PI * 0.5);
    const trr = brr.addVec3(25, t, t2 - Math.PI * 0.5);
    const tlf = blf.addVec3(25, t, t2 - Math.PI * 0.5);
    const trf = brf.addVec3(25, t, t2 - Math.PI * 0.5);

    // Wheelarches
    const wlf = trailer.axle.leftHub.addVec3(8, t, t2);
    const wlr = trailer.axle.leftHub.addVec3(-8, t, t2);
    const wrf = trailer.axle.rightHub.addVec3(8, t, t2);
    const wrr = trailer.axle.rightHub.addVec3(-8, t, t2);

    // Draw the trailer box
    ctx.strokeStyle = trailer.colour;
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Axle
    ctx.moveToIso(trailer.axle.leftHub);
    ctx.lineToIso(trailer.axle.rightHub);
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
    ctx.moveToIso(trailer.axle.centre.addVec3(30, t, t2));
    ctx.lineToIso(trailer.hitchedTo.hitch);
    ctx.stroke();

    ['leftHub', 'rightHub'].forEach(h => {
        const hub = trailer.axle[h];
        drawWheel(ctx, hub.toIso(camera), 8, trailer.axle.theta + Math.PI * 0.5);
    });
}
