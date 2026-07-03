package ai.devshield.persistence;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public interface WatchedRepoRepository extends ReactiveCrudRepository<WatchedRepo, UUID> {
    Flux<WatchedRepo> findAllByUserId(UUID userId);
    Mono<WatchedRepo> findByFullName(String fullName);
    Mono<WatchedRepo> findByUserIdAndGithubRepoId(UUID userId, Long githubRepoId);
    Mono<Void> deleteByUserIdAndGithubRepoId(UUID userId, Long githubRepoId);
}
