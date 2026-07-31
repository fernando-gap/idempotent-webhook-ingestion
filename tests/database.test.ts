import {describe, it, beforeAll, afterAll, expect } from 'vitest'
import {createTables, persistMessage} from '../src/database'
import postgres, { Sql } from 'postgres';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { randomUUID } from 'node:crypto';
import { WebhookSignatureData } from '../src/types';
import { dataFactory, insertInbox, insertOutbox } from './helpers';

let postgresContainer: StartedPostgreSqlContainer;
let sql: Sql;

beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer("postgres:alpine").start();
    sql = postgres(postgresContainer.getConnectionUri())
}, 10000 * 10)

afterAll(async () => {
    await sql.end()
    await postgresContainer.stop()
})


describe("createTables", () => {
    it("the inbox and outbox table must be present in the database", async () => {
        await createTables(sql)

        const hasTables: [{ present: boolean }] = await sql`
            SELECT COUNT(*) = 2 as present FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('inbox', 'outbox');
        `

        expect(hasTables.length).toBe(1)
        expect(hasTables[0].present).toBe(true)

    })

    describe("insertInbox", () => {
        it("inserts a valid row when there is no duplicates", async () => {

            await createTables(sql)

            const data = dataFactory()
            const date = new Date(Number(data.timestamp) * 1000)
            const inbox = await insertInbox(sql, data)

            expect.assert(inbox[0] !== undefined)
            expect(inbox[0].id).toMatch(data.id)
            expect(inbox[0].first_received_at.toString()).toMatch(date.toString())
            expect(inbox[0].last_received_at.toString()).toMatch(date.toString())

        })
        it("does not inserts a row when duplicates are present", async () => {
            await createTables(sql)

            const date = new Date(1785365874 * 1000)
            const uuid = randomUUID()

            await sql`
                INSERT INTO inbox (id, first_received_at, last_received_at)
                VALUES ( ${ uuid }, ${ date }, ${ date }) RETURNING *
            `;

            await expect(sql`
                INSERT INTO inbox (id, first_received_at, last_received_at)
                VALUES ( ${ uuid }, ${ date }, ${ date }) RETURNING *
            `).rejects.toThrow(sql.PostgresError)
        })
    })

    describe("InsertOutbox", () => {
        it("stores row when there is no duplicates", async () => {

            await createTables(sql)

            const provider = "a";
            const data = dataFactory()
            const date = new Date(Number(data.timestamp) * 1000)
            const outbox = await insertOutbox(sql, provider, data)

            expect.assert(outbox[0] !== undefined)
            expect(outbox.length).toBe(1)
            expect(outbox[0].id).toMatch(data.id)
            expect(outbox[0].provider).toMatch(provider)
            expect(outbox[0].event).toMatch(data.data.type)
            expect(JSON.parse(outbox[0].payload)).toEqual(data.data);
            expect(outbox[0].timestamp.toString()).toMatch(date.toString())
        })
        it("does not stores row when duplicates are present", async () => {

            await createTables(sql)

            const provider = "a";
            const data = dataFactory()

            await insertOutbox(sql, provider, data)
            await expect(insertOutbox(sql, provider, data)).rejects.toThrow(sql.PostgresError);
        })
    })
})

describe("persistMessage", () => {

    it("returns inserted true and duplicated false when inbox and outbox has no conflicts, thus inserted in the database", async () => {
        await createTables(sql);

        const row = dataFactory()
        const result = await persistMessage(sql, 'a', row)

        expect(result).toEqual({ inserted: true, duplicated: false })

        const inbox = await sql`SELECT * FROM inbox WHERE id = ${ row.id }`
        const outbox = await sql`SELECT * FROM outbox WHERE id = ${ row.id }`

        expect(inbox.length).toBe(1)
        expect(outbox.length).toBe(1)

    })

    it("returns inserted false and duplicated true when inbox has conflict", async () => {
        await createTables(sql)

        const data = dataFactory()
        await insertInbox(sql, data)
        const result = await persistMessage(sql, "a", data)

        expect(result).toEqual({ inserted: false, duplicated: true })
    })

    it("returns inserted false and duplicate false when outbox has conflict but inbox has been inserted", async () => {

        await createTables(sql)

        const data = dataFactory();
        const provider = "b"

        await insertOutbox(sql, provider, data)
        const result = await persistMessage(sql, provider, data)

        expect(result).toEqual({ inserted: false, duplicated: false })
        
    })
    it("throws error when transaction has failed", async () => {

        await createTables(sql);

        await expect(persistMessage(sql, "a" , ({} as unknown) as WebhookSignatureData))
            .rejects.toThrow(Error)


    })
})

