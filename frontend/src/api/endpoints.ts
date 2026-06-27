import { apiRequest } from './client';
import { Project, Task, TaskStatus, TaskPriority, User } from './types';

export function register(name: string, email: string, password: string) {
  return apiRequest<{ userId: string; purpose: 'register' }>('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

export function login(email: string, password: string) {
  return apiRequest<{ userId: string; purpose: 'login' }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function verifyOtp(purpose: 'register' | 'login', userId: string, code: string) {
  return apiRequest<{ token: string; user: User }>(`/api/auth/${purpose}/verify-otp`, {
    method: 'POST',
    body: { userId, code },
  });
}

export function listProjects(token: string) {
  return apiRequest<Project[]>('/api/projects', { token });
}

export function createProject(token: string, name: string, description?: string) {
  return apiRequest<Project>('/api/projects', { method: 'POST', token, body: { name, description } });
}

export function getProject(token: string, projectId: string) {
  return apiRequest<Project>(`/api/projects/${projectId}`, { token });
}

export function addMember(token: string, projectId: string, email: string) {
  return apiRequest<Project>(`/api/projects/${projectId}/members`, { method: 'POST', token, body: { email } });
}

export function listTasks(token: string, projectId: string) {
  return apiRequest<Task[]>(`/api/projects/${projectId}/tasks`, { token });
}

export function createTask(
  token: string,
  projectId: string,
  input: { title: string; description?: string; priority?: TaskPriority }
) {
  return apiRequest<Task>(`/api/projects/${projectId}/tasks`, { method: 'POST', token, body: input });
}

export function updateTask(token: string, taskId: string, input: { status?: TaskStatus; priority?: TaskPriority }) {
  return apiRequest<Task>(`/api/tasks/${taskId}`, { method: 'PATCH', token, body: input });
}

export function deleteTask(token: string, taskId: string) {
  return apiRequest<void>(`/api/tasks/${taskId}`, { method: 'DELETE', token });
}
