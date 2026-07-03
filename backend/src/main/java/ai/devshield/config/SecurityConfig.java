package ai.devshield.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .authorizeExchange(auth -> auth
                        // webhook endpoint is open (signature-verified by WebhookSignatureFilter)
                        .pathMatchers("/api/webhooks/**").permitAll()
                        // actuator health endpoint
                        .pathMatchers("/actuator/**").permitAll()
                        // auth sync endpoint called by frontend
                        .pathMatchers(HttpMethod.POST, "/api/auth/sync").permitAll()
                        // jobs and reviews are public for the dashboard
                        .pathMatchers("/api/jobs/**", "/api/reviews/**").permitAll()
                        // all other api endpoints require auth header
                        .pathMatchers("/api/**").authenticated()
                        .anyExchange().permitAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .opaqueToken(opaqueToken -> opaqueToken
                                .introspector(new GitHubTokenIntrospector())
                        )
                )
                .build();
    }
}
