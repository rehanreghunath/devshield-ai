package ai.devshield.rag;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Optional;

/**
 * Orchestrates the full RAG pipeline:
 *   1. Embed the incoming diff  (skipped in demo mode)
 *   2. Retrieve similar compliance rules from pgvector
 *   3. Generate AI review via LLM
 */
@Component
@Slf4j
public class RagOrchestrator {

    private final Optional<EmbeddingModel> embeddingModel;
    private final ComplianceRuleStore ruleStore;
    private final ReviewGenerator reviewGenerator;

    @Value("${devshield.demo-mode:true}")
    private boolean demoMode;

    public RagOrchestrator(
            Optional<EmbeddingModel> embeddingModel,
            ComplianceRuleStore ruleStore,
            ReviewGenerator reviewGenerator) {
        this.embeddingModel = embeddingModel;
        this.ruleStore = ruleStore;
        this.reviewGenerator = reviewGenerator;
    }

    public Mono<String> analyze(String jobId, String diff) {
        log.info("Starting RAG analysis for jobId={}, diffLength={}", jobId, diff.length());

        return embedDiff(diff)
                .flatMap(embedding -> ruleStore.findSimilar(embedding).collectList())
                .flatMap(rules -> {
                    log.info("Retrieved {} compliance rules for jobId={}", rules.size(), jobId);
                    return reviewGenerator.generate(diff, rules);
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    private Mono<float[]> embedDiff(String diff) {
        if (demoMode || embeddingModel.isEmpty()) {
            return Mono.just(new float[0]); // demo: trigger fallback in ruleStore
        }
        return Mono.fromCallable(() -> {
            // Truncate diff to ~8k chars to stay within embedding token limits
            String truncated = diff.length() > 8000 ? diff.substring(0, 8000) : diff;
            List<Embedding> embeddings = embeddingModel.get()
                    .embedAll(List.of(TextSegment.from(truncated)))
                    .content();
            return embeddings.get(0).vector();
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
