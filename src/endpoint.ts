import { FastifyPluginAsync } from "fastify";
import HeadersSchema from "./schemas/headers.json";
import PayloadSchema from "./schemas/payload.json";
import { WebhookEndpoint, WebhookSignatureData } from "./types";
import { verifySignature } from "./signature";

export const endpoint: FastifyPluginAsync = async (app) => {
  app.post<WebhookEndpoint>(
    "/:provider",
    {
      schema: {
        headers: HeadersSchema,
        body: PayloadSchema,
      },
    },
    async function (request, reply) {
      if (!Object.hasOwn(app.providers, request.params.provider))
        return reply.code(404).send({ ok: false });

      const signatureData: WebhookSignatureData = {
        data: request.body,
        timestamp: request.headers["webhook-timestamp"],
        id: request.headers["webhook-id"],
      };

      if (
        !verifySignature(
          signatureData,
          request.headers["webhook-signature"],
          app.providers[request.params.provider],
        )
      ) {
        return reply.code(403).send({ ok: false });
      }

      return reply.code(200).send({ ok: true });
    },
  );
};
