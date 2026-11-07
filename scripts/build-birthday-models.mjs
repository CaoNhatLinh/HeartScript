import { mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// GLTFExporter uses FileReader to pack its final binary buffer.
globalThis.FileReader = class {
    async readAsArrayBuffer(blob) {
        this.result = await blob.arrayBuffer();
        this.onloadend();
    }
};

const output = new URL('../public/birthday/models/', import.meta.url);
const material = (name, color, roughness = 0.62, metalness = 0) =>
    new THREE.MeshStandardMaterial({ name, color, roughness, metalness });
const ivory = material('Vanilla buttercream', '#ffe2c4');
const icing = material('Peach rose icing', '#f6c4b9');
const frosting = material('Whipped frosting', '#fff3df');
const pearl = material('Sugar pearls', '#fff0cd', 0.36);
const zest = material('Candied orange peel', '#e8904d', 0.48);
const pith = material('Orange pith', '#ffe2aa');
const pulp = material('Candied orange segments', '#ffc071', 0.46);
const strawberry = material('Strawberry glaze', '#d85970', 0.43);
const strawberryCream = material('Strawberry buttercream', '#eaa2aa');
const blush = material('Rose petals', '#e38f91');
const petal = material('Pale rose petals', '#ffd1bf');
const berry = material('Deep rose petals', '#a9435c');
const sage = material('Sage leaves', '#667961');
const gold = material('Brushed brass', '#dbac6c', 0.36, 0.4);
const porcelain = material('Plum glazed porcelain', '#5d344e', 0.32);
const wick = material('Cotton wick', '#422837');
const paper = material('Blush stationery', '#e8b6a5');
const darkPaper = material('Folded stationery', '#d4968e');
const flapPaper = material('Envelope flap', '#f2c4ae');
const cream = material('Cotton paper', '#f7ddbb');
const wax = material('Burgundy wax', '#a73b58', 0.45);

function mesh(parent, geometry, finish, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, finish);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
}

function cylinder(parent, finish, top, bottom, height, y, x = 0, z = 0) {
    return mesh(parent, new THREE.CylinderGeometry(top, bottom, height, 64), finish, x, y, z);
}

function ring(parent, finish, radius, width, y) {
    const object = mesh(parent, new THREE.TorusGeometry(radius, width, 8, 72), finish, 0, y);
    object.rotation.x = Math.PI / 2;
}

function oval(parent, finish, x, y, z, sx, sy, sz) {
    const object = mesh(parent, new THREE.SphereGeometry(1, 12, 8), finish, x, y, z);
    object.scale.set(sx, sy, sz);
    return object;
}

function strand(parent, finish, points, width) {
    const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    return mesh(parent, new THREE.TubeGeometry(path, points.length * 3, width, 7), finish);
}

function decorateTier(cake, radius, bottom, height, color) {
    const top = bottom + height;
    cylinder(cake, color, radius - 0.03, radius, height, bottom + height / 2);
    cylinder(cake, frosting, radius - 0.06, radius - 0.017, 0.065, top - 0.016);
    ring(cake, frosting, radius - 0.038, 0.046, top - 0.026);
    ring(cake, icing, radius - 0.003, 0.043, bottom + 0.029);

    const scallops = radius > 1 ? 12 : 9;
    for (let index = 0; index < scallops; index++) {
        const start = index * Math.PI * 2 / scallops;
        const arc = Math.PI * 2 / scallops;
        for (const [depth, offset, finish] of [[0.16, 0, frosting], [0.13, -0.06, icing]]) {
            const points = Array.from({ length: 9 }, (_, step) => {
                const portion = step / 8;
                const angle = start + portion * arc;
                return [
                    Math.sin(angle) * (radius - 0.006),
                    top - 0.085 + offset - Math.sin(portion * Math.PI) * depth,
                    Math.cos(angle) * (radius - 0.006),
                ];
            });
            strand(cake, finish, points, 0.023);
        }
        oval(cake, blush, Math.sin(start) * radius, top - 0.106, Math.cos(start) * radius, 0.047, 0.047, 0.045);
        const center = start + arc / 2;
        for (const [offset, drop, size] of [[-0.061, 0.29, 0.019], [0, 0.325, 0.026], [0.061, 0.29, 0.019]]) {
            oval(cake, pearl, Math.sin(center + offset) * radius, top - drop, Math.cos(center + offset) * radius, size, size, size);
        }
    }

    for (let index = 0; index < scallops * 4; index++) {
        const angle = index * Math.PI * 2 / (scallops * 4);
        const shell = oval(cake, frosting, Math.sin(angle) * radius, bottom + 0.037, Math.cos(angle) * radius, 0.064, 0.041, 0.044);
        shell.rotation.y = angle;
        shell.rotation.z = -0.35;
    }
}

function rose(parent, x, y, z, scale, finish, tilt) {
    const flower = new THREE.Group();
    flower.position.set(x, y, z);
    flower.scale.setScalar(scale);
    flower.rotation.x = tilt;
    parent.add(flower);
    for (let layer = 0; layer < 3; layer++) {
        const petals = 4 + layer * 3;
        for (let index = 0; index < petals; index++) {
            const angle = (index + layer * 0.36) * Math.PI * 2 / petals;
            const radius = 0.04 + layer * 0.052;
            const leaf = oval(flower, layer === 0 ? berry : finish,
                Math.cos(angle) * radius, -layer * 0.035, Math.sin(angle) * radius,
                0.065 + layer * 0.012, 0.104 - layer * 0.013, 0.033);
            leaf.rotation.set(0.52 + layer * 0.25, -angle + Math.PI / 2, -0.28);
        }
    }
    const leaf = oval(flower, sage, -0.17, -0.083, 0.013, 0.14, 0.022, 0.054);
    leaf.rotation.y = 0.38;
    oval(flower, sage, 0.15, -0.079, 0.06, 0.126, 0.02, 0.047).rotation.y = -0.55;
}

function candiedOrange(cake, position, rotation, radius) {
    const slice = new THREE.Group();
    slice.position.set(...position);
    slice.rotation.set(...rotation);
    cake.add(slice);

    mesh(slice, new THREE.CylinderGeometry(radius, radius, 0.033, 40), zest).rotation.x = Math.PI / 2;
    mesh(slice, new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, 0.037, 40), pith).rotation.x = Math.PI / 2;
    for (let index = 0; index < 7; index++) {
        const start = index * Math.PI * 2 / 7;
        const wedge = new THREE.Shape();
        wedge.moveTo(Math.cos(start + 0.42) * 0.023, Math.sin(start + 0.42) * 0.023);
        wedge.absarc(0, 0, radius * 0.77, start + 0.035, start + 0.85, false);
        wedge.closePath();
        const segments = new THREE.ShapeGeometry(wedge, 10);
        mesh(slice, segments, pulp, 0, 0, 0.02);
        mesh(slice, segments, pulp, 0, 0, -0.02).rotation.y = Math.PI;
    }
}

function heartOutline() {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.81);
    shape.bezierCurveTo(-0.25, -0.63, -0.82, -0.29, -0.86, 0.13);
    shape.bezierCurveTo(-0.96, 0.72, -0.37, 0.91, 0, 0.56);
    shape.bezierCurveTo(0.37, 0.91, 0.96, 0.72, 0.86, 0.13);
    shape.bezierCurveTo(0.82, -0.29, 0.25, -0.63, 0, -0.81);
    return shape;
}

function decorateHeartTier(cake, heart) {
    const tier = mesh(cake, new THREE.ExtrudeGeometry(heart, {
        depth: 0.49, bevelEnabled: true, bevelThickness: 0.041, bevelSize: 0.035,
        bevelSegments: 4, curveSegments: 20,
    }), strawberryCream, 0, 0.78);
    tier.rotation.x = -Math.PI / 2;
    const cap = mesh(cake, new THREE.ExtrudeGeometry(heart, {
        depth: 0.058, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.033,
        bevelSegments: 3, curveSegments: 20,
    }), frosting, 0, 1.29);
    cap.rotation.x = -Math.PI / 2;

    const rim = (point, y) => [point.x * 1.035, y, -point.y * 1.035];
    const outline = heart.getSpacedPoints(80);
    strand(cake, pearl, outline.map(point => rim(point, 1.319)), 0.025);
    strand(cake, blush, outline.map(point => rim(point, 0.823)), 0.029);
    for (let index = 0; index < 12; index++) {
        const scallop = Array.from({ length: 9 }, (_, step) => {
            const phase = step / 8;
            const point = heart.getPointAt((index + phase) / 12);
            return rim(point, 1.222 - Math.sin(phase * Math.PI) * 0.112);
        });
        strand(cake, frosting, scallop, 0.018);
        const [x, y, z] = scallop[0];
        oval(cake, pearl, x, y, z, 0.024, 0.024, 0.024);
    }
}

function sugaredStrawberry(cake, position, rotation, scale) {
    const fruit = new THREE.Group();
    fruit.position.set(...position);
    fruit.rotation.set(...rotation);
    fruit.scale.setScalar(scale);
    cake.add(fruit);
    const profile = [[0, -0.17], [0.062, -0.145], [0.113, -0.084], [0.143, -0.006],
        [0.139, 0.061], [0.098, 0.102], [0, 0.112]];
    mesh(fruit, new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 32), strawberry);
    for (let index = 0; index < 12; index++) {
        const angle = index * Math.PI / 3 + (index < 6 ? 0 : 0.35);
        const radius = index < 6 ? 0.14 : 0.115;
        const seed = oval(fruit, pearl, Math.cos(angle) * radius, index < 6 ? 0.026 : -0.083,
            Math.sin(angle) * radius, 0.008, 0.015, 0.008);
        seed.rotation.z = 0.22;
    }
    for (let index = 0; index < 5; index++) {
        const angle = index * Math.PI * 2 / 5;
        const leaf = oval(fruit, sage, Math.cos(angle) * 0.06, 0.106, Math.sin(angle) * 0.06,
            0.071, 0.02, 0.028);
        leaf.rotation.y = -angle;
    }
}

function makeCake() {
    const cake = new THREE.Group();
    cake.name = 'Strawberry heart birthday cake';
    const standProfile = [
        [0, -0.62], [0.73, -0.62], [0.79, -0.6], [0.79, -0.55], [0.72, -0.51],
        [0.58, -0.49], [0.43, -0.45], [0.31, -0.4], [0.26, -0.33], [0.25, -0.26],
        [0.28, -0.19], [0.35, -0.13], [0.48, -0.09], [0.72, -0.072], [1.25, -0.066],
        [1.37, -0.043], [1.42, -0.015], [1.44, 0.024], [1.42, 0.058], [1.38, 0.069], [0, 0.069],
    ];
    mesh(cake, new THREE.LatheGeometry(standProfile.map(([x, y]) => new THREE.Vector2(x, y)), 72), porcelain);
    ring(cake, gold, 1.419, 0.017, 0.027);
    ring(cake, gold, 1.38, 0.011, -0.037);
    ring(cake, gold, 0.78, 0.015, -0.565);
    ring(cake, gold, 0.252, 0.011, -0.265);
    decorateTier(cake, 1.22, 0.065, 0.68, ivory);
    const heart = heartOutline();
    decorateHeartTier(cake, heart);
    const seal = mesh(cake, new THREE.ExtrudeGeometry(heart, {
        depth: 0.13, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04,
        bevelSegments: 3, curveSegments: 16,
    }), strawberry, 0, 0.357, 1.194);
    seal.scale.setScalar(0.237);
    strand(cake, gold, heart.getSpacedPoints(48).map(point => [point.x * 0.205, 0.357 + point.y * 0.205, 1.236]), 0.008);
    rose(cake, -0.88, 0.77, 0.61, 1.02, blush, 0.79);
    rose(cake, -0.62, 0.735, 0.93, 0.74, petal, 0.65);
    rose(cake, -1.06, 0.64, 0.49, 0.63, berry, 0.89);
    rose(cake, 0.51, 1.4, 0.26, 0.86, blush, 0.72);
    rose(cake, 0.22, 1.4, 0.63, 0.55, petal, 0.5);
    rose(cake, 0.89, 0.75, -0.36, 0.72, petal, 0.52);
    candiedOrange(cake, [-0.54, 1.52, 0.22], [-0.25, -0.29, 0.24], 0.2);
    candiedOrange(cake, [-0.37, 1.46, 0.41], [-0.6, 0.28, -0.26], 0.133);
    sugaredStrawberry(cake, [0.35, 1.48, 0.48], [0.17, -0.1, -0.58], 0.84);
    sugaredStrawberry(cake, [0.69, 1.47, -0.1], [-0.23, 0.24, -0.25], 0.73);
    for (const [x, z, size] of [[-0.12, 0.6, 0.032], [0.08, 0.7, 0.036], [0.04, 0.54, 0.026], [0.57, 0.17, 0.029]]) {
        oval(cake, pearl, x, 1.405, z, size, size, size);
    }

    for (const [index, [x, z, height]] of [[-0.39, -0.11, 0.56], [0, -0.31, 0.76], [0.39, -0.15, 0.58]].entries()) {
        const base = 1.37;
        cylinder(cake, index === 1 ? ivory : blush, 0.046, 0.052, height, base + height / 2, x, z);
        const stripe = Array.from({ length: 29 }, (_, step) => {
            const progress = step / 28;
            const angle = progress * Math.PI * 8;
            return [x + Math.cos(angle) * 0.049, base + 0.017 + progress * (height - 0.035), z + Math.sin(angle) * 0.049];
        });
        strand(cake, gold, stripe, 0.008);
        cylinder(cake, wick, 0.011, 0.011, 0.076, base + height + 0.024, x, z);
        const flame = new THREE.Object3D();
        flame.name = `Wick${index + 1}`;
        flame.position.set(x, base + height + 0.13, z);
        cake.add(flame);
    }
    return cake;
}

function makeFrame() {
    const frame = new THREE.Group();
    frame.name = 'Keepsake frame';
    mesh(frame, new THREE.BoxGeometry(2.38, 2.88, 0.16), porcelain, 0, 0.97);
    mesh(frame, new THREE.BoxGeometry(2.22, 2.72, 0.055), cream, 0, 0.97, 0.09);
    const opening = new THREE.Object3D();
    opening.name = 'Photograph';
    opening.position.set(0, 1.065, 0.123);
    frame.add(opening);
    for (const sign of [-1, 1]) {
        mesh(frame, new THREE.BoxGeometry(0.07, 2.86, 0.071), gold, sign * 1.158, 0.97, 0.091);
        mesh(frame, new THREE.BoxGeometry(2.32, 0.07, 0.071), gold, 0, 0.97 + sign * 1.41, 0.091);
        for (const top of [-1, 1]) {
            oval(frame, gold, sign * 1.15, 0.97 + top * 1.4, 0.132, 0.089, 0.089, 0.035);
            oval(frame, porcelain, sign * 1.15, 0.97 + top * 1.4, 0.164, 0.03, 0.03, 0.012);
        }
    }
    rose(frame, 1.045, -0.315, 0.18, 1.05, blush, Math.PI / 2);
    rose(frame, 0.78, -0.387, 0.16, 0.62, petal, Math.PI / 2);
    return frame;
}

function makeRibbonFrame() {
    const frame = new THREE.Group();
    frame.name = 'Rose ribbon frame';
    mesh(frame, new THREE.BoxGeometry(2.34, 2.82, 0.14), blush, 0, 0.97);
    mesh(frame, new THREE.BoxGeometry(2.18, 2.65, 0.06), frosting, 0, 0.97, 0.09);
    const opening = new THREE.Object3D();
    opening.name = 'Photograph';
    opening.position.set(0, 1.065, 0.125);
    frame.add(opening);
    for (const sign of [-1, 1]) {
        for (let index = 0; index < 11; index++) {
            oval(frame, petal, sign * 1.133, -0.23 + index * 0.235, 0.095, 0.066, 0.103, 0.05);
        }
        const bow = oval(frame, blush, 0.76 + sign * 0.15, 2.27, 0.15, 0.185, 0.094, 0.045);
        bow.rotation.z = sign * 0.43;
        strand(frame, blush, [[0.76, 2.26, 0.16], [0.76 + sign * 0.06, 2.16, 0.15], [0.76 + sign * 0.13, 2.11, 0.14]], 0.035);
    }
    oval(frame, pearl, 0.76, 2.27, 0.188, 0.065, 0.061, 0.035);
    rose(frame, -0.94, -0.25, 0.16, 0.87, petal, Math.PI / 2);
    return frame;
}

function makeOvalFrame() {
    const frame = new THREE.Group();
    frame.name = 'Oval botanical frame';
    const backing = mesh(frame, new THREE.CylinderGeometry(1, 1, 0.15, 72), sage, 0, 1.065);
    backing.rotation.x = Math.PI / 2;
    backing.scale.set(1.18, 1, 1.39);
    const mat = mesh(frame, new THREE.CylinderGeometry(1, 1, 0.05, 72), cream, 0, 1.065, 0.095);
    mat.rotation.x = Math.PI / 2;
    mat.scale.set(1.05, 1, 1.25);
    const rim = mesh(frame, new THREE.TorusGeometry(1, 0.026, 10, 72), gold, 0, 1.065, 0.106);
    rim.scale.set(1.133, 1.34, 1);
    const opening = new THREE.Object3D();
    opening.name = 'Photograph';
    opening.position.set(0, 1.065, 0.123);
    frame.add(opening);
    for (let index = 0; index < 24; index++) {
        const angle = index * Math.PI / 12;
        oval(frame, gold, 1.127 * Math.cos(angle), 1.065 + 1.335 * Math.sin(angle), 0.125, 0.033, 0.033, 0.024);
    }
    rose(frame, 0.72, 0.02, 0.15, 0.84, blush, Math.PI / 2);
    rose(frame, 0.52, -0.095, 0.16, 0.6, petal, Math.PI / 2);
    return frame;
}

function polygon(parent, finish, points, x, y, z, depth) {
    const shape = new THREE.Shape();
    points.forEach(([px, py], index) => index === 0 ? shape.moveTo(px, py) : shape.lineTo(px, py));
    shape.closePath();
    return mesh(parent, new THREE.ExtrudeGeometry(shape, {
        depth, bevelEnabled: false, curveSegments: 16,
    }), finish, x, y, z);
}

function makeEnvelope() {
    const envelope = new THREE.Group();
    envelope.name = 'Sealed envelope';
    const corners = [[-1.53, -0.89], [1.53, -0.89], [1.53, 0.89], [-1.53, 0.89]];
    polygon(envelope, darkPaper, corners, 0, 0.83, -0.078, 0.03);
    polygon(envelope, paper, [corners[0], [0, 0.21], corners[3]], 0, 0.83, 0.022, 0.012);
    polygon(envelope, paper, [corners[1], corners[2], [0, 0.21]], 0, 0.83, 0.022, 0.012);
    polygon(envelope, paper, [corners[0], corners[1], [0, 0.2]], 0, 0.83, 0.035, 0.012);
    strand(envelope, darkPaper, [[-1.5, -0.035, 0.048], [0, 1.03, 0.048]], 0.008);
    strand(envelope, darkPaper, [[0, 1.03, 0.048], [1.5, -0.035, 0.048]], 0.008);

    const sheet = new THREE.Group();
    sheet.name = 'LetterSheet';
    sheet.position.set(0, 0.91, -0.013);
    envelope.add(sheet);
    mesh(sheet, new THREE.BoxGeometry(2.65, 1.54, 0.025), cream);
    for (let row = 0; row < 5; row++) {
        const width = row === 4 ? 0.85 : 1.8;
        mesh(sheet, new THREE.BoxGeometry(width, 0.015, 0.005), darkPaper, (width - 1.8) / 2, 0.23 - row * 0.16, 0.015);
    }

    const flap = new THREE.Group();
    flap.name = 'EnvelopeFlap';
    flap.position.set(0, 1.72, 0.054);
    envelope.add(flap);
    polygon(flap, flapPaper, [[-1.53, 0], [0, -1.19], [1.53, 0]], 0, 0, 0, 0.012);
    strand(flap, darkPaper, [[-1.48, -0.028, 0.018], [0, -1.17, 0.018]], 0.009);
    strand(flap, darkPaper, [[0, -1.17, 0.018], [1.48, -0.028, 0.018]], 0.009);
    oval(flap, wax, 0, -1.03, 0.027, 0.223, 0.2, 0.043);
    oval(flap, blush, 0, -1.03, 0.06, 0.167, 0.161, 0.025);
    const heart = polygon(flap, wax, [[0, -0.083], [0.1, 0.014], [0.087, 0.062], [0.042, 0.078],
        [0, 0.048], [-0.042, 0.078], [-0.087, 0.062], [-0.1, 0.014]], 0, -1.03, 0.086, 0.01);
    heart.rotation.z = 0.1;
    rose(envelope, -1.18, 1.54, 0.088, 0.74, blush, Math.PI / 2);
    rose(envelope, -1.45, 1.68, 0.082, 0.49, petal, Math.PI / 2);
    return envelope;
}

// Merge static meshes by material while preserving the nodes that the scene animates.
function batchMeshes(group) {
    const batches = new Map();
    for (const child of [...group.children]) {
        if (!child.isMesh) {
            if (child.isGroup) batchMeshes(child);
            continue;
        }
        child.updateMatrix();
        const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
        geometry.clearGroups();
        geometry.applyMatrix4(child.matrix);
        if (!batches.has(child.material)) batches.set(child.material, []);
        batches.get(child.material).push(geometry);
        group.remove(child);
    }
    for (const [finish, geometries] of batches) {
        group.add(new THREE.Mesh(mergeVertices(mergeGeometries(geometries)), finish));
    }
}

await mkdir(output, { recursive: true });
const exporter = new GLTFExporter();
for (const [name, model] of [
    ['cake-citrus', makeCake()], ['frame', makeFrame()], ['frame-ribbon', makeRibbonFrame()],
    ['frame-oval', makeOvalFrame()], ['envelope', makeEnvelope()],
]) {
    batchMeshes(model);
    const glb = await exporter.parseAsync(model, { binary: true });
    await writeFile(new URL(`${name}.glb`, output), Buffer.from(glb));
}
