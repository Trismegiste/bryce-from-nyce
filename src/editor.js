/*
 * eclipse-wiki
 */

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder.js";
import { Scene } from "@babylonjs/core/scene.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { TerrainMaterial } from "@babylonjs/materials/terrain/terrainMaterial.js";

const textureRole = {
    'top': 'diffuseTexture1',
    'slope': 'diffuseTexture2',
    'bottom': 'diffuseTexture3'
}

// global to this module
let scene = null
let groundMesh = null
let terrainMaterial = null

export function createEditor(canvas, cameraStartDistance) {
    // Generate the BABYLON 3D engine
    const engine = new Engine(canvas)
    // Creates Scene object
    scene = new Scene(engine)
    const camera = new ArcRotateCamera("Camera", 0, 0, cameraStartDistance, new Vector3(0, 0, 0), scene)
    camera.attachControl(canvas, true)

    // This creates a light
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.diffuse = new Color3(1, 1, 1);
    light.intensity = 1;

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render()
    })
    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize()
    })
}

function createMesh(terrain, maxAltitude) {
    const gridSize = terrain.getSide()

    const ground = CreateGround("gdhm", {
        width: gridSize - 1,
        height: gridSize - 1,
        subdivisions: gridSize - 1,
        updatable: true
    }, scene)

    let vertex = ground.getVerticesData(VertexBuffer.PositionKind)
    let altitude = terrain.dump();

    for (let idx = 0; idx < altitude.length; idx++) {
        vertex[3 * idx + 1] = altitude[idx] * maxAltitude
    }
    ground.updateVerticesData(VertexBuffer.PositionKind, vertex)
    ground.createNormals(true)

    return ground
}

function createMixTexture(mesh, gridSize, maxAltitude, slopeThreshold, heightSeparation, mixSeparation) {
    // visualizing mixing on the terrain
    let normals = mesh.getVerticesData(VertexBuffer.NormalKind)
    let positions = mesh.getVerticesData(VertexBuffer.PositionKind)
    // checking sizes
    if (positions.length !== (3 * gridSize ** 2)) {
        throw new Error('Terrain size and mesh size does not match')
    }

    let mixedBuffer = new Uint8Array(normals.length)
    for (let i = 0; i < normals.length; i += 3) {
        // normalize height from terrain
        let height = positions[i + 1] / maxAltitude
        // extract only Y component to know the "slope" of the surface
        let slope = normals[i + 1]
        if (slope < slopeThreshold) {
            mixedBuffer[i + 1] = 255
            mixedBuffer[i + 0] = 0
            mixedBuffer[i + 2] = 0
        } else {
            height += (Math.random() - 0.5) / mixSeparation
            mixedBuffer[i + 1] = 0
            mixedBuffer[i + 0] = (height > heightSeparation) ? 255 : 0
            mixedBuffer[i + 2] = (height < heightSeparation) ? 255 : 0
        }
    }

    const mixTexture = RawTexture.CreateRGBTexture(
            mixedBuffer,
            gridSize,
            gridSize,
            scene
            )
    mixTexture.uAng = Math.PI

    return mixTexture
}

function createMaterial(mesh, gridSize, maxAltitude, slopeThreshold, heightSeparation, mixSeparation) {
    const mat = new TerrainMaterial("mat", scene)
    mat.mixTexture = createMixTexture(mesh, gridSize, maxAltitude, slopeThreshold, heightSeparation, mixSeparation)
    mat.diffuseTexture1 = new Texture("/texture/top.png", scene)
    mat.diffuseTexture2 = new Texture("/texture/slope.png", scene)
    mat.diffuseTexture3 = new Texture("/texture/bottom.png", scene)
    // https://www.smart-page.net/smartnormal/

    return mat
}

export function updateTexture(name, reader) {
    terrainMaterial[textureRole[name]].dispose()
    terrainMaterial[textureRole[name]] = new Texture(reader.result, scene)
}

export function show(terrain, maxAltitude, slopeThreshold, heightSeparation, mixSeparation) {
    if (groundMesh !== null) {
        groundMesh.dispose()
    }

    // new mesh
    groundMesh = createMesh(terrain, maxAltitude)

    // create or update old material with new slope
    if (terrainMaterial === null) {
        terrainMaterial = createMaterial(groundMesh, terrain.getSide(), maxAltitude, slopeThreshold, heightSeparation, mixSeparation)
    } else {
        terrainMaterial.mixTexture.dispose()
        terrainMaterial.mixTexture = createMixTexture(groundMesh, terrain.getSide(), maxAltitude, slopeThreshold, heightSeparation, mixSeparation)
    }

    groundMesh.material = terrainMaterial
}

export function updateTiling(repeating) {
    for (const field of Object.values(textureRole)) {
        terrainMaterial[field].uScale = repeating
        terrainMaterial[field].vScale = repeating
    }
}

export function moveAway(ratio) {
    const camera = scene.activeCamera
    camera.radius *= ratio
}