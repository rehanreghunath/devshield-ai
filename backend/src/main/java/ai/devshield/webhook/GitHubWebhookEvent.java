package ai.devshield.webhook;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GitHubWebhookEvent(
        String action,
        @JsonProperty("pull_request") PullRequest pullRequest,
        Repository repository
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PullRequest(
            int number,
            String title,
            @JsonProperty("diff_url") String diffUrl,
            User user,
            Base base,
            Head head
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record User(String login) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Base(String ref) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Head(String ref) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Repository(
            Long id,
            @JsonProperty("full_name") String fullName
    ) {}
}
