import { expect, describe, it } from "vitest";
import createApp from "../src/app";

describe("send request to webhook endpoint", async () => {
  const server = await createApp({
    a: ["whsec_ITirpiST4snSMSPuF5bnpztjnW1wDjY4VrnitpGcECA="],
  });

  it("accepts a signed webhook requests and return OK", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/a",
      headers: {
        "webhook-id": "msg_35e8a3d9-2dc5-4460-bce9-81349fefb740",
        "webhook-timestamp": "1674087231",
        "webhook-signature": "v1,ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXA=",
      },
      body: {
        type: "event.sent",
        timestamp: "2026-07-26T14:30:00.000Z",
        data: {
          hello: "world",
        },
      },
    });

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
    const response = await server.inject({
      method: "POST",
      url: "/provider",
      headers: {
        "webhook-id": "msg_35e8a3d9-2dc5-4460-bce9-81349fefb740",
        "webhook-timestamp": "1674087231",
        "webhook-signature": "v1,ydnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXA=",
      },
      body: {
        type: "event.sent",
        timestamp: "2026-07-26T14:30:00.000Z",
        data: {
          hello: "world",
        },
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns FORBIDDEN when signature is invalid", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/a",
      headers: {
        "webhook-id": "msg_35e8a3d9-2dc5-4460-bce9-81349fefb740",
        "webhook-timestamp": "1674087231",
        "webhook-signature": "v1,Adnc64SncH19cxaSCIP53tSrpf7qOJXuLJTGFt2fiXA=",
      },
      body: {
        type: "event.sent",
        timestamp: "2026-07-26T14:30:00.000Z",
        data: {
          hello: "world",
        },
      },
    });

    expect(response.statusCode).toBe(403);
  });
});
