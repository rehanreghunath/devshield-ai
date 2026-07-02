package ai.devshield.persistence;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("compliance_rules")
public record ComplianceRule(
        @Id UUID id,
        String name,
        String category,
        String severity,
        @Column("rule_text") String ruleText,
        @Column("created_at") Instant createdAt
) {}
