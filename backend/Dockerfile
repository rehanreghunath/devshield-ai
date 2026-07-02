FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon -q
COPY src src
RUN ./gradlew bootJar --no-daemon -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S devshield && adduser -S devshield -G devshield
COPY --from=builder /app/build/libs/*.jar app.jar
USER devshield
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
