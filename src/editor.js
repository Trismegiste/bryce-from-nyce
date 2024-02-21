/*
 * eclipse-wiki
 */

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder.js";
import { CreateGeodesic } from "@babylonjs/core/Meshes/Builders/geodesicBuilder.js";
import { Scene } from "@babylonjs/core/scene.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { TerrainMaterial } from "@babylonjs/materials/terrain/terrainMaterial.js";
import { ActionManager } from "@babylonjs/core/Actions/actionManager.js";
import { Ray } from "@babylonjs/core/Culling/ray.js";
import { ShadowGeneratorSceneComponent } from "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent.js";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions.js";
import { textureRole } from 'texture-constant';

// global to this module
let scene = null
let groundMesh = null
let terrainMaterial = null
let light = null
let shadowGenerator = null

/**
 * Builds the terrain editor into the canvas
 * @param {HTMLCanvasElement} canvas
 * @param {Float} cameraStartDistance a distance for the camera
 */
export function createEditor(canvas, cameraStartDistance) {
    // Generate the BABYLON 3D engine
    const engine = new Engine(canvas)
    // Creates Scene object
    scene = new Scene(engine)
    const camera = new ArcRotateCamera("Camera", 0, 0, cameraStartDistance, new Vector3(0, 0, 0), scene)
    camera.attachControl(canvas, true)

    // The sun
    const light = new DirectionalLight("sun", new Vector3(0, -1, 0), scene)
    light.diffuse = new Color3(1, 1, 1);
    light.intensity = 1;

    // Reflections from the ground
    let ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene)
    ambient.diffuse = new Color3(1, 1, 1)
    ambient.intensity = 0.3;

    // light control white ball
    let ball = CreateGeodesic("lightball", {size: 1, m: 10, n: 10, flat: false}, scene)
    ball.isVisible = false
    ball.actionManager = new ActionManager(scene)
    ball.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, event => {
                let direction = event.additionalData.pickedPoint
                direction.subtractInPlace(ball.position)
                light.direction = direction.normalizeToNew().negate()
            }))

    shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.bias = 0.0001;

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

    // shadow
    shadowGenerator.addShadowCaster(ground)
    ground.receiveShadows = true

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
    mat.bumpTexture1 = new Texture("/texture/bump.png", scene)
    mat.bumpTexture2 = new Texture("/texture/bump.png", scene)
    mat.bumpTexture3 = new Texture("/texture/bump.png", scene)
    // https://www.smart-page.net/smartnormal/

    return mat
}

/**
 * Updates a texture with a FileReader.result
 * @param {String} name Texture name (see textureRole above)
 * @param {FileReader} reader
 */
export function updateTexture(name, reader) {
    terrainMaterial[textureRole[name]].dispose()
    terrainMaterial[textureRole[name]] = new Texture(reader.result, scene)
}

/**
 * Update the mesh in BabylonJS with the given terrain and other parameters
 * @param {Terrain} terrain
 * @param {Float} maxAltitude
 * @param {Float} slopeThreshold Threshold that will be compared to the normal of the surface. From 0 (vertical surface) to 1 (horizontal surface)
 * @param {type} heightSeparation Where the bottom is ending and when the top texture is starting. Normalized, from 0 to 1
 * @param {type} mixSeparation How to mix bottom and top textures around the threshold. From 2 (textures are mixed) to 10 (border between top and bottom is clear)
 */
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

/**
 * Updates the tiling of all textures
 * @param {Float} repeating From 1 (no repeat) to infinity)
 */
export function updateTiling(repeating) {
    for (const field of Object.values(textureRole)) {
        terrainMaterial[field].uScale = repeating
        terrainMaterial[field].vScale = repeating
    }
}

/**
 * Moves away the camera by a ratio on the current distance
 * @param {Float} ratio
 */
export function moveAway(ratio) {
    const camera = scene.activeCamera
    camera.radius *= ratio
}

export function enableLightball(mode) {
    const ball = scene.getMeshByName('lightball')
    let size = groundMesh.getBoundingInfo().boundingSphere.radiusWorld / 2

    ball.scaling = new Vector3(size, size, size)
    ball.position.y = size
    ball.isVisible = mode
}