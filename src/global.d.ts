declare global {
    namespace NodeJS {
        interface ProcessEnv {
            KELP_PORT: number;
            NODE_ENV: string;
        }
    }
}

export { };
