import { Payload } from "./types/payload";
import { Headers } from "./types/headers";

interface Params {
  provider: string;
}

export interface WebhookEndpoint {
  Headers: Headers;
  Body: Payload;
  Params: Params;
}

export type Provider = Record<string, string[]>;

export interface WebhookSignatureData {
  id: string;
  timestamp: string;
  data: Payload;
}

export interface ProviderSignature {
  receivedSignature: string;
  receivedProvider: string;
}
