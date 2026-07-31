import Fastify from "fastify";
import { endpoint } from "./endpoint";
import env from "./env";
import { Providers as Providers } from "./types";
import postgres from "postgres";
import { createTables } from "./database";

/**
 * Configures a Fastify instance.
 *
 * @returns A fastify instance
 */
export default async function createApp(providers: Providers, databaseUrl: string) {
  const app = Fastify({ logger: env.NODE_ENV === "development" });
  const sql = postgres(databaseUrl)

  await createTables(sql)

  app.decorate("providers", providers);
  app.decorate('sql', sql)

  app.register(endpoint);

  return app;
}
