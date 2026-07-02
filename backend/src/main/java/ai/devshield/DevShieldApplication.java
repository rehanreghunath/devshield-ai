package ai.devshield;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class DevShieldApplication {
    public static void main(String[] args) {
        SpringApplication.run(DevShieldApplication.class, args);
    }
}
