package ai.devshield.persistence;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("users")
public record AppUser(
        @Id UUID id,
        @Column("github_id") Long githubId,
        String login,
        String name,
        @Column("avatar_url") String avatarUrl,
        @Column("access_token") String accessToken,
        @Column("created_at") Instant createdAt
) {}
