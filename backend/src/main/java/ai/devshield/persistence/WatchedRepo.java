package ai.devshield.persistence;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("watched_repos")
public record WatchedRepo(
        @Id UUID id,
        @Column("user_id") UUID userId,
        @Column("github_repo_id") Long githubRepoId,
        @Column("full_name") String fullName,
        @Column("created_at") Instant createdAt
) {}
