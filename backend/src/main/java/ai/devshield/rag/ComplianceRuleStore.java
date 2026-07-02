package ai.devshield.rag;

import ai.devshield.persistence.ComplianceRule;
import io.r2dbc.spi.ConnectionFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Performs pgvector cosine-similarity search against compliance_rules.
 * In demo mode, returns all rules ordered by severity as a fallback.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ComplianceRuleStore {

    private final DatabaseClient databaseClient;

    @Value("${devshield.rag.top-k-rules:5}")
    private int topK;

    @Value("${devshield.demo-mode:true}")
    private boolean demoMode;

    /**
     * Retrieve top-K compliance rules by cosine similarity to the provided embedding.
     * Falls back to severity-ordered scan when demoMode=true or embedding is empty.
     */
    public Flux<ComplianceRule> findSimilar(float[] queryEmbedding) {
        if (demoMode || queryEmbedding == null || queryEmbedding.length == 0) {
            return fallbackTopRules();
        }
        String vectorLiteral = toVectorLiteral(queryEmbedding);
        return databaseClient.sql("""
                        SELECT id, name, category, severity, rule_text, created_at
                        FROM compliance_rules
                        ORDER BY embedding <-> CAST(:vec AS vector)
                        LIMIT :k
                        """)
                .bind("vec", vectorLiteral)
                .bind("k", topK)
                .map((row, meta) -> new ComplianceRule(
                        row.get("id", UUID.class),
                        row.get("name", String.class),
                        row.get("category", String.class),
                        row.get("severity", String.class),
                        row.get("rule_text", String.class),
                        row.get("created_at", java.time.Instant.class)
                ))
                .all()
                .doOnNext(r -> log.debug("Retrieved rule: {}", r.name()));
    }

    private Flux<ComplianceRule> fallbackTopRules() {
        return databaseClient.sql("""
                        SELECT id, name, category, severity, rule_text, created_at
                        FROM compliance_rules
                        ORDER BY CASE severity
                            WHEN 'CRITICAL' THEN 1
                            WHEN 'HIGH'     THEN 2
                            WHEN 'MEDIUM'   THEN 3
                            ELSE 4 END
                        LIMIT :k
                        """)
                .bind("k", topK)
                .map((row, meta) -> new ComplianceRule(
                        row.get("id", UUID.class),
                        row.get("name", String.class),
                        row.get("category", String.class),
                        row.get("severity", String.class),
                        row.get("rule_text", String.class),
                        row.get("created_at", java.time.Instant.class)
                ))
                .all();
    }

    private String toVectorLiteral(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            sb.append(embedding[i]);
            if (i < embedding.length - 1) sb.append(",");
        }
        return sb.append("]").toString();
    }
}
