import type { Sql } from "postgres";
import { WebhookSignatureData } from "./types";

interface InsertReturn {
    inserted: boolean
    duplicated: boolean
}

/**
 * Create inbox and outbox tables when they do not exist.
 * 
 * @param sql - the postgres client to issue queries
 * @returns the DDL queries wrapped in a transaction
 */
export async function createTables(sql: Sql, ) {
    return sql.begin(sql => [
        sql`
            CREATE TABLE IF NOT EXISTS inbox (
                id text PRIMARY KEY,
                first_received_at timestamptz NOT NULL,
                last_received_at timestamptz NOT NULL
            );
        `,
        sql`
            CREATE TABLE IF NOT EXISTS outbox (
                id text PRIMARY KEY,
                provider text NOT NULL,
                event text NOT NULL,
                payload text NOT NULL,
                timestamp timestamptz NOT NULL
            );
        `
    ])
}

/**
 * Create the inbox and outbox rows in the database, 
 * and in case the row of the inbox table is already 
 * present update its timestamp.
 * 
 * @param sql - The postgres connection to issue queries.
 * @param provider - The name of the provider.
 * @param webhook - The webhook data including id, timestamp, and payload.
 * @returns Whether the data is duplicated and/or inserted in the database
 */
export async function persistMessage(sql: Sql, provider: string, webhook: WebhookSignatureData): Promise<InsertReturn> {
    const timestamp = new Date(Number(webhook.timestamp) * 1000)

    const state: InsertReturn = await sql.begin( async sql => {
        const [inbox] = await sql<InsertReturn[]>`
            INSERT INTO inbox (id, first_received_at, last_received_at)
            VALUES (
                ${ webhook.id }, 
                ${ timestamp },
                ${ timestamp }
            )
            ON CONFLICT (id) DO UPDATE SET last_received_at = ${ timestamp }
            RETURNING OLD.id IS NULL AS inserted;
        `;

        if (typeof inbox === "undefined") {
            throw new Error("Inbox upsert returned no row.")
        }

        if (inbox.inserted === false) {
            return { inserted: false, duplicated: true }
        }

        const outbox = await sql`
            INSERT INTO outbox (id, provider, event, payload, timestamp)
            VALUES (
                ${ webhook.id }, 
                ${ provider },
                ${ webhook.data.type },
                ${ JSON.stringify(webhook.data) },
                ${ timestamp }
            )
            ON CONFLICT (id) DO NOTHING
            RETURNING 1;
        `;

        if (inbox.inserted && outbox.length === 1) {
            return { inserted: true, duplicated: false }
        }
        
        return { inserted: false, duplicated: false }
    }) 
    
    if (state.duplicated) {
        await sql`
            UPDATE inbox SET last_received_at = ${ timestamp }
            WHERE id = ${ webhook.id }
        `
        return state
    }

    return state
}