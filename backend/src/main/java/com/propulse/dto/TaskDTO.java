package com.propulse.dto;

import java.time.LocalDateTime;

public record TaskDTO(
    Long id,
    Long projectId,
    String projectCode,
    String title,
    String description,
    String status,
    String priority,
    Integer storyPoints,
    Integer orderIndex,
    Long assigneeId,
    String assigneeName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
