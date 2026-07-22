import server from './server.js'

(async () => {
    try {
        await server.listen({ port: process.env.KELP_PORT })
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
})()