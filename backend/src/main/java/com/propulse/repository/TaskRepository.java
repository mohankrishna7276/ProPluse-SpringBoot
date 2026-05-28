package com.propulse.repository;

import com.propulse.domain.Task;
import com.propulse.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectIdOrderByOrderIndexAsc(Long projectId);
    List<Task> findByProjectIdAndStatusOrderByOrderIndexAsc(Long projectId, TaskStatus status);
    long countByProjectId(Long projectId);
    long countByProjectIdAndStatus(Long projectId, TaskStatus status);
}
