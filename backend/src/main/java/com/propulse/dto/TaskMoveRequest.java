package com.propulse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TaskMoveRequest(
    @NotBlank(message = "Destination status is required")
    String status,
    
    @NotNull(message = "Destination order index is required")
    Integer orderIndex,
    
    Long assigneeId
) {}
