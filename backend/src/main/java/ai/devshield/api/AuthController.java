package ai.devshield.api;

import ai.devshield.persistence.AppUser;
import ai.devshield.persistence.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AppUserRepository userRepository;

    @PostMapping("/sync")
    public Mono<ResponseEntity<Map<String, Object>>> syncUser(@RequestBody Map<String, Object> body) {
        Long githubId = ((Number) body.get("githubId")).longValue();
        String login = (String) body.get("login");
        String name = (String) body.get("name");
        String avatarUrl = (String) body.get("avatarUrl");
        String accessToken = (String) body.get("accessToken");

        return userRepository.findByGithubId(githubId)
                .flatMap(existing -> {
                    AppUser updated = new AppUser(
                            existing.id(), existing.githubId(), login, name,
                            avatarUrl, accessToken, existing.createdAt()
                    );
                    return userRepository.save(updated);
                })
                .switchIfEmpty(Mono.defer(() -> {
                    AppUser newUser = new AppUser(
                            null, githubId, login, name,
                            avatarUrl, accessToken, Instant.now()
                    );
                    return userRepository.save(newUser);
                }))
                .map(user -> ResponseEntity.ok(Map.of(
                        "id", user.id().toString(),
                        "login", user.login()
                )));
    }
}
