package ai.devshield.webhook;

import ai.devshield.github.GitHubApiClient;
import ai.devshield.job.JobService;
import ai.devshield.persistence.WatchedRepoRepository;
import ai.devshield.ratelimit.TokenBucketRateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private static final Set<String> HANDLED_ACTIONS = Set.of("opened", "synchronize", "reopened");

    private final JobService jobService;
    private final TokenBucketRateLimiter rateLimiter;
    private final GitHubApiClient gitHubApiClient;
    private final WatchedRepoRepository watchedRepoRepository;

    @PostMapping("/github")
    public Mono<ResponseEntity<Map<String, String>>> receiveGithubWebhook(
            @RequestHeader(value = "X-GitHub-Event", required = false) String eventType,
            @RequestBody GitHubWebhookEvent event) {

        if (!"pull_request".equals(eventType)) {
            return Mono.just(ResponseEntity.ok(Map.of("message", "Event ignored")));
        }

        if (event.action() == null || !HANDLED_ACTIONS.contains(event.action())) {
            return Mono.just(ResponseEntity.ok(Map.of("message", "Action ignored")));
        }

        if (event.repository() == null || event.pullRequest() == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing repository or pull_request")));
        }

        String repoFullName = event.repository().fullName();

        return watchedRepoRepository.findByFullName(repoFullName)
                .switchIfEmpty(Mono.defer(() -> {
                    log.info("Ignoring webhook for unwatched repo={}", repoFullName);
                    return Mono.empty();
                }))
                .flatMap(watched -> processWebhook(event, repoFullName))
                .switchIfEmpty(Mono.just(ResponseEntity.ok(Map.of("message", "Repo not watched"))));
    }

    private Mono<ResponseEntity<Map<String, String>>> processWebhook(
            GitHubWebhookEvent event, String repoFullName) {

        String[] parts = repoFullName.split("/");
        String owner = parts[0];
        String repo = parts[1];
        int prNumber = event.pullRequest().number();

        return gitHubApiClient.fetchDiff(owner, repo, prNumber)
                .flatMap(diff -> {
                    PullRequestPayload payload = new PullRequestPayload(
                            repoFullName, prNumber, diff,
                            event.pullRequest().title(),
                            event.pullRequest().user() != null ? event.pullRequest().user().login() : null,
                            event.pullRequest().base() != null ? event.pullRequest().base().ref() : null,
                            event.pullRequest().head() != null ? event.pullRequest().head().ref() : null
                    );

                    return rateLimiter.tryConsume(repoFullName)
                            .flatMap(allowed -> {
                                if (!allowed) {
                                    log.info("Rate limited, deferring job for repo={} pr={}", repoFullName, prNumber);
                                    return jobService.enqueueDeferred(payload)
                                            .map(job -> ResponseEntity.status(HttpStatus.ACCEPTED)
                                                    .body(Map.of(
                                                            "jobId", job.id(),
                                                            "status", job.status().name(),
                                                            "message", "Rate limited, queued for deferred processing"
                                                    )));
                                }
                                return jobService.enqueue(payload)
                                        .map(job -> {
                                            log.info("Enqueued job={} for repo={} pr={}",
                                                    job.id(), repoFullName, prNumber);
                                            return ResponseEntity.status(HttpStatus.ACCEPTED)
                                                    .body(Map.of(
                                                            "jobId", job.id(),
                                                            "status", job.status().name(),
                                                            "message", "Analysis job accepted"
                                                    ));
                                        });
                            });
                })
                .onErrorResume(err -> {
                    log.error("Failed to process webhook for repo={} pr={}: {}",
                            repoFullName, prNumber, err.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to fetch diff")));
                });
    }
}
