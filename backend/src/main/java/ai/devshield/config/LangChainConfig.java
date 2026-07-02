package ai.devshield.config;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LangChainConfig {

    @Value("${devshield.googleai.api-key}")
    private String apiKey;

    @Value("${devshield.googleai.chat-model}")
    private String chatModel;

    @Value("${devshield.googleai.embedding-model}")
    private String embeddingModel;

    @Bean
    @ConditionalOnProperty(name = "devshield.demo-mode", havingValue = "false")
    public ChatLanguageModel chatLanguageModel() {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName(chatModel)
                .temperature(0.2)
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "devshield.demo-mode", havingValue = "false")
    public EmbeddingModel embeddingModel() {
        return GoogleAiEmbeddingModel.builder()
                .apiKey(apiKey)
                .modelName(embeddingModel)
                .build();
    }
}
