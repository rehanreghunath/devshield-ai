-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Compliance rules with vector embeddings
CREATE TABLE IF NOT EXISTS compliance_rules (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    category    TEXT        NOT NULL,
    severity    TEXT        NOT NULL DEFAULT 'MEDIUM', -- LOW | MEDIUM | HIGH | CRITICAL
    rule_text   TEXT        NOT NULL,
    embedding   vector(1536),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS compliance_rules_embedding_idx
    ON compliance_rules USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Analysis jobs (persisted alongside Redis for durability)
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id              UUID        PRIMARY KEY,
    repo_id         TEXT        NOT NULL,
    pr_number       INTEGER     NOT NULL,
    diff_text       TEXT        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'QUEUED',
    review_markdown TEXT,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analysis_jobs_status_idx ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS analysis_jobs_repo_idx   ON analysis_jobs(repo_id);

-- ─── Seed: 10 realistic compliance rules ────────────────────────────────────
-- Embeddings are zero vectors for demo mode; real embeddings populated at runtime.
INSERT INTO compliance_rules (name, category, severity, rule_text, embedding) VALUES
(
    'SQL Injection Prevention',
    'OWASP-A03',
    'CRITICAL',
    'All database queries MUST use parameterized statements or prepared statements. String concatenation to build SQL queries is strictly prohibited. Use JPA/Hibernate named parameters or Spring Data query methods exclusively.',
    array_fill(0.0, ARRAY[1536])::vector
),
(
    'Sensitive Data Exposure in Logs',
    'OWASP-A02',
    'HIGH',
    'Passwords, API keys, tokens, PII (SSN, credit card numbers, email addresses) MUST NOT appear in log statements. Use structured logging with field masking. Annotate sensitive fields with @Sensitive and configure log sanitizers.',
    array_fill(0.0, ARRAY[1536])::vector
),
(
    'Authentication Token Validation',
    'SOC2-CC6.1',
    'CRITICAL',
    'Every API endpoint except explicitly public routes MUST validate JWT/OAuth2 bearer tokens. Token validation must verify: signature, expiry, issuer, and audience. Reject tokens missing any claim with HTTP 401.',
    array_fill(0.0, ARRAY[1536])::vector
),
(
    'Insecure Direct Object Reference',
    'OWASP-A01',
    'HIGH',
    'Resource access must verify that the authenticated principal owns or has explicit permission for the requested resource ID. Never expose sequential integer IDs; use UUIDs. Implement resource-level authorization checks, not just role checks.',
    array_fill(0.0, ARRAY[1536])::vector
),
(
    'Cryptography Standards',
    'SOC2-CC6.7',
    'HIGH',
    'Only approved algorithms are permitted: AES-256-GCM for symmetric encryption, RSA-4096 or Ed25519 for asymmetric. MD5 and SHA-1 are banned. TLS 1.2 minimum; TLS 1.3 preferred. Do not implement custom cryptographic primitives.',
    array_fill(0.0, ARRAY[1536])::vector
),
(
    'Input Validation and Sanitization',
    'OWASP-A03',
    'HIGH',
    'All external inputs (HTTP headers, query params, request bodies, file names) MUST be validated against an allowlist schema before processing. Reject inputs exceeding defined length limits. Use Jakarta Bean Validation annotations (@NotNull, @Size, @Pattern).',
    array_fill(0.0, ARRAY[1536])::vector
),
(
    'Dependency Vulnerability Management',
    'SOC2-CC7.1',
    'MEDIUM',
    'Third-party dependencies must be pinned to exact versions. No dependency with a known CVE of CVSS >= 7.0 may be merged. Run dependency vulnerability scans (OWASP Dependency-Check or Snyk) in CI. Update transitive dependencies monthly.',
    array_fill(0.0, ARRAY[1536])::vector
),
(
    'Error Handling and Information Leakage',
    'OWASP-A05',
    'MEDIUM',
    'Production error responses MUST NOT include stack traces, internal class names, database schema information, or server version headers. Return generic error codes with correlation IDs. Log full details server-side only. Remove X-Powered-By and Server headers.',
    array_fill(0.0, ARRAY[1536])::vector
),
(
    'Rate Limiting on Public Endpoints',
    'SOC2-CC6.6',
    'MEDIUM',
    'All unauthenticated endpoints and authentication endpoints MUST implement rate limiting. Authentication endpoints: max 5 requests/minute per IP. API endpoints: max 100 requests/minute per token. Return HTTP 429 with Retry-After header.',
    array_fill(0.0, ARRAY[1536])::vector
),
(
    'Audit Logging for Sensitive Operations',
    'SOC2-CC7.2',
    'HIGH',
    'All create/update/delete operations on user data, permission changes, authentication events, and administrative actions MUST generate immutable audit log entries. Audit records must include: principal, action, resource, timestamp (UTC), IP address, outcome.',
    array_fill(0.0, ARRAY[1536])::vector
)
ON CONFLICT DO NOTHING;
