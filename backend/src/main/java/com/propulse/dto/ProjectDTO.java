package com.propulse.dto;

import java.time.LocalDateTime;

public record ProjectDTO(
    Long id,
    String name,
    String code,
    String description,
    LocalDateTime createdAt
) {}
