package exe.woodhub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    private String phone;
}
