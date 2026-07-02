package ai.devshield.api;

import ai.devshield.job.JobService;
import ai.devshield.job.JobStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewResultController {

    private final JobService jobService;

    @GetMapping("/{jobId}")
    public Mono<ResponseEntity<Map<String, Object>>> getReview(@PathVariable String jobId) {
        return jobService.fetch(jobId)
                .map(job -> {
                    if (job.status() != JobStatus.COMPLETED) {
                        return ResponseEntity.accepted()
                                .<Map<String, Object>>body(Map.of(
                                        "jobId", job.id(),
                                        "status", job.status().name(),
                                        "message", "Analysis still in progress"
                                ));
                    }
                    return ResponseEntity.ok()
                            .<Map<String, Object>>body(Map.of(
                                    "jobId", job.id(),
                                    "status", job.status().name(),
                                    "reviewMarkdown", job.reviewMarkdown() != null ? job.reviewMarkdown() : "",
                                    "repoId", job.repoId(),
                                    "prNumber", job.prNumber()
                            ));
                })
                .onErrorReturn(IllegalArgumentException.class,
                        ResponseEntity.notFound().<Map<String, Object>>build());
    }
}
