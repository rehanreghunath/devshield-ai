package ai.devshield.job;

public enum JobStatus {
    QUEUED,
    RATE_LIMITED,
    PARSING,
    IN_PROGRESS,
    COMPLETED,
    FAILED
}
