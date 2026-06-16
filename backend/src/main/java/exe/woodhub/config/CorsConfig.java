package exe.woodhub.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Cấu hình CORS cho phép Frontend gọi API.
 *
 * Vì sao cần: trình duyệt chặn request "cross-origin" (khác host/port/scheme) trừ khi server
 * trả về header Access-Control-Allow-*. FE dev ở http://localhost:5173, BE ở 8081 → khác port
 * → cross-origin. Khi deploy, FE ở domain thật (vd *.vercel.app) cũng là cross-origin với BE.
 *
 * Danh sách origin được phép lấy từ property app.cors.allowed-origins (xem application.properties),
 * có thể override bằng env var khi deploy mà KHÔNG sửa code.
 */
@Configuration
public class CorsConfig {

    private final List<String> allowedOrigins;

    public CorsConfig(@Value("${app.cors.allowed-origins}") List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // allowedOriginPatterns hỗ trợ wildcard (vd "http://localhost:*") — linh hoạt hơn allowedOrigins
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // cho phép gửi kèm Authorization header / cookie

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
