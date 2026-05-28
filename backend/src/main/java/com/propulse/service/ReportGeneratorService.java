package com.propulse.service;

import com.propulse.domain.Task;
import com.propulse.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportGeneratorService {

    private final TaskRepository taskRepository;

    @Async
    public CompletableFuture<String> generateTaskReport(Long projectId, String projectCode, String username) {
        log.info("Async Thread '{}': Starting task report compilation for project ID {}", 
                Thread.currentThread().getName(), projectId);

        try {
            // Simulate complex analytics processing or PDF compiling
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Report generation interrupted: {}", e.getMessage());
            return CompletableFuture.failedFuture(e);
        }

        List<Task> tasks = taskRepository.findByProjectIdOrderByOrderIndexAsc(projectId);

        // Generate reports folder inside project scratch directory
        String reportsDirPath = "C:\\Users\\mohan krishna\\.gemini\\antigravity\\scratch\\propulse-platform\\backend\\reports";
        File reportsDir = new File(reportsDirPath);
        if (!reportsDir.exists()) {
            reportsDir.mkdirs();
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = String.format("Report_%s_%s.csv", projectCode, timestamp);
        File csvFile = new File(reportsDir, filename);

        try (FileWriter writer = new FileWriter(csvFile)) {
            // Write CSV headers
            writer.write("Task ID,Key,Title,Status,Priority,Story Points,Assignee,Created At\n");

            // Write Task values
            for (Task t : tasks) {
                String assignee = t.getAssignee() != null ? t.getAssignee().getUsername() : "Unassigned";
                writer.write(String.format("%d,%s-%d,\"%s\",%s,%s,%d,%s,%s\n",
                        t.getId(),
                        projectCode,
                        t.getId(),
                        t.getTitle().replace("\"", "\"\""),
                        t.getStatus().name(),
                        t.getPriority().name(),
                        t.getStoryPoints() != null ? t.getStoryPoints() : 0,
                        assignee,
                        t.getCreatedAt()
                ));
            }
            log.info("Async Thread '{}': Completed compilation successfully. File saved at {}", 
                    Thread.currentThread().getName(), csvFile.getAbsolutePath());

            return CompletableFuture.completedFuture(filename);

        } catch (IOException e) {
            log.error("Failed to write task report file: {}", e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }
}
