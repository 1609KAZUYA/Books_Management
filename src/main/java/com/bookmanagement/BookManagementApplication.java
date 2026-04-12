package com.bookmanagement;

import com.bookmanagement.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class BookManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookManagementApplication.class, args);
    }
}
