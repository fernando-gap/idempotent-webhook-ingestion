import Fastify from "fastify";
import { endpoint } from "./endpoint";
import env from "./env";
import { Provider as Providers } from "./types";

/**
 * Configures a Fastify instance.
 *
 * @returns A fastify instance
 */
export default async function createApp(providers: Providers) {
  const app = Fastify({ logger: env.NODE_ENV === "development" });

  app.decorate("providers", providers);

  app.register(endpoint);

  return app;
}
