package com.propulse.service;

import com.propulse.domain.*;
import com.propulse.dto.TaskDTO;
import com.propulse.dto.TaskMoveRequest;
import com.propulse.exception.BadRequestException;
import com.propulse.exception.ResourceNotFoundException;
import com.propulse.repository.ProjectRepository;
import com.propulse.repository.TaskRepository;
import com.propulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByProject(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found");
        }
        return taskRepository.findByProjectIdOrderByOrderIndexAsc(projectId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskDTO createTask(Long projectId, TaskDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        User assignee = null;
        if (dto.assigneeId() != null) {
            assignee = userRepository.findById(dto.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
        }

        // Place new task at the end of the TODO list column
        List<Task> existingTasks = taskRepository.findByProjectIdAndStatusOrderByOrderIndexAsc(projectId, TaskStatus.TODO);
        int nextOrderIndex = existingTasks.size();

        Task task = Task.builder()
                .project(project)
                .assignee(assignee)
                .title(dto.title())
                .description(dto.description())
                .status(TaskStatus.TODO) // default
                .priority(TaskPriority.valueOf(dto.priority().toUpperCase()))
                .storyPoints(dto.storyPoints() != null ? dto.storyPoints() : 0)
                .orderIndex(nextOrderIndex)
                .build();

        Task savedTask = taskRepository.save(task);
        log.info("Created task '{}' with key {}-{}", savedTask.getTitle(), project.getCode(), savedTask.getId());
        return mapToDTO(savedTask);
    }

    @Transactional
    public TaskDTO moveTask(Long taskId, TaskMoveRequest req) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        TaskStatus sourceStatus = task.getStatus();
        TaskStatus destStatus = TaskStatus.valueOf(req.status().toUpperCase());
        int sourceIndex = task.getOrderIndex();
        int destIndex = req.orderIndex();

        Long projectId = task.getProject().getId();

        // 1. If moving within the same status column
        if (sourceStatus == destStatus) {
            List<Task> tasks = taskRepository.findByProjectIdAndStatusOrderByOrderIndexAsc(projectId, sourceStatus);
            if (sourceIndex != destIndex) {
                for (Task t : tasks) {
                    if (sourceIndex < destIndex) {
                        // Dragging downwards
                        if (t.getOrderIndex() > sourceIndex && t.getOrderIndex() <= destIndex) {
                            t.setOrderIndex(t.getOrderIndex() - 1);
                        }
                    } else {
                        // Dragging upwards
                        if (t.getOrderIndex() >= destIndex && t.getOrderIndex() < sourceIndex) {
                            t.setOrderIndex(t.getOrderIndex() + 1);
                        }
                    }
                }
                task.setOrderIndex(destIndex);
                taskRepository.saveAll(tasks);
            }
        } else {
            // 2. Moving across columns
            // Shift elements in source column downwards
            List<Task> sourceTasks = taskRepository.findByProjectIdAndStatusOrderByOrderIndexAsc(projectId, sourceStatus);
            for (Task t : sourceTasks) {
                if (t.getOrderIndex() > sourceIndex) {
                    t.setOrderIndex(t.getOrderIndex() - 1);
                }
            }
            taskRepository.saveAll(sourceTasks);

            // Shift elements in destination column upwards to make space
            List<Task> destTasks = taskRepository.findByProjectIdAndStatusOrderByOrderIndexAsc(projectId, destStatus);
            for (Task t : destTasks) {
                if (t.getOrderIndex() >= destIndex) {
                    t.setOrderIndex(t.getOrderIndex() + 1);
                }
            }
            task.setStatus(destStatus);
            task.setOrderIndex(destIndex);
            taskRepository.saveAll(destTasks);
        }

        // Optional Assignee Update during drag
        if (req.assigneeId() != null) {
            User newAssignee = userRepository.findById(req.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("New assignee user not found"));
            task.setAssignee(newAssignee);
        }

        Task savedTask = taskRepository.save(task);
        log.debug("Moved task {} to status {} at index {}", taskId, destStatus, destIndex);
        return mapToDTO(savedTask);
    }

    @Transactional
    public TaskDTO updateTask(Long taskId, TaskDTO dto) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        task.setTitle(dto.title());
        task.setDescription(dto.description());
        task.setPriority(TaskPriority.valueOf(dto.priority().toUpperCase()));
        task.setStoryPoints(dto.storyPoints() != null ? dto.storyPoints() : 0);

        if (dto.assigneeId() != null) {
            User assignee = userRepository.findById(dto.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }

        Task savedTask = taskRepository.save(task);
        log.info("Updated task details for: {}", taskId);
        return mapToDTO(savedTask);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        
        // Re-align remaining tasks in same column
        List<Task> remaining = taskRepository.findByProjectIdAndStatusOrderByOrderIndexAsc(task.getProject().getId(), task.getStatus());
        for (Task t : remaining) {
            if (t.getOrderIndex() > task.getOrderIndex()) {
                t.setOrderIndex(t.getOrderIndex() - 1);
            }
        }
        taskRepository.saveAll(remaining);
        taskRepository.delete(task);
        log.info("Deleted task: {}", taskId);
    }

    private TaskDTO mapToDTO(Task t) {
        return new TaskDTO(
                t.getId(),
                t.getProject().getId(),
                t.getProject().getCode(),
                t.getTitle(),
                t.getDescription(),
                t.getStatus().name(),
                t.getPriority().name(),
                t.getStoryPoints(),
                t.getOrderIndex(),
                t.getAssignee() != null ? t.getAssignee().getId() : null,
                t.getAssignee() != null ? t.getAssignee().getUsername() : null,
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
