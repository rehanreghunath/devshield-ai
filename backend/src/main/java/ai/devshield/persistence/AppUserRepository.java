package ai.devshield.persistence;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public interface AppUserRepository extends ReactiveCrudRepository<AppUser, UUID> {
    Mono<AppUser> findByGithubId(Long githubId);
}
