package ai.devshield.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.security.oauth2.server.resource.introspection.ReactiveOpaqueTokenIntrospector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
public class GitHubTokenIntrospector implements ReactiveOpaqueTokenIntrospector {

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.github.com")
            .build();

    @Override
    public Mono<OAuth2AuthenticatedPrincipal> introspect(String token) {
        return webClient.get()
                .uri("/user")
                .header("Authorization", "Bearer " + token)
                .header("Accept", "application/vnd.github.v3+json")
                .retrieve()
                .bodyToMono(Map.class)
                .map(userInfo -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> attrs = (Map<String, Object>) userInfo;
                    return (OAuth2AuthenticatedPrincipal)
                            new org.springframework.security.oauth2.core.DefaultOAuth2AuthenticatedPrincipal(
                                    (String) attrs.get("login"),
                                    attrs,
                                    java.util.Collections.singletonList(
                                            new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")
                                    )
                            );
                })
                .onErrorResume(err -> {
                    log.warn("GitHub token introspection failed: {}", err.getMessage());
                    return Mono.error(new org.springframework.security.oauth2.core.OAuth2AuthenticationException("Invalid token"));
                });
    }
}
