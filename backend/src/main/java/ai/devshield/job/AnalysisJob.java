package ai.devshield.job;

import java.time.Instant;

public record AnalysisJob(
        String id,
        String repoId,
        Integer prNumber,
        String prTitle,
        String author,
        JobStatus status,
        String reviewMarkdown,
        String errorMessage,
        String diff,
        Instant createdAt,
        Instant updatedAt
) {
    public AnalysisJob withStatus(JobStatus newStatus) {
        return new AnalysisJob(id, repoId, prNumber, prTitle, author,
                newStatus, reviewMarkdown, errorMessage, diff, createdAt, Instant.now());
    }

    public AnalysisJob withReview(String markdown) {
        return new AnalysisJob(id, repoId, prNumber, prTitle, author,
                JobStatus.COMPLETED, markdown, errorMessage, diff, createdAt, Instant.now());
    }

    public AnalysisJob withError(String error) {
        return new AnalysisJob(id, repoId, prNumber, prTitle, author,
                JobStatus.FAILED, reviewMarkdown, error, diff, createdAt, Instant.now());
    }
}
