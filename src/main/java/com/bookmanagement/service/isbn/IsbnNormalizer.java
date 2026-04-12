package com.bookmanagement.service.isbn;

import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class IsbnNormalizer {

    public Optional<String> normalizeToIsbn13(String rawIsbn) {
        if (rawIsbn == null) {
            return Optional.empty();
        }
        String cleaned = cleanup(rawIsbn);
        if (cleaned.length() == 13 && isValidIsbn13(cleaned)) {
            return Optional.of(cleaned);
        }
        if (cleaned.length() == 10 && isValidIsbn10(cleaned)) {
            return Optional.of(toIsbn13(cleaned));
        }
        return Optional.empty();
    }

    public Optional<String> toIsbn10(String isbn13) {
        if (isbn13 == null || isbn13.length() != 13 || !isbn13.startsWith("978") || !isValidIsbn13(isbn13)) {
            return Optional.empty();
        }
        String core = isbn13.substring(3, 12);
        int sum = 0;
        for (int i = 0; i < core.length(); i++) {
            int digit = core.charAt(i) - '0';
            sum += digit * (10 - i);
        }
        int mod = 11 - (sum % 11);
        char checkDigit;
        if (mod == 10) {
            checkDigit = 'X';
        } else if (mod == 11) {
            checkDigit = '0';
        } else {
            checkDigit = (char) ('0' + mod);
        }
        return Optional.of(core + checkDigit);
    }

    public String cleanup(String rawIsbn) {
        return rawIsbn
                .replace("-", "")
                .replace(" ", "")
                .toUpperCase();
    }

    private String toIsbn13(String isbn10) {
        String body = "978" + isbn10.substring(0, 9);
        int sum = 0;
        for (int i = 0; i < body.length(); i++) {
            int digit = body.charAt(i) - '0';
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        int check = (10 - (sum % 10)) % 10;
        return body + check;
    }

    private boolean isValidIsbn13(String isbn13) {
        if (!isbn13.matches("^[0-9]{13}$")) {
            return false;
        }
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int digit = isbn13.charAt(i) - '0';
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        int expected = (10 - (sum % 10)) % 10;
        int actual = isbn13.charAt(12) - '0';
        return expected == actual;
    }

    private boolean isValidIsbn10(String isbn10) {
        if (!isbn10.matches("^[0-9X]{10}$")) {
            return false;
        }
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            sum += (isbn10.charAt(i) - '0') * (10 - i);
        }
        char checkChar = isbn10.charAt(9);
        int checkVal = (checkChar == 'X') ? 10 : (checkChar - '0');
        sum += checkVal;
        return sum % 11 == 0;
    }
}
