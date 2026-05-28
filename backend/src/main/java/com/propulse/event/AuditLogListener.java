package com.propulse.event;

import com.propulse.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogListener {

    private final AuditLogService auditLogService;

    @Async
    @EventListener
    public void handleAuditLogEvent(AuditLogEvent event) {
        log.info("Async Listener: Processing audit log event for action {} in separate thread: {}", 
                event.action(), Thread.currentThread().getName());
        try {
            auditLogService.log(event.projectId(), event.username(), event.action(), event.details());
        } catch (Exception e) {
            log.error("Async Listener failed to log audit transaction: {}", e.getMessage());
        }
    }
}
