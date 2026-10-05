# Phase — Production Observability & Security Logging

## Objective

Make security and infrastructure failures diagnosable in production without exposing credentials, request bodies, or other sensitive data to application logs or clients.

## Implemented controls

- Security events use structured JSON with timestamp, event name, severity level, and event category.
- Event categories cover authentication, authorization, request protection, persistence, configuration, and system events.
- Event categories are inferred deterministically when a caller does not provide one explicitly.
- Sensitive fields are recursively redacted, including authorization/token/cookie/password values and service-role/API/private-key/client-secret variants.
- Structured sanitization limits object depth, array length, and object field count to keep log entries bounded.
- Project API operations receive a fresh UUID correlation ID for every request.
- The correlation ID is returned as `X-Request-ID` and included in infrastructure/guard log context.
- Failure responses retain the same correlation ID, allowing an operator to connect a client-visible failure with its server-side event.
- Known persistence/validation errors are not redundantly logged as generic infrastructure failures.

## Operational contract

The request ID is an opaque correlation identifier, not an authentication credential and not a substitute for distributed tracing. It contains no user or project data.

Logs are intended for operational diagnosis and security monitoring. They must not include access tokens, session cookies, service-role keys, passwords, raw request bodies, or database credentials.

## Deliberate constraints

Logging remains synchronous and emits JSON through the runtime logger. A future hosting-scale phase can route these events to a centralized log sink or SIEM and attach trace/span IDs when distributed tracing is introduced.

The current event taxonomy is intentionally small. New categories should be added only when they represent a durable operational/security boundary rather than a one-off feature name.

## Follow-up controls

- Centralized production log ingestion and retention policy.
- Alert thresholds for repeated authentication, authorization, rate-limit, and configuration failures.
- Distributed tracing integration when the application spans multiple services.
- CSP Report-Only telemetry during the nonce/hash migration.
- Privacy review of production log retention and operator access.
