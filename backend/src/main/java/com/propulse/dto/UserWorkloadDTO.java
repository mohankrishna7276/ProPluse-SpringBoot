package com.propulse.dto;

import java.io.Serializable;

public record UserWorkloadDTO(
    String username,
    Long taskCount,
    Integer storyPoints
) implements Serializable {}
