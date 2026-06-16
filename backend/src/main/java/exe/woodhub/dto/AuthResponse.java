package exe.woodhub.dto;

import exe.woodhub.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String token;

    @Builder.Default
    private String tokenType = "Bearer";

    private UUID userId;
    private String email;
    private String fullName;
    private UserRole role;
}
