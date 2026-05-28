package com.propulse.dto;

public record LoginResponse(
    String token,
    String username,
    String email
) {}
