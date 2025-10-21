"use strict";

// Draw a wheel as properly projected ellipse
export function drawWheel(ctx, center, r, headingRad, colour = '#aaa') {

    const normalize = (v) => {
        const L = Math.hypot(v.x, v.y, v.z);
        return { x: v.x / L, y: v.y / L, z: v.z / L };
    };

    const projectVector = (vec3) => {
        return {
            x: (vec3.x - vec3.y) * 1,
            y: (vec3.x + vec3.y) * 0.5 - vec3.z * 1
        };
    };

    // forward vector in world XY plane
    const f = { x: Math.cos(headingRad), y: Math.sin(headingRad), z: 0 };

    // choose two orthonormal basis vectors spanning wheel plane:
    // we want the wheel plane to be perpendicular to forward 'f' and include vertical axis.
    // Let v = world up (0,0,1)
    const vUp = { x: 0, y: 0, z: 1 };

    // u = normalized( f cross vUp )  -- this runs across the wheel (left-right)
    // cross(f, vUp) = (f.y*1 - 0, 0 - f.x*1, f.x*0 - f.y*0) = (f.y, -f.x, 0)
    let u = { x: f.y, y: -f.x, z: 0 };
    u = normalize(u);
    // v vector in plane: vertical axis mapped into wheel plane: use vUp (0,0,1)
    const v = vUp; 

    // project u and v into screen space (linear)
    const pu = projectVector(u); // {x,y}
    const pv = projectVector(v); // {x,y}

    // Matrix A = [ pu pv ]  where A maps [cos t; sin t] -> screen (without center)
    // Compute symmetric matrix M = A * A^T = pu*pu^T + pv*pv^T
    const m00 = pu.x * pu.x + pv.x * pv.x;
    const m01 = pu.x * pu.y + pv.x * pv.y;
    const m11 = pu.y * pu.y + pv.y * pv.y;

    // eigenvalues of 2x2 symmetric matrix:
    const trace = m00 + m11;
    const det = m00 * m11 - m01 * m01;
    const disc = Math.max(0, trace * trace - 4 * det);
    const sqrtDisc = Math.sqrt(disc);
    const lambda1 = (trace + sqrtDisc) / 2;
    const lambda2 = (trace - sqrtDisc) / 2;

    // singular values = sqrt(eigenvalues), multiplied by radius
    const s1 = r * Math.sqrt(lambda1);
    const s2 = r * Math.sqrt(Math.max(0, lambda2)); // numerical safety

    // eigenvector for lambda1 (major axis direction)
    let ax = 1, ay = 0; // fallback
    if (Math.abs(m01) > 1e-6 || Math.abs(lambda1 - m00) > 1e-6) {
        ax = m01;
        ay = lambda1 - m00;
        // if that is near-zero, try alternate form
        if (Math.abs(ax) < 1e-8 && Math.abs(ay) < 1e-8) {
            ax = lambda1 - m11;
            ay = m01;
        }
    } else {
        // special case: matrix is diagonal
        ax = 1;
        ay = 0;
    }
    // normalize axis
    const aLen = Math.hypot(ax, ay) || 1;
    ax /= aLen;
    ay /= aLen;

    // angle for canvas ellipse
    const angle = Math.atan2(ay, ax);

    // draw filled ellipse & outline
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, s1, s2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#88888866';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#444';
    ctx.stroke();
    ctx.restore();
}