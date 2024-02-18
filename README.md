# Bryce from Nyce
Bryce-like Fractal Terrain Generator

## What
It's a 3D terrain editor. Currently, only the 
[Diamond-Square algorithm](https://en.wikipedia.org/wiki/Diamond-square_algorithm) is implemented.

![Screenshot](https://github.com/Trismegiste/bryce-from-nyce/blob/master/docs/screenshot.jpg)

## How

![Stack](https://github.com/Trismegiste/bryce-from-nyce/blob/master/docs/stack.svg)

It runs with 
[ECMAScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/JavaScript_technologies_overview), 
served by [Bun](https://bun.sh/),
built on [Hono](https://hono.dev/), 
rendered with [BabylonJS](https://babylonjs.com/), 
reactived with [AlpineJS](https://alpinejs.dev/),
designed with [PicoCSS](https://picocss.com/)
and containerized with [Docker](https://www.docker.com/).

No JSX nor hooks were harmed in the process.

This webapp is conveniently dockerized, to run it, simply clone this repo and launch :

```bash
$ docker compose up
```

And launch the browser to access to http://localhost:3000

Of course, if you know how to use Bun, you can simply launch :

```bash
$ bun run index.js
```

## What is special about this implementation of Diamond-Square algorithm ?

Two points : unlike many implementions of this algorithm you can find on the net, 
this release is divided into steps. Each step adds more refinement to the mesh
and you can increase or decrease this tesselation afterward generating the terrain.

The second point is the texturing algorithm that uses 3 textures (top, bottom and slope)
that are mixed according to height and slope of the terrain. The slope texture is
visible when the terrain is steep.

With the help of [transfer functions](https://en.wikipedia.org/wiki/Transfer_function) and
[convolution matrices](https://en.wikipedia.org/wiki/Convolution#Discrete_convolution), you can rapidly generate
realist terrains. 

## API
* src/Terrain.js : all mathematical stuff
* src/editor.js : all 3d stuff
* src/TransferFunction.js : transfer function object to be applied on Terrain objects
* template/index.html : the page
* texture/ : default textures

## TODO (from probable to improbable)
* Fog
* Skybox
* Exporting the scene
* Managing a camera on the terrain
* Exporting a screenshot
* Undo - need to refactor TransferFunction and convolutions workflow
* Other algorithms for generating terrains
* Other algorithms for generating texturing
* Procedural mapping like original Bryce with pixel shaders ?
* Other primitives into the scene ?
