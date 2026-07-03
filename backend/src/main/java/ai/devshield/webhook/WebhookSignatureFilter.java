package ai.devshield.webhook;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
@Slf4j
public class WebhookSignatureFilter implements WebFilter {

    private static final String SIGNATURE_HEADER = "X-Hub-Signature-256";
    private static final String WEBHOOK_PATH = "/api/webhooks/github";

    @Value("${devshield.github.webhook-secret:}")
    private String webhookSecret;

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (!path.equals(WEBHOOK_PATH)) {
            return chain.filter(exchange);
        }

        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("No webhook secret configured, skipping signature verification");
            return chain.filter(exchange);
        }

        String signature = exchange.getRequest().getHeaders().getFirst(SIGNATURE_HEADER);
        if (signature == null || signature.isBlank()) {
            log.warn("Missing {} header", SIGNATURE_HEADER);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        return DataBufferUtils.join(exchange.getRequest().getBody())
                .flatMap(dataBuffer -> {
                    byte[] body = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(body);
                    DataBufferUtils.release(dataBuffer);

                    if (!verifySignature(body, signature)) {
                        log.warn("Invalid webhook signature");
                        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                        return exchange.getResponse().setComplete();
                    }

                    // re-wrap body so downstream can read it
                    ServerHttpRequest mutatedRequest = new ServerHttpRequestDecorator(exchange.getRequest()) {
                        @Override
                        @NonNull
                        public Flux<DataBuffer> getBody() {
                            DataBuffer buf = exchange.getResponse().bufferFactory().wrap(body);
                            return Flux.just(buf);
                        }
                    };
                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                });
    }

    private boolean verifySignature(byte[] payload, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload);
            String expected = "sha256=" + HexFormat.of().formatHex(hash);
            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Signature verification failed: {}", e.getMessage());
            return false;
        }
    }
}
