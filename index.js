const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Bun! Wesh wesh 333");
  },
});

console.log(`Listening on http://localhost:${server.port} ...`);
