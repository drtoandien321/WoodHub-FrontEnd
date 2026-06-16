package exe.woodhub.service.implement;

import exe.woodhub.dto.AuthResponse;
import exe.woodhub.dto.ChangePasswordRequest;
import exe.woodhub.dto.LoginRequest;
import exe.woodhub.dto.RegisterRequest;
import exe.woodhub.dto.UpdateUserRequest;
import exe.woodhub.dto.UserResponse;
import exe.woodhub.entity.User;
import exe.woodhub.entity.UserRole;
import exe.woodhub.repository.UserRepository;
import exe.woodhub.security.JwtTokenProvider;
import exe.woodhub.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.customer)
                .build();

        User saved = userRepository.save(user);
        return buildAuthResponse(saved);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
        }

        return buildAuthResponse(user);
    }

    @Override
    public UserResponse getCurrentUser() {
        return UserResponse.fromEntity(getAuthenticatedUser());
    }

    @Override
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        requireAdmin();
        return userRepository.findAll(pageable).map(UserResponse::fromEntity);
    }

    @Override
    public UserResponse getUserById(UUID id) {
        checkOwnershipOrAdmin(id);
        User user = findUserOrThrow(id);
        return UserResponse.fromEntity(user);
    }

    @Override
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        checkOwnershipOrAdmin(id);
        User user = findUserOrThrow(id);
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Override
    public void deleteUser(UUID id) {
        requireAdmin();
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng");
        }
        userRepository.deleteById(id);
    }

    @Override
    public void changePassword(UUID id, ChangePasswordRequest request) {
        checkOwnershipOrAdmin(id);
        User user = findUserOrThrow(id);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User findUserOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }

    /**
     * Lấy user đang đăng nhập dựa trên email (subject) trong JWT
     * mà JwtAuthenticationFilter đã đặt vào SecurityContext.
     */
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chưa xác thực");
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ"));
    }

    /**
     * Chỉ cho phép thao tác trên chính tài khoản của mình, hoặc khi là admin.
     */
    private void checkOwnershipOrAdmin(UUID targetId) {
        User current = getAuthenticatedUser();
        boolean isAdmin = current.getRole() == UserRole.admin;
        if (!isAdmin && !current.getId().equals(targetId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên tài khoản này");
        }
    }

    /**
     * Chỉ cho phép admin thực hiện.
     */
    private void requireAdmin() {
        User current = getAuthenticatedUser();
        if (current.getRole() != UserRole.admin) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Chỉ admin mới có quyền thực hiện thao tác này");
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
