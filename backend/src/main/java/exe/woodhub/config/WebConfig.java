package exe.woodhub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;

/**
 * Bật serialize Page qua DTO ổn định (PagedModel) thay vì serialize trực tiếp
 * PageImpl. Tránh lỗi/cảnh báo khi controller trả về Page<> ở Spring Boot 4.x.
 */
@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)
public class WebConfig {
}
