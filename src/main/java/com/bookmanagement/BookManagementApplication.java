package com.bookmanagement;

import com.bookmanagement.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * このクラスがバックエンドアプリの起動入口です。
 *
 * Laravelでいうと、public/index.php からフレームワークが起動する部分に近いです。
 * Spring Bootでは main メソッドを実行すると、Controller / Service / Repository などを
 * 自動で読み込み、HTTPリクエストを受け付けるサーバーを起動します。
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
public class BookManagementApplication {

    public static void main(String[] args) {
        // SpringApplication.run(...) が「アプリ全体を起動する」命令です。
        SpringApplication.run(BookManagementApplication.class, args);
    }
}
