package com.propulse.event;

public record AuditLogEvent(
    Long projectId,
    String username,
    String action,
    String details
) {}
