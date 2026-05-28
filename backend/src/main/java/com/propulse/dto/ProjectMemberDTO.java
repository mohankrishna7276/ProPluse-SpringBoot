package com.propulse.dto;

public record ProjectMemberDTO(
    Long id,
    Long userId,
    String username,
    String email,
    String role
) {}
