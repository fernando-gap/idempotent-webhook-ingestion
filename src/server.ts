import Fastify from 'fastify';
import * as dotenv from 'dotenv';

import HeadersSchema from './schemas/headers.json'
import PayloadSchema from './schemas/payload.json'

import { Headers } from './types/headers'
import { Payload } from './types/payload'


dotenv.config();

const server = Fastify({ logger: process.env.NODE_ENV == "development" });

server.post<{
    Headers: Headers,
    Body: Payload
}>("/:provider", {
    schema: {
        headers: HeadersSchema,
        body: PayloadSchema,
    }
}, async (_request, reply) => {
        return reply.code(200).send({ ok: true })
});

export default server;