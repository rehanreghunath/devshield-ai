package ai.devshield.webhook;

import ai.devshield.job.AnalysisJob;
import ai.devshield.job.JobService;
import ai.devshield.ratelimit.TokenBucketRateLimiter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final JobService jobService;
    private final TokenBucketRateLimiter rateLimiter;

    @PostMapping("/github")
    public Mono<ResponseEntity<Map<String, String>>> receiveGithubWebhook(
            @Valid @RequestBody PullRequestPayload payload) {

        return rateLimiter.tryConsume(payload.repoId())
                .flatMap(allowed -> {
                    if (!allowed) {
                        log.warn("Rate limit exceeded for repo={}", payload.repoId());
                        return Mono.just(ResponseEntity
                                .status(HttpStatus.TOO_MANY_REQUESTS)
                                .header("Retry-After", "60")
                                .body(Map.of("error", "Rate limit exceeded. Max 10 requests/minute per repository.")));
                    }
                    return jobService.enqueue(payload)
                            .map(job -> {
                                log.info("Enqueued job={} for repo={} pr={}", job.id(), payload.repoId(), payload.prNumber());
                                return ResponseEntity
                                        .status(HttpStatus.ACCEPTED)
                                        .body(Map.of(
                                                "jobId", job.id(),
                                                "status", job.status().name(),
                                                "message", "Analysis job accepted"
                                        ));
                            });
                });
    }
}
