package ai.devshield.ratelimit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

/**
 * Token-bucket rate limiter using a Lua script for atomicity.
 * Each repoId gets a bucket refilled once per TTL window.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TokenBucketRateLimiter {

    private static final String KEY_PREFIX = "ratelimit:";

    // Atomic Lua: get current tokens, refill if expired, decrement if available
    private static final String LUA_SCRIPT = """
            local key       = KEYS[1]
            local capacity  = tonumber(ARGV[1])
            local ttl_secs  = tonumber(ARGV[2])
            local current   = redis.call('GET', key)
            if current == false then
                redis.call('SET', key, capacity - 1, 'EX', ttl_secs)
                return 1
            end
            local tokens = tonumber(current)
            if tokens <= 0 then
                return 0
            end
            redis.call('DECR', key)
            return 1
            """;

    private final ReactiveRedisTemplate<String, String> redisTemplate;

    @Value("${devshield.rate-limit.tokens-per-minute:10}")
    private int tokensPerMinute;

    @Value("${devshield.rate-limit.bucket-ttl-seconds:60}")
    private int bucketTtlSeconds;

    public Mono<Boolean> tryConsume(String repoId) {
        String key = KEY_PREFIX + repoId;
        RedisScript<Long> script = RedisScript.of(LUA_SCRIPT, Long.class);
        return redisTemplate.execute(script,
                        List.of(key),
                        List.of(String.valueOf(tokensPerMinute), String.valueOf(bucketTtlSeconds)))
                .next()
                .map(result -> result != null && result == 1L)
                .defaultIfEmpty(false)
                .onErrorResume(err -> {
                    log.error("Rate limiter error for repo={}: {}", repoId, err.getMessage());
                    return Mono.just(true); // Fail open on Redis errors
                });
    }

    public Mono<Long> remainingTokens(String repoId) {
        return redisTemplate.opsForValue()
                .get(KEY_PREFIX + repoId)
                .map(Long::parseLong)
                .defaultIfEmpty((long) tokensPerMinute);
    }
}
