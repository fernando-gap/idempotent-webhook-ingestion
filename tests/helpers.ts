import { createHmac, randomUUID } from "crypto"
import { WebhookSignatureData } from "../src/types"
import { Sql } from "postgres";
import { Providers } from '../src/types'

export const dataFactory: () => WebhookSignatureData = () => {
    return {
    id: `msg_${randomUUID()}`,
    data: {
        type: "event.sent",
        timestamp: (new Date()).toISOString(), // ISO 8601
        data: {
        hello: "world",
        },
    },
    timestamp: String(Math.floor(Date.now() / 1000)), // unix timestamp since epoch

    }
}

interface InboxResult {
    id: string,
    first_received_at: object
    last_received_at: object
}

interface OutboxResult {
    id: string;
    provider: string;
    event: string;
    payload: string;
    timestamp: object
}


export async function insertInbox(sql: Sql, data: WebhookSignatureData) {
    return sql<InboxResult[]>`
        INSERT INTO inbox (id, first_received_at, last_received_at)
        VALUES ( 
            ${ data.id }, 
            ${ new Date(Number(data.timestamp) * 1000) },
            ${ new Date(Number(data.timestamp) * 1000) }
        )
        RETURNING *
    `;
}


export async function insertOutbox(sql: Sql, provider: string, data: WebhookSignatureData) {
    return sql<OutboxResult[]>`
        INSERT INTO outbox (id, provider, event, payload, timestamp)
        VALUES (
            ${ data.id }, 
            ${ provider },
            ${ data.data.type },
            ${ JSON.stringify(data.data) },
            ${ new Date(Number(data.timestamp) * 1000) }
        )
        RETURNING *;
    `;
}

export const providers = {
    "a":["whsec_lpbrJ6R9OpRqzvd8yYfn6USmQPET2uwYl44bG+q/bXo="],
    "b":["whsec_ymgY/vVVgOEVuZ2m8JdxTdigyl8ChkmN71xGpAtAIxo="],
    "c":["whsec_OCdrOUkpGGrG/r4UfpN/uNz3Y9vA64gltvBtTG+yOOw="]
} satisfies Providers;

export const requestFactory = (provider: string, secret: string, data: unknown | null) => {
    const request = {
        method: "POST" as const,
        url: `/${provider}`,
        headers: {
            "webhook-id": `msg_${randomUUID()}`,
            "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
            "webhook-signature": "",
        },
        body: {
            type: "event.sent",
            timestamp: (new Date()).toISOString(),
            data: data || { hello: "world" }
        },
    }

    const encodedSecret = Buffer.from(secret.slice("whsec_".length), "base64")
    const dataToBeSigned = `${request.headers["webhook-id"]}.${request.headers["webhook-timestamp"]}.${JSON.stringify(request.body)}`
    request.headers["webhook-signature"] = `v1,${createHmac("sha256", encodedSecret).update(dataToBeSigned).digest("base64")}`

    return request
}