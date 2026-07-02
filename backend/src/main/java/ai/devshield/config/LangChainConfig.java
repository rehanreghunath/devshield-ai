package ai.devshield.config;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class LangChainConfig {

    @Value("${devshield.openai.api-key}")
    private String openAiApiKey;

    @Value("${devshield.openai.chat-model}")
    private String chatModel;

    @Value("${devshield.openai.embedding-model}")
    private String embeddingModel;

    @Bean
    @ConditionalOnProperty(name = "devshield.demo-mode", havingValue = "false")
    public ChatLanguageModel chatLanguageModel() {
        return OpenAiChatModel.builder()
                .apiKey(openAiApiKey)
                .modelName(chatModel)
                .temperature(0.2)
                .timeout(Duration.ofSeconds(60))
                .maxRetries(2)
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "devshield.demo-mode", havingValue = "false")
    public EmbeddingModel embeddingModel() {
        return OpenAiEmbeddingModel.builder()
                .apiKey(openAiApiKey)
                .modelName(embeddingModel)
                .timeout(Duration.ofSeconds(30))
                .maxRetries(2)
                .build();
    }
}
