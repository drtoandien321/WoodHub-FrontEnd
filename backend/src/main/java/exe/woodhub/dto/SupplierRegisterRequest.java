package exe.woodhub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SupplierRegisterRequest {

    @NotBlank(message = "Tên doanh nghiệp không được để trống")
    @Size(max = 255, message = "Tên doanh nghiệp tối đa 255 ký tự")
    private String businessName;

    @Size(max = 20, message = "Mã số thuế tối đa 20 ký tự")
    private String taxCode;

    private String legalDocumentUrl;
}
