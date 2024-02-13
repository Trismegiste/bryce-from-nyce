import { Hono } from 'hono'
import { serveStatic } from 'hono/bun';

const app = new Hono()

// static
app.use('/pico.css', serveStatic({path: './node_modules/@picocss/pico/css/pico.yellow.min.css'}))
app.use('/vendor/*', serveStatic({
    root: './',
    rewriteRequestPath: (path) => path.replace(/^\/vendor/, '/node_modules')
}))
app.use('/app/*', serveStatic({
    root: './',
    rewriteRequestPath: (path) => path.replace(/^\/app/, '/src')
}))
app.use('/texture/*', serveStatic({root: './'}))

// controllers
app.get('/', serveStatic({path: './templates/index.html'}))

export default {
    port: 3000,
    fetch: app.fetch
} 