import { Hono } from 'hono'
import { serveStatic } from 'hono/bun';

const app = new Hono()

// static
app.use('/pico.css', serveStatic({path: './node_modules/@picocss/pico/css/pico.classless.yellow.min.css'}))
app.use('/alpine.js', serveStatic({path: './node_modules/alpinejs/dist/module.esm.js'}))

// controllers
app.get('/', serveStatic({path: './templates/index.html'}))

export default {
    port: 3000,
    fetch: app.fetch
} 