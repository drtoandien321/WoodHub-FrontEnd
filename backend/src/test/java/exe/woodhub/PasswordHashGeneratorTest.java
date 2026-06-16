package exe.woodhub;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Tien ich BCrypt de seed / chan doan dang nhap. KHONG can DB / Spring context.
 */
class PasswordHashGeneratorTest {

    /**
     * Sinh hash:
     *   mvnw test -Dtest=PasswordHashGeneratorTest#generateHash -Dpassword=MatKhau
     */
    @Test
    void generateHash() {
        String raw = System.getProperty("password");
        if (raw == null || raw.isBlank()) {
            System.out.println(">>> Chua truyen mat khau. Vi du: -Dpassword=Admin@123");
            return;
        }
        String hash = new BCryptPasswordEncoder().encode(raw);
        System.out.println(">>> BCRYPT_HASH_START");
        System.out.println(hash);
        System.out.println(">>> BCRYPT_HASH_END");
    }

    /**
     * Kiem tra mat khau dang go co khop hash trong DB khong:
     *   mvnw test -Dtest=PasswordHashGeneratorTest#verify -Dpassword=MatKhau "-Dhash=$2a$10$..."
     */
    @Test
    void verify() {
        String raw = System.getProperty("password");
        String hash = System.getProperty("hash");
        if (raw == null || hash == null) {
            System.out.println(">>> Can ca -Dpassword va -Dhash");
            return;
        }
        boolean matched = new BCryptPasswordEncoder().matches(raw, hash);
        System.out.println(">>> MATCHES = " + matched);
    }
}
