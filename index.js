import { Hono } from 'hono'
import { serveStatic } from 'hono/bun';

const app = new Hono()

// static
app.use('/pico.css', serveStatic({path: './node_modules/@picocss/pico/css/pico.classless.yellow.min.css'}))
app.use('/node_modules/*', serveStatic({ root: './' }))

// controllers
app.get('/', serveStatic({path: './templates/index.html'}))

export default {
    port: 3000,
    fetch: app.fetch
} 