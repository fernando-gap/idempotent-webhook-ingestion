import "fastify";
import { Provider } from "../signature";

declare module "fastify" {
  interface FastifyInstance {
    providers: Provider;
  }
}
