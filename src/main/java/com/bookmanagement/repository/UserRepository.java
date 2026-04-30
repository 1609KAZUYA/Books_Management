package com.bookmanagement.repository;

import com.bookmanagement.domain.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * usersテーブルを操作するRepositoryです。
 *
 * Laravelでいう Eloquent Model の検索メソッドに近い役割です。
 * JpaRepositoryを継承すると、findById / save / delete などが自動で使えます。
 */
public interface UserRepository extends JpaRepository<User, Long> {

    // メソッド名からSQLが自動生成されます。emailを大文字小文字無視で検索します。
    Optional<User> findByEmailIgnoreCase(String email);

    // 同じメールアドレスが既に存在するかを確認します。
    boolean existsByEmailIgnoreCase(String email);
}
