package com.propulse.controller;

import com.propulse.domain.AuditLog;
import com.propulse.dto.ProjectDTO;
import com.propulse.dto.ProjectMemberDTO;
import com.propulse.dto.ProjectStatsDTO;
import com.propulse.service.AuditLogService;
import com.propulse.service.ProjectService;
import com.propulse.service.ProjectStatsService;
import com.propulse.service.ReportGeneratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectStatsService projectStatsService;
    private final ReportGeneratorService reportGeneratorService;
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<ProjectDTO>> getUserProjects(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(projectService.getProjectsForUser(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<ProjectDTO> createProject(
            @Valid @RequestBody ProjectDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return new ResponseEntity<>(projectService.createProject(dto, userDetails.getUsername()), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ProjectMemberDTO>> getMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Assert project access
        projectService.getMembership(id, userDetails.getUsername());
        return ResponseEntity.ok(projectService.getProjectMembers(id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ProjectMemberDTO> addMember(
            @PathVariable Long id,
            @RequestParam String username,
            @RequestParam String role,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Assert user has ADMIN role on this project to modify memberships
        var member = projectService.getMembership(id, userDetails.getUsername());
        if (!"ADMIN".equalsIgnoreCase(member.getRole().name()) && !"MANAGER".equalsIgnoreCase(member.getRole().name())) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return new ResponseEntity<>(projectService.addMember(id, username, role), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ProjectStatsDTO> getStats(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Assert project access
        projectService.getMembership(id, userDetails.getUsername());
        return ResponseEntity.ok(projectStatsService.getProjectStats(id));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<Page<AuditLog>> getLogs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Assert project access
        projectService.getMembership(id, userDetails.getUsername());
        return ResponseEntity.ok(auditLogService.getLogsByProject(id, page, size));
    }

    @PostMapping("/{id}/export")
    public ResponseEntity<String> exportTasks(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        var membership = projectService.getMembership(id, userDetails.getUsername());
        var project = membership.getProject();
        
        // Trigger report in background (Async thread)
        reportGeneratorService.generateTaskReport(id, project.getCode(), userDetails.getUsername());
        
        // Return 202 Accepted immediately
        return ResponseEntity.accepted().body("Task report generation initiated successfully. The spreadsheet is compiling in the background.");
    }
}
