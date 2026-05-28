package com.propulse.service;

import com.propulse.domain.*;
import com.propulse.dto.ProjectDTO;
import com.propulse.dto.ProjectMemberDTO;
import com.propulse.exception.BadRequestException;
import com.propulse.exception.ResourceNotFoundException;
import com.propulse.repository.ProjectMemberRepository;
import com.propulse.repository.ProjectRepository;
import com.propulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        List<ProjectMember> memberships = projectMemberRepository.findByUserId(user.getId());
        return memberships.stream()
                .map(m -> mapToProjectDTO(m.getProject()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectDTO createProject(ProjectDTO dto, String creatorUsername) {
        if (projectRepository.existsByCode(dto.code().toUpperCase())) {
            throw new BadRequestException("Project code '" + dto.code() + "' is already in use");
        }

        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorUsername));

        Project project = Project.builder()
                .name(dto.name())
                .code(dto.code().toUpperCase())
                .description(dto.description())
                .build();

        Project savedProject = projectRepository.save(project);

        // Add creator as ADMIN of the project
        ProjectMember adminMember = ProjectMember.builder()
                .project(savedProject)
                .user(creator)
                .role(ProjectRole.ADMIN)
                .build();
        projectMemberRepository.save(adminMember);

        log.info("Project created: {} ({}) by {}", savedProject.getName(), savedProject.getCode(), creatorUsername);
        return mapToProjectDTO(savedProject);
    }

    @Transactional
    public ProjectMemberDTO addMember(Long projectId, String username, String roleName) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            throw new BadRequestException("User is already a member of this project");
        }

        ProjectRole role;
        try {
            role = ProjectRole.valueOf(roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid project role: " + roleName);
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .role(role)
                .build();
        ProjectMember savedMember = projectMemberRepository.save(member);

        log.info("Added user {} to project {} as {}", username, project.getName(), roleName);
        return mapToMemberDTO(savedMember);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberDTO> getProjectMembers(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found");
        }
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(this::mapToMemberDTO)
                .collect(Collectors.toList());
    }

    public ProjectMember getMembership(Long projectId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new BadRequestException("User does not have access to this project"));
    }

    private ProjectDTO mapToProjectDTO(Project project) {
        return new ProjectDTO(
                project.getId(),
                project.getName(),
                project.getCode(),
                project.getDescription(),
                project.getCreatedAt()
        );
    }

    private ProjectMemberDTO mapToMemberDTO(ProjectMember member) {
        return new ProjectMemberDTO(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getUser().getEmail(),
                member.getRole().name()
        );
    }
}
