import server from '../src/server.js'
import { expect, test } from 'vitest'


test("accept ingestion endpoint headers and payload", async () => {

    const response = await server.inject({
        method: 'POST',
        url: '/provider',
        headers: {
            'webhook-id': 'id',
            'webhook-timestamp': 'id',
            'webhook-signature': 'signature'
        },
        body: {
            type: 'event',
            timestamp: 'timestamp',
            data: {}
        }
    })

    expect(response.statusCode).toBe(200)
})

test("refuse all requests not having all headers or payload", async () => {
    const headers = {
        'webhook-id': 'id',
        'webhook-timestamp': 'id',
        'webhook-signature': 'signature'
    }

    const body = {
        type: 'event',
        timestamp: 'timestamp',
        data: {
            "hello": "world"
        }
    }

    for (let i = 1; i < Object.keys(headers).length + 1; i++) {
        const response = await server.inject({
            method: 'POST',
            url: '/provider',
            headers: Object.fromEntries(Object.entries(headers).slice(i - 1, i)),
            body: body
        })

        expect(response.statusCode).toBe(400)
    }

    for (let i = 1; i < Object.keys(body).length + 1; i++) {
        const response = await server.inject({
            method: 'POST',
            url: '/provider',
            headers: headers,
            body: Object.fromEntries(Object.entries(body).slice(i - 1, i))
        })

        expect(response.statusCode).toBe(400)
    }

    const response = await server.inject({
        method: 'POST',
        url: '/provider',
        headers: {},
        body: {}
    })

    expect(response.statusCode).toBe(400)
})