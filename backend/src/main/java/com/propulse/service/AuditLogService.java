package com.propulse.service;

import com.propulse.domain.AuditLog;
import com.propulse.domain.Project;
import com.propulse.domain.User;
import com.propulse.exception.ResourceNotFoundException;
import com.propulse.repository.AuditLogRepository;
import com.propulse.repository.ProjectRepository;
import com.propulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(Long projectId, String username, String action, String details) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        User user = null;
        if (username != null) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        AuditLog logEntry = AuditLog.builder()
                .project(project)
                .user(user)
                .action(action)
                .details(details)
                .build();

        auditLogRepository.save(logEntry);
        log.debug("Logged audit action: {} for project {}", action, projectId);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByProject(Long projectId, int page, int size) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found: " + projectId);
        }
        Pageable pageable = PageRequest.of(page, size);
        return auditLogRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable);
    }
}
