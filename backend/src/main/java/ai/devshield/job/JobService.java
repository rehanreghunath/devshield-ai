package ai.devshield.job;

import ai.devshield.rag.RagOrchestrator;
import ai.devshield.webhook.PullRequestPayload;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private static final String JOB_KEY_PREFIX    = "job:";
    private static final String JOB_INDEX_KEY     = "jobs:active";
    private static final Duration JOB_TTL         = Duration.ofHours(24);

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final RagOrchestrator ragOrchestrator;

    // Enqueue

    public Mono<AnalysisJob> enqueue(PullRequestPayload payload) {
        String jobId = UUID.randomUUID().toString();
        AnalysisJob job = new AnalysisJob(
                jobId, payload.repoId(), payload.prNumber(),
                payload.prTitle(), payload.author(),
                JobStatus.QUEUED, null, null,
                Instant.now(), Instant.now()
        );
        return persist(job)
                .then(Mono.fromRunnable(() -> triggerAsync(payload, job)))
                .thenReturn(job);
    }

    // State Transitions 

    public Mono<AnalysisJob> transition(String jobId, JobStatus newStatus) {
        return fetch(jobId)
                .flatMap(job -> persist(job.withStatus(newStatus)));
    }

    public Mono<AnalysisJob> complete(String jobId, String markdown) {
        return fetch(jobId)
                .flatMap(job -> persist(job.withReview(markdown)));
    }

    public Mono<AnalysisJob> fail(String jobId, String error) {
        return fetch(jobId)
                .flatMap(job -> persist(job.withError(error)));
    }

    // Query 

    public Mono<AnalysisJob> fetch(String jobId) {
        return redisTemplate.opsForValue()
                .get(JOB_KEY_PREFIX + jobId)
                .flatMap(json -> Mono.fromCallable(() ->
                        objectMapper.readValue(json, AnalysisJob.class)))
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Job not found: " + jobId)));
    }

    public Flux<AnalysisJob> fetchAll() {
        return redisTemplate.opsForSet()
                .members(JOB_INDEX_KEY)
                .flatMap(this::fetch)
                .onErrorContinue((err, id) -> log.warn("Skipping stale job ref {}: {}", id, err.getMessage()));
    }

    // Persistence

    private Mono<AnalysisJob> persist(AnalysisJob job) {
        return Mono.fromCallable(() -> objectMapper.writeValueAsString(job))
                .flatMap(json ->
                        redisTemplate.opsForValue()
                                .set(JOB_KEY_PREFIX + job.id(), json, JOB_TTL)
                                .then(redisTemplate.opsForSet().add(JOB_INDEX_KEY, job.id()))
                )
                .thenReturn(job);
    }

    // Async Pipeline Trigger

    private void triggerAsync(PullRequestPayload payload, AnalysisJob job) {
        transition(job.id(), JobStatus.PARSING)
                .then(transition(job.id(), JobStatus.IN_PROGRESS))
                .then(ragOrchestrator.analyze(job.id(), payload.diff()))
                .flatMap(markdown -> complete(job.id(), markdown))
                .onErrorResume(err -> {
                    log.error("RAG analysis failed for job={}: {}", job.id(), err.getMessage(), err);
                    return fail(job.id(), err.getMessage());
                })
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }
}
