package com.bookmanagement.service.user;

import com.bookmanagement.config.AppProperties;
import com.bookmanagement.domain.entity.User;
import com.bookmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 起動時にデモユーザーのパスワードを BCrypt ハッシュに更新する。
 * 既存DBに古いハッシュが残っていても、デモログイン情報を固定できるようにする。
 * デモユーザーのパスワード: demo1234
 */
@Component
@RequiredArgsConstructor
public class DemoUserInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    public void run(ApplicationArguments args) {
        userRepository.findByEmailIgnoreCase(appProperties.getDefaultUserEmail())
                .filter(user -> !passwordEncoder.matches("demo1234", user.getPasswordHash()))
                .ifPresent(this::updatePassword);
    }

    private void updatePassword(User user) {
        user.setPasswordHash(passwordEncoder.encode("demo1234"));
        userRepository.save(user);
    }
}
