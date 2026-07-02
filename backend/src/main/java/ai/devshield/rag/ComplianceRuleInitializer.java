package ai.devshield.rag;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.UUID;

@Component
@Slf4j
public class ComplianceRuleInitializer implements ApplicationRunner {

    private final DatabaseClient databaseClient;
    private final Optional<EmbeddingModel> embeddingModel;

    @Value("${devshield.demo-mode:true}")
    private boolean demoMode;

    @Value("${devshield.googleai.embedding-dimensions:768}")
    private int dimensions;

    public ComplianceRuleInitializer(DatabaseClient databaseClient, Optional<EmbeddingModel> embeddingModel) {
        this.databaseClient = databaseClient;
        this.embeddingModel = embeddingModel;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (demoMode || embeddingModel.isEmpty()) {
            log.info("Demo mode is enabled or embedding model is absent. Skipping compliance rules embedding backfill.");
            return;
        }

        log.info("Starting compliance rules embedding initialization...");

        databaseClient.sql("""
                    SELECT id, name, rule_text
                    FROM compliance_rules
                    WHERE embedding IS NULL
                       OR embedding = array_fill(0.0, ARRAY[:dim])::vector
                    """)
                .bind("dim", dimensions)
                .map((row, meta) -> new UninitializedRule(
                        row.get("id", UUID.class),
                        row.get("name", String.class),
                        row.get("rule_text", String.class)
                ))
                .all()
                .flatMap(rule -> Mono.fromCallable(() -> {
                    log.info("Generating embedding for rule: {}", rule.name());
                    Embedding embedding = embeddingModel.get().embed(TextSegment.from(rule.ruleText())).content();
                    return new RuleWithEmbedding(rule.id(), rule.name(), embedding.vector());
                }).flatMap(we -> {
                    String vectorLiteral = toVectorLiteral(we.vector());
                    return databaseClient.sql("""
                                UPDATE compliance_rules
                                SET embedding = CAST(:vec AS vector)
                                WHERE id = :id
                                """)
                            .bind("vec", vectorLiteral)
                            .bind("id", we.id())
                            .fetch()
                            .rowsUpdated()
                            .doOnSuccess(updated -> log.info("Successfully populated embedding for rule: {}", we.name()));
                }))
                .subscribe();
    }

    private String toVectorLiteral(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            sb.append(embedding[i]);
            if (i < embedding.length - 1) sb.append(",");
        }
        return sb.append("]").toString();
    }

    private record UninitializedRule(UUID id, String name, String ruleText) {}
    private record RuleWithEmbedding(UUID id, String name, float[] vector) {}
}
