
package uk.jimsimrodev.arcanemporiumapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ArcaneEmporiumApiApplication {

  public static void main(String[] args) {
    SpringApplication.run(ArcaneEmporiumApiApplication.class, args);
  }
}
