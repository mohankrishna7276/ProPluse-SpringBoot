package com.propulse.dto;

import java.io.Serializable;
import java.util.List;

public record ProjectStatsDTO(
    Long totalTasks,
    Long todoTasks,
    Long inProgressTasks,
    Long inReviewTasks,
    Long doneTasks,
    Integer totalStoryPoints,
    Integer completedStoryPoints,
    List<UserWorkloadDTO> workloads
) implements Serializable {}
