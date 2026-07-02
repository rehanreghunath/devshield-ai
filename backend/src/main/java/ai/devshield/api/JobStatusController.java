package ai.devshield.api;

import ai.devshield.job.AnalysisJob;
import ai.devshield.job.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobStatusController {

    private final JobService jobService;

    @GetMapping
    public Flux<AnalysisJob> listAllJobs() {
        return jobService.fetchAll();
    }

    @GetMapping("/{jobId}")
    public Mono<ResponseEntity<AnalysisJob>> getJob(@PathVariable String jobId) {
        return jobService.fetch(jobId)
                .map(ResponseEntity::ok)
                .onErrorReturn(IllegalArgumentException.class, ResponseEntity.notFound().build());
    }
}
