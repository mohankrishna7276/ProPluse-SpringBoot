-- Insert Users (Password is 'password' for all, BCrypt hashed)
-- Hash: $2a$10$wK1mB5qP5e4QZ62/8k3.i.wD1U9H2y1Gj5lD4w9fUfQx8S2bW.gK6
INSERT INTO users (username, email, password_hash, created_at) VALUES 
('alex_admin', 'admin@propulse.com', '$2a$10$wK1mB5qP5e4QZ62/8k3.i.wD1U9H2y1Gj5lD4w9fUfQx8S2bW.gK6', CURRENT_TIMESTAMP()),
('beatrice_mgr', 'manager@propulse.com', '$2a$10$wK1mB5qP5e4QZ62/8k3.i.wD1U9H2y1Gj5lD4w9fUfQx8S2bW.gK6', CURRENT_TIMESTAMP()),
('charlie_dev', 'dev@propulse.com', '$2a$10$wK1mB5qP5e4QZ62/8k3.i.wD1U9H2y1Gj5lD4w9fUfQx8S2bW.gK6', CURRENT_TIMESTAMP()),
('diana_viewer', 'viewer@propulse.com', '$2a$10$wK1mB5qP5e4QZ62/8k3.i.wD1U9H2y1Gj5lD4w9fUfQx8S2bW.gK6', CURRENT_TIMESTAMP());

-- Insert Projects
INSERT INTO projects (name, code, description, created_at) VALUES 
('ProPulse Web Platform', 'PROP', 'Core web dashboard and backend services development including dashboard telemetry and security frameworks.', CURRENT_TIMESTAMP()),
('ProPulse Mobile Application', 'MOB', 'iOS and Android client development using React Native and native bindings.', CURRENT_TIMESTAMP());

-- Insert Project Members
-- alex_admin (User 1) is ADMIN on Project 1 and Project 2
-- beatrice_mgr (User 2) is MANAGER on Project 1
-- charlie_dev (User 3) is CONTRIBUTOR on Project 1 and Project 2
-- diana_viewer (User 4) is VIEWER on Project 1
INSERT INTO project_members (project_id, user_id, role, joined_at) VALUES 
(1, 1, 'ADMIN', CURRENT_TIMESTAMP()),
(2, 1, 'ADMIN', CURRENT_TIMESTAMP()),
(1, 2, 'MANAGER', CURRENT_TIMESTAMP()),
(1, 3, 'CONTRIBUTOR', CURRENT_TIMESTAMP()),
(2, 3, 'CONTRIBUTOR', CURRENT_TIMESTAMP()),
(1, 4, 'VIEWER', CURRENT_TIMESTAMP());

-- Insert Tasks for Project 1 (PROP - Web Platform)
INSERT INTO tasks (project_id, assignee_id, title, description, status, priority, story_points, order_index, created_at) VALUES 
(1, 3, 'Integrate Caffeine Caching', 'Configure Caffeine local cache in application configuration and annotate statistics services to prevent N+1 query overhead.', 'DONE', 'HIGH', 5, 0, DATEADD('DAY', -5, CURRENT_TIMESTAMP())),
(1, 3, 'Secure API Endpoints with JWT', 'Design and implement Spring Security filter chain with custom JWT validation filter and claims extraction.', 'DONE', 'CRITICAL', 8, 1, DATEADD('DAY', -4, CURRENT_TIMESTAMP())),
(1, 2, 'Design Team Analytics Dashboard UI', 'Create responsive dashboard wireframes with glassmorphism layout, prioritizing telemetry charts like Burndown and Velocity.', 'IN_PROGRESS', 'MEDIUM', 3, 0, DATEADD('DAY', -3, CURRENT_TIMESTAMP())),
(1, 3, 'Establish WebSocket Connection', 'Set up STOMP messaging protocol broker in backend and build customized hook in React client for live board syncing.', 'IN_PROGRESS', 'HIGH', 5, 1, DATEADD('DAY', -2, CURRENT_TIMESTAMP())),
(1, 1, 'Write Production Dockerfile', 'Create multi-stage Docker build files for both backend and frontend applications to streamline containerized environments.', 'IN_REVIEW', 'LOW', 2, 0, DATEADD('DAY', -1, CURRENT_TIMESTAMP())),
(1, NULL, 'Set Up Liquibase DB Migrations', 'Replace Hibernate auto-schema creation with Liquibase XML/YAML changelogs for tracking production DDL changes.', 'TODO', 'MEDIUM', 5, 0, CURRENT_TIMESTAMP()),
(1, NULL, 'Write Unit Tests for Auth APIs', 'Implement comprehensive mock validation tests for User Details Services and stateless JWT token providers.', 'TODO', 'LOW', 3, 1, CURRENT_TIMESTAMP());

-- Insert Tasks for Project 2 (MOB - Mobile App)
INSERT INTO tasks (project_id, assignee_id, title, description, status, priority, story_points, order_index, created_at) VALUES 
(2, 3, 'Setup Expo Starter Code', 'Initialize React Native template using Expo prebuilds and configure styling tokens.', 'DONE', 'HIGH', 3, 0, DATEADD('DAY', -4, CURRENT_TIMESTAMP())),
(2, 1, 'Configure Mobile Auth Store', 'Design secure keychain storage mapping to maintain stateless authorization tokens across app restarts.', 'IN_PROGRESS', 'CRITICAL', 5, 0, DATEADD('DAY', -2, CURRENT_TIMESTAMP())),
(2, NULL, 'Draft Push Notification Handler', 'Integrate Apple APNS and Google FCM payload receivers in background listeners.', 'TODO', 'HIGH', 8, 0, CURRENT_TIMESTAMP());

-- Insert Audit Logs
INSERT INTO audit_logs (project_id, user_id, action, details, created_at) VALUES 
(1, 1, 'PROJECT_CREATED', 'Project ProPulse Web Platform (PROP) was successfully initialized by Administrator.', DATEADD('DAY', -5, CURRENT_TIMESTAMP())),
(1, 3, 'TASK_COMPLETED', 'Task PROP-1: Integrate Caffeine Caching was marked as COMPLETED by charlie_dev.', DATEADD('DAY', -3, CURRENT_TIMESTAMP())),
(1, 1, 'MEMBER_ADDED', 'User charlie_dev was added to the project workspace with role CONTRIBUTOR.', DATEADD('DAY', -2, CURRENT_TIMESTAMP())),
(1, 3, 'TASK_MOVED', 'Task PROP-3: Design Team Analytics Dashboard UI was moved to IN_PROGRESS.', DATEADD('DAY', -1, CURRENT_TIMESTAMP()));
