package com.propulse.service;

import com.propulse.domain.Task;
import com.propulse.domain.TaskStatus;
import com.propulse.dto.ProjectStatsDTO;
import com.propulse.dto.UserWorkloadDTO;
import com.propulse.repository.ProjectRepository;
import com.propulse.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectStatsService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    @Cacheable(value = "project-stats", key = "#projectId")
    @Transactional(readOnly = true)
    public ProjectStatsDTO getProjectStats(Long projectId) {
        log.info("Calculating project statistics for database query (Cache Miss): {}", projectId);
        if (!projectRepository.existsById(projectId)) {
            return new ProjectStatsDTO(0L, 0L, 0L, 0L, 0L, 0, 0, new ArrayList<>());
        }

        List<Task> tasks = taskRepository.findByProjectIdOrderByOrderIndexAsc(projectId);

        long total = tasks.size();
        long todo = tasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        long progress = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long review = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_REVIEW).count();
        long done = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

        int totalPoints = tasks.stream()
                .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                .sum();

        int completedPoints = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                .sum();

        // Workload calculations: Group tasks by Assignee
        Map<String, List<Task>> tasksByUser = tasks.stream()
                .filter(t -> t.getAssignee() != null)
                .collect(Collectors.groupingBy(t -> t.getAssignee().getUsername()));

        List<UserWorkloadDTO> workloads = tasksByUser.entrySet().stream()
                .map(entry -> {
                    String username = entry.getKey();
                    List<Task> userTasks = entry.getValue();
                    long count = userTasks.size();
                    int points = userTasks.stream()
                            .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                            .sum();
                    return new UserWorkloadDTO(username, count, points);
                })
                .collect(Collectors.toList());

        return new ProjectStatsDTO(
                total,
                todo,
                progress,
                review,
                done,
                totalPoints,
                completedPoints,
                workloads
        );
    }

    @CacheEvict(value = "project-stats", key = "#projectId")
    public void evictProjectStats(Long projectId) {
        log.info("Evicting dashboard cache entry for project: {}", projectId);
    }
}
