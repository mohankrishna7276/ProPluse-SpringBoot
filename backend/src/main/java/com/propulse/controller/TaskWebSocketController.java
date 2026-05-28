package com.propulse.controller;

import com.propulse.dto.TaskDTO;
import com.propulse.dto.TaskMoveRequest;
import com.propulse.service.AuditLogService;
import com.propulse.service.ProjectStatsService;
import com.propulse.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class TaskWebSocketController {

    private final TaskService taskService;
    private final AuditLogService auditLogService;
    private final ProjectStatsService projectStatsService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/project/{projectId}/move-task/{taskId}")
    public void moveTask(
            @DestinationVariable Long projectId,
            @DestinationVariable Long taskId,
            @Payload TaskMoveRequest moveRequest,
            Principal principal) {
        
        String username = principal != null ? principal.getName() : "Anonymous User";
        log.info("WebSocket: User '{}' moving task {} inside project {}", username, taskId, projectId);

        try {
            // 1. Move task in database (using our enterprise transactional shift index algorithm)
            TaskDTO movedTask = taskService.moveTask(taskId, moveRequest);

            // 2. Clear project statistics cache so dashboard recalculates on next read
            projectStatsService.evictProjectStats(projectId);

            // 3. Log audit event asynchronously
            String logDetails = String.format("Task '%s' was moved to %s column at index %d by %s.",
                    movedTask.title(), movedTask.status(), movedTask.orderIndex(), username);
            auditLogService.log(projectId, username, "TASK_MOVED", logDetails);

            // 4. Broadcast the update event to all subscribers listening to this project's channel
            // Payload contains the moved task and a human-readable notification event message
            BoardEvent event = new BoardEvent("TASK_MOVED", movedTask, logDetails, username);
            messagingTemplate.convertAndSend("/topic/project/" + projectId + "/board", event);

        } catch (Exception e) {
            log.error("WebSocket card movement failure: {}", e.getMessage(), e);
            // Send error notification privately or to board
            messagingTemplate.convertAndSend("/topic/project/" + projectId + "/board", 
                    new BoardEvent("ERROR", null, "Failed to move task: " + e.getMessage(), "SYSTEM"));
        }
    }

    // Dynamic record payload representing STOMP board broadcasts
    public record BoardEvent(
            String type,
            TaskDTO task,
            String message,
            String actor
    ) {}
}
