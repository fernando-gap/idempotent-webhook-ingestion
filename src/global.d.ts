declare global {
  namespace NodeJS {
    interface ProcessEnv {
      KELP_PORT: string;
      KELP_DATABASE_URL: string;
      KELP_RANDOM_BYTES_SIZE: string;
      KELP_TIMESTAMP_TOLERANCE_S: string;
      KELP_SECRET_PREFIX: string;
      KELP_PROVIDER_NUMBER: string;
      KELP_CONFIG_PATH: string;
      NODE_ENV: string;
    }
  }
}

export {};
