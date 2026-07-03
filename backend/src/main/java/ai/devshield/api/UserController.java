package ai.devshield.api;

import ai.devshield.github.GitHubApiClient;
import ai.devshield.persistence.AppUser;
import ai.devshield.persistence.AppUserRepository;
import ai.devshield.persistence.WatchedRepo;
import ai.devshield.persistence.WatchedRepoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final AppUserRepository userRepository;
    private final WatchedRepoRepository watchedRepoRepository;
    private final GitHubApiClient gitHubApiClient;

    @GetMapping("/me")
    public Mono<ResponseEntity<AppUser>> me(@AuthenticationPrincipal OAuth2AuthenticatedPrincipal principal) {
        String login = principal.getName();
        Long githubId = ((Number) principal.getAttribute("id")).longValue();
        return userRepository.findByGithubId(githubId)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/repos")
    public Mono<ResponseEntity<String>> listGithubRepos(
            @AuthenticationPrincipal OAuth2AuthenticatedPrincipal principal) {
        Long githubId = ((Number) principal.getAttribute("id")).longValue();
        return userRepository.findByGithubId(githubId)
                .flatMap(user -> gitHubApiClient.fetchUserRepos(user.accessToken()))
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/repos/watched")
    public Mono<ResponseEntity<java.util.List<WatchedRepo>>> listWatchedRepos(
            @AuthenticationPrincipal OAuth2AuthenticatedPrincipal principal) {
        Long githubId = ((Number) principal.getAttribute("id")).longValue();
        return userRepository.findByGithubId(githubId)
                .flatMapMany(user -> watchedRepoRepository.findAllByUserId(user.id()))
                .collectList()
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/repos")
    public Mono<ResponseEntity<WatchedRepo>> addRepo(
            @AuthenticationPrincipal OAuth2AuthenticatedPrincipal principal,
            @RequestBody Map<String, Object> body) {
        Long githubId = ((Number) principal.getAttribute("id")).longValue();
        Long repoGithubId = ((Number) body.get("githubRepoId")).longValue();
        String fullName = (String) body.get("fullName");

        return userRepository.findByGithubId(githubId)
                .flatMap(user -> watchedRepoRepository.findByUserIdAndGithubRepoId(user.id(), repoGithubId)
                        .map(ResponseEntity::ok)
                        .switchIfEmpty(Mono.defer(() -> {
                            WatchedRepo repo = new WatchedRepo(
                                    null, user.id(), repoGithubId, fullName, Instant.now()
                            );
                            return watchedRepoRepository.save(repo).map(ResponseEntity::ok);
                        }))
                );
    }

    @DeleteMapping("/repos/{repoGithubId}")
    public Mono<ResponseEntity<Void>> removeRepo(
            @AuthenticationPrincipal OAuth2AuthenticatedPrincipal principal,
            @PathVariable Long repoGithubId) {
        Long githubId = ((Number) principal.getAttribute("id")).longValue();
        return userRepository.findByGithubId(githubId)
                .flatMap(user -> watchedRepoRepository.deleteByUserIdAndGithubRepoId(user.id(), repoGithubId))
                .thenReturn(ResponseEntity.noContent().<Void>build());
    }
}
