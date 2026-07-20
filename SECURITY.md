# Security

## Project status

Kelp 001 is an experimental systems-engineering project. It evaluates
idempotent webhook ingestion and is not intended to be deployed as a
production-ready internet-facing service.

## Security boundary

The project includes:

- verification of signed webhook deliveries;
- rejection of invalid signatures;
- at-most-once event persistence across retries;
- preservation of the original request payload;
- evaluation under invalid-signature traffic.

The signature scheme follows the Standard Webhooks conventions based on the
webhook ID, attempt timestamp, and raw request body.

## Outside the current scope

The project does not provide complete protection against:

- network-level denial-of-service attacks;
- rate-limit and quota abuse;
- compromised provider credentials;
- production secret distribution, rotation, and revocation;
- large or malicious payload exhaustion;
- multi-tenant isolation;
- formal cryptographic or security auditing.

## Reporting a vulnerability

Please avoid publishing exploitable vulnerabilities in a public issue.
Report them privately to the repository owner.