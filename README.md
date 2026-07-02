# DevShieldAI

AI-Powered automated async code review and compliance platform, for GitHub pull requests.

## Tech Stack

- **Backend**: Spring Boot 3.4, Java 21, WebFlux, Reactor
- **AI/RAG**: LangChain4j, Google Gemini 2.5 Flash, Gemini Embeddings (gemini-embedding-001)
- **Vector DB**: PostgreSQL 16 + pgvector
- **Cache & Queue**: Redis 7.4, Reactive Lettuce, Lua rate limiter
- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind CSS
- **Infrastructure**: Docker Compose, Kubernetes

## Local Development Setup

Follow these steps to run the project locally from scratch:

1. Clone the repository and navigate to the project directory.

2. Create the environment configuration file in the project directory.

3. Configure your API key in the `.env` file:
   ```env
   # Obtain an API key from Google AI Studio
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. Start the application using Docker Compose:
   ```bash
   docker compose up --build -d
   ```

5. Access the services:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080`

6. To stop the application and clean up resources:
   ```bash
   docker compose down
   ```

## Webhook API

Trigger a new code review analysis by sending a webhook payload to the backend API.

```bash
curl -X POST http://localhost:8080/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{
    "repoId": "organization/repository",
    "prNumber": 1,
    "diff": "diff --git a/...",
    "prTitle": "Feature: Implement authentication",
    "author": "developer@example.com"
  }'
```
Returns: `{ "jobId": "...", "status": "QUEUED" }`

## Kubernetes Deployment

1. Configure the `.env` file with your `GEMINI_API_KEY`.

2. Create the target namespace:
   ```bash
   kubectl create namespace devshield
   ```

3. Deploy the ConfigMap and Secrets by substituting environment variables:
   ```bash
   export $(grep -v '^#' .env | xargs) && envsubst < k8s/configmap.yaml | kubectl apply -f -
   ```

4. Apply the application manifests:
   ```bash
   kubectl apply -f k8s/postgres-statefulset.yaml
   kubectl apply -f k8s/redis-deployment.yaml
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-deployment.yaml
   ```

> **Note**: This project is still under development, and any contributions are welcome. If you find it useful, please consider starring.
