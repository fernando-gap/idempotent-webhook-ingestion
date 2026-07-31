import "fastify";
import type { Provider } from "../signature";
import type { Sql } from "postgres";

declare module "fastify" {
  interface FastifyInstance {
    providers: Provider;
    sql: Sql;
  }
}
