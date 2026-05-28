package com.propulse.service;

import com.propulse.config.JwtUtils;
import com.propulse.domain.User;
import com.propulse.dto.LoginRequest;
import com.propulse.dto.LoginResponse;
import com.propulse.dto.RegisterRequest;
import com.propulse.exception.BadRequestException;
import com.propulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        userRepository.save(user);
        log.info("User registered successfully: {}", user.getUsername());

        String token = jwtUtils.generateToken(user.getUsername());
        return new LoginResponse(token, user.getUsername(), user.getEmail());
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        String token = jwtUtils.generateToken(user.getUsername());
        log.info("User logged in successfully: {}", user.getUsername());
        return new LoginResponse(token, user.getUsername(), user.getEmail());
    }
}
