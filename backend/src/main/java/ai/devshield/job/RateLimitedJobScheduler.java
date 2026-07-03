package ai.devshield.job;

import ai.devshield.ratelimit.TokenBucketRateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitedJobScheduler {

    private final JobService jobService;
    private final TokenBucketRateLimiter rateLimiter;

    @Scheduled(fixedDelay = 10000)
    public void processRateLimitedJobs() {
        jobService.fetchByStatus(JobStatus.RATE_LIMITED)
                .groupBy(AnalysisJob::repoId)
                .flatMap(group -> group.concatMap(job ->
                        rateLimiter.tryConsume(job.repoId())
                                .flatMap(allowed -> {
                                    if (!allowed) {
                                        return reactor.core.publisher.Mono.empty();
                                    }
                                    log.info("Promoting rate-limited job={} for repo={}", job.id(), job.repoId());
                                    return jobService.transition(job.id(), JobStatus.QUEUED)
                                            .doOnSuccess(j -> jobService.triggerAsync(j));
                                })
                ))
                .subscribe();
    }
}
