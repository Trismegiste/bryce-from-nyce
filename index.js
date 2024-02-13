import { Hono } from 'hono'
import { serveStatic } from 'hono/bun';

const app = new Hono()
app.use('/style.css', serveStatic({path: './node_modules/@picocss/pico/css/pico.classless.pink.min.css'}))
app.get('/', serveStatic({ path: './templates/index.html'}))

export default {
    port: 3000,
    fetch: app.fetch
} 