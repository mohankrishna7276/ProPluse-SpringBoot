export interface User {
  username: string;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  description: string;
  createdAt: string;
}

export interface ProjectMember {
  id: number;
  userId: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER';
}

export interface Task {
  id: number;
  projectId: number;
  projectCode: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  storyPoints: number;
  orderIndex: number;
  assigneeId: number | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserWorkload {
  username: string;
  taskCount: number;
  storyPoints: number;
}

export interface ProjectStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  doneTasks: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  workloads: UserWorkload[];
}

export interface BoardEvent {
  type: string;
  task: Task | null;
  message: string;
  actor: string;
}
