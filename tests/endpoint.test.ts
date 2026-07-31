import { expect, describe, it, beforeAll, afterAll } from "vitest";
import createApp from "../src/app";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { FastifyInstance } from "fastify";
import { insertInbox, providers, requestFactory } from "./helpers";
import { WebhookSignatureData } from "../src/types";
import { Payload } from "../src/types/payload";
import { createHmac, randomUUID } from "node:crypto";

let postgresContainer: StartedPostgreSqlContainer;
let server: FastifyInstance;

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer("postgres:alpine").start();
  server = await createApp(providers, postgresContainer.getConnectionUri());
}, 10000 * 10)

afterAll(async () => {
    await postgresContainer.stop()
})

describe("send request to webhook endpoint", async () => {

  it("accepts a signed webhook requests and return OK", async () => {
    const response = await server.inject(requestFactory("a", providers["a"][0], null));
    expect(response.statusCode).toBe(200);
  });

  it("refuses missing headers or payload properties and return BAD REQUEST", async () => {
    const headers = {
      "webhook-id": "id",
      "webhook-timestamp": "id",
      "webhook-signature": "signature",
    };

    const body = {
      type: "event",
      timestamp: "timestamp",
      data: {
        hello: "world",
      },
    };

    for (let i = 1; i < Object.keys(headers).length + 1; i++) {
      const response = await server.inject({
        method: "POST",
        url: "/provider",
        headers: Object.fromEntries(Object.entries(headers).slice(i - 1, i)),
        body: body,
      });

      expect(response.statusCode).toBe(400);
    }

    for (let i = 1; i < Object.keys(body).length + 1; i++) {
      const response = await server.inject({
        method: "POST",
        url: "/provider",
        headers: headers,
        body: Object.fromEntries(Object.entries(body).slice(i - 1, i)),
      });

      expect(response.statusCode).toBe(400);
    }

    const response = await server.inject({
      method: "POST",
      url: "/provider",
      headers: {},
      body: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns NOT FOUND when provider is not in the fastify.providers object", async () => {
    const response = await server.inject(requestFactory("provider", providers.a[0], null))
    expect(response.statusCode).toBe(404);
  });

  it("returns FORBIDDEN when signature is invalid", async () => {
    const response = await server.inject(requestFactory("a", "invalidSignature", null))
    expect(response.statusCode).toBe(403);
  });

  it("returns OK when duplicate is found", async () => {

    const req = requestFactory("a", providers.a[0], null)

    const data: WebhookSignatureData= {
      id: req.headers["webhook-id"],
      timestamp: req.headers["webhook-timestamp"],
      data: req.body as Payload,
    }

    await insertInbox(server.sql, data)

    const response = await server.inject(req)
    expect(response.statusCode).toBe(200);
  })

  it("returns INTERNAL SERVER ERROR when database throwns error during the transaction", async () => {
    const request = {
        method: "POST" as const,
        url: `/a`,
        headers: {
            "webhook-id": `msg_${randomUUID()}`,
            "webhook-timestamp": "this-should-throw-error-in-transaction",
            "webhook-signature": "",
        },
        body: {
            type: "event.sent",
            timestamp: (new Date()).toISOString(),
            data: { hello: "world" }
        },
    }

    const encodedSecret = Buffer.from(providers.a[0].slice("whsec_".length), "base64")
    const dataToBeSigned = `${request.headers["webhook-id"]}.${request.headers["webhook-timestamp"]}.${JSON.stringify(request.body)}`
    request.headers["webhook-signature"] = `v1,${createHmac("sha256", encodedSecret).update(dataToBeSigned).digest("base64")}`

    const response = await server.inject(request)
    expect(response.statusCode).toBe(500);

  })
});
