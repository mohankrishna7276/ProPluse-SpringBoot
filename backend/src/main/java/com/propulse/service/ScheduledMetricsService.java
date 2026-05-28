package com.propulse.service;

import com.propulse.domain.Project;
import com.propulse.domain.Task;
import com.propulse.domain.TaskStatus;
import com.propulse.repository.ProjectRepository;
import com.propulse.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledMetricsService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    // Standard Cron runs every 60 seconds for live visual verification of the background worker!
    // In production, this would be set to midnight: "0 0 0 * * ?"
    @Scheduled(cron = "*/60 * * * * *")
    public void aggregateProjectVelocityMetrics() {
        log.info("Cron Engine (Every 60s): Initiating background velocity check at {}...", LocalDateTime.now());
        
        List<Project> projects = projectRepository.findAll();
        if (projects.isEmpty()) {
            log.info("Cron Engine: No active projects found for compilation.");
            return;
        }

        for (Project p : projects) {
            List<Task> tasks = taskRepository.findByProjectIdOrderByOrderIndexAsc(p.getId());
            long total = tasks.size();
            long completed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            
            int totalStoryPoints = tasks.stream()
                    .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                    .sum();
            int completedPoints = tasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE)
                    .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                    .sum();

            double velocityPercentage = total > 0 ? ((double) completed / total) * 100 : 0.0;

            log.info("Cron Engine [Project {} - {}]: Active Tasks = {}, Complete Tasks = {}, Velocity = {}% (Points: {}/{})",
                    p.getCode(), p.getName(), total, completed, String.format("%.2f", velocityPercentage), completedPoints, totalStoryPoints);
        }
    }
}
