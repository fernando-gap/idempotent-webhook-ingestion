declare global {
    namespace NodeJS {
        interface ProcessEnv {
            KELP_PORT: string;
            KELP_RANDOM_BYTES_SIZE: string;
            KELP_SECRET_PREFIX: string;
            KELP_PROVIDER_NUMBER: string;
            KELP_CONFIG_PATH: string;
            NODE_ENV: string;
        }
    }
}

export { };
