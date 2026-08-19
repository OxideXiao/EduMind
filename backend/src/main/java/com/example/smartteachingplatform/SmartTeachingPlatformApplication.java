package com.example.smartteachingplatform;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.example.smartteachingplatform.**.mapper")
@EnableScheduling
public class SmartTeachingPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartTeachingPlatformApplication.class, args);
    }

}
