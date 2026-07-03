package ai.devshield.webhook;

public record PullRequestPayload(
        String repoId,
        Integer prNumber,
        String diff,
        String prTitle,
        String author,
        String baseBranch,
        String headBranch
) {}
