import { writeFile } from "fs/promises";
import createApp from "./app";
import env from "./env";
import config from "./env";
import { createProviders } from "./signature";

const providers = Object.freeze(createProviders(env.KELP_PROVIDER_AMOUNT));
const server = await createApp(providers);

try {
  await writeFile(env.KELP_CONFIG_PATH, JSON.stringify(providers));
  await server.listen({ port: config.KELP_PORT });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
