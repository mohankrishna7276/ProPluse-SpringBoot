package com.propulse.controller;

import com.propulse.dto.TaskDTO;
import com.propulse.dto.TaskMoveRequest;
import com.propulse.service.ProjectService;
import com.propulse.service.ProjectStatsService;
import com.propulse.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class TaskController {

    private final TaskService taskService;
    private final ProjectService projectService;
    private final ProjectStatsService projectStatsService;

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskDTO>> getTasks(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        projectService.getMembership(projectId, userDetails.getUsername());
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskDTO> createTask(
            @PathVariable Long projectId,
            @Valid @RequestBody TaskDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        projectService.getMembership(projectId, userDetails.getUsername());
        
        TaskDTO saved = taskService.createTask(projectId, dto);
        projectStatsService.evictProjectStats(projectId);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDTO> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Assert project membership via projectId
        projectService.getMembership(dto.projectId(), userDetails.getUsername());

        TaskDTO updated = taskService.updateTask(taskId, dto);
        projectStatsService.evictProjectStats(dto.projectId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long taskId,
            @RequestParam Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        projectService.getMembership(projectId, userDetails.getUsername());

        taskService.deleteTask(taskId);
        projectStatsService.evictProjectStats(projectId);
        return ResponseEntity.noContent().build();
    }

    // HTTP fallback for drag and drop operations (Websockets is primary)
    @PatchMapping("/tasks/{taskId}/move")
    public ResponseEntity<TaskDTO> moveTask(
            @PathVariable Long taskId,
            @RequestParam Long projectId,
            @Valid @RequestBody TaskMoveRequest moveRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        projectService.getMembership(projectId, userDetails.getUsername());

        TaskDTO moved = taskService.moveTask(taskId, moveRequest);
        projectStatsService.evictProjectStats(projectId);
        return ResponseEntity.ok(moved);
    }
}
