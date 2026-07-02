package ai.devshield.webhook;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PullRequestPayload(
        @NotBlank(message = "repoId is required")
        String repoId,

        @NotNull(message = "prNumber is required")
        @Positive
        Integer prNumber,

        @NotBlank(message = "diff is required")
        String diff,

        String prTitle,
        String author,
        String baseBranch,
        String headBranch
) {}
