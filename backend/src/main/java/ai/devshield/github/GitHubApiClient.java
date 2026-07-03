package ai.devshield.github;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class GitHubApiClient {

    private final WebClient webClient;

    public GitHubApiClient(@Value("${devshield.github.token:}") String token) {
        WebClient.Builder builder = WebClient.builder()
                .baseUrl("https://api.github.com")
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github.v3+json")
                .defaultHeader(HttpHeaders.USER_AGENT, "DevShieldAI");
        if (token != null && !token.isBlank()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }
        this.webClient = builder.build();
    }

    public Mono<String> fetchDiff(String owner, String repo, int prNumber) {
        return webClient.get()
                .uri("/repos/{owner}/{repo}/pulls/{pr}", owner, repo, prNumber)
                .header(HttpHeaders.ACCEPT, "application/vnd.github.v3.diff")
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(err -> log.error("Failed to fetch diff for {}/{} PR#{}: {}",
                        owner, repo, prNumber, err.getMessage()));
    }

    public Mono<String> fetchUserRepos(String accessToken) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/user/repos")
                        .queryParam("sort", "updated")
                        .queryParam("per_page", "100")
                        .queryParam("type", "owner")
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(String.class);
    }
}
