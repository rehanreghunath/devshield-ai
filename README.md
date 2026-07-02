# DevShieldAI

Automated async Code Review & Compliance platform powered by LangChain4j RAG, Spring Boot 3.4 WebFlux, pgvector, Redis, and Next.js 15.

## Quick Start (Docker Compose)

```bash
# Start all services (Postgres + pgvector, Redis, Backend, Frontend)
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:8080
# API docs → http://localhost:8080/actuator/health
```

## Demo Flow

1. Open http://localhost:3000
2. Click **"Trigger Analysis"** — submits a mock vulnerable Java PR
3. Watch the job progress: `QUEUED → PARSING → IN_PROGRESS → COMPLETED`
4. Click the job card to open the **split-view review** (Diff + AI feedback)

## Live LLM Mode

```bash
# Set in docker-compose.yml or .env:
OPENAI_API_KEY=sk-...
DEMO_MODE=false
```

## Webhook API

```bash
curl -X POST http://localhost:8080/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{
    "repoId": "your-org/your-repo",
    "prNumber": 1,
    "diff": "diff --git a/...",
    "prTitle": "feat: my change",
    "author": "dev@example.com"
  }'
# → { "jobId": "...", "status": "QUEUED" }
```

## Kubernetes

```bash
kubectl create namespace devshield
kubectl apply -f k8s/

# Edit k8s/configmap.yaml to set DEMO_MODE=false and OPENAI_API_KEY
```

## Architecture

```
POST /api/webhooks/github
  → TokenBucketRateLimiter (Redis Lua, 10 req/min per repo)
  → JobService.enqueue()   (Redis hash + active-jobs set)
  → RagOrchestrator.analyze() [async, boundedElastic]
      → EmbeddingModel.embed(diff)          [OpenAI text-embedding-3-small]
      → ComplianceRuleStore.findSimilar()   [pgvector cosine search]
      → ReviewGenerator.generate()          [GPT-4o prompt → markdown]
  → JobService.complete()  (Redis status → COMPLETED + markdown)

GET /api/jobs             → List all jobs (polled by dashboard every 3s)
GET /api/jobs/{id}        → Single job status
GET /api/reviews/{id}     → Full review markdown
```

## Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Backend    | Spring Boot 3.4, Java 21, WebFlux, Reactor  |
| AI/RAG     | LangChain4j 0.36, OpenAI GPT-4o             |
| Vector DB  | PostgreSQL 16 + pgvector (IVFFlat index)    |
| Cache/Jobs | Redis 7.4, Reactive Lettuce, Lua rate limiter|
| Frontend   | Next.js 15 App Router, TypeScript, Tailwind |
| Infra      | Docker Compose, Kubernetes, HPA             |
