package exe.woodhub.service;

import exe.woodhub.dto.SupplierRegisterRequest;
import exe.woodhub.dto.SupplierResponse;

public interface SupplierService {

    SupplierResponse registerSupplier(SupplierRegisterRequest request);
}
