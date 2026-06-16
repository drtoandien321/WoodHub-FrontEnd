package exe.woodhub.service;

import exe.woodhub.dto.AuthResponse;
import exe.woodhub.dto.ChangePasswordRequest;
import exe.woodhub.dto.LoginRequest;
import exe.woodhub.dto.RegisterRequest;
import exe.woodhub.dto.UpdateUserRequest;
import exe.woodhub.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser();

    Page<UserResponse> getAllUsers(Pageable pageable);

    UserResponse getUserById(UUID id);

    UserResponse updateUser(UUID id, UpdateUserRequest request);

    void deleteUser(UUID id);

    void changePassword(UUID id, ChangePasswordRequest request);
}
