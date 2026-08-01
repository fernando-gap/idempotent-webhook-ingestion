import { FastifyPluginAsync } from "fastify";
import HeadersSchema from "./schemas/headers.json";
import PayloadSchema from "./schemas/payload.json";
import { WebhookEndpoint, WebhookSignatureData } from "./types";
import { verifySignature } from "./signature";
import { persistMessage } from "./database";
import env from "./env";

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

      const interval = Math.floor(Date.now() / 1000)
      const t = Number(signatureData.timestamp)

      if (t > interval || t < interval - env.KELP_TIMESTAMP_TOLERANCE_S) {
        return reply.code(403).send({ ok: false })
      }

      try {
        const persist = await persistMessage(
          this.sql,
          request.params.provider,
          signatureData,
        );

        if (persist.duplicated) {
          return reply.code(200).send({ ok: true });
        }

        if (!persist.inserted) {
          return reply.code(500).send({ ok: false });
        }
      } catch (err) {
        return reply.code(500).send({ ok: false, err: err });
      }

      return reply.code(200).send({ ok: true });
    },
  );
};
