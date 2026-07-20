# Idempotent Webhook Ingestion

![Project background](./docs/assets/background.png)


An idempotent webhook ingestion service that accepts signed deliveries and stores each event at most once despite retries. It is designed to evaluate correctness, throughput, response-time distribution, resource pressure, and how quickly normal behavior returns after persistence failures under workloads of up to 10,000 requests per second.