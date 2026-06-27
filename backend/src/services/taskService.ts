import { Types } from 'mongoose';
import { Task, ITask, TaskStatus, TaskPriority } from '../models/Task';
import { AppError } from '../utils/AppError';
import { getProjectForMember } from './projectService';

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string | null;
  dueDate?: string | null;
}

export async function createTask(projectId: string, userId: string, input: CreateTaskInput): Promise<ITask> {
  await getProjectForMember(projectId, userId);
  return Task.create({
    project: projectId,
    title: input.title,
    description: input.description,
    priority: input.priority ?? 'medium',
    assignee: input.assignee,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
  });
}

export async function listTasksForProject(projectId: string, userId: string): Promise<ITask[]> {
  await getProjectForMember(projectId, userId);
  return Task.find({ project: projectId }).sort({ createdAt: 1 });
}

async function getTaskWithAccessCheck(taskId: string, userId: string): Promise<ITask> {
  if (!Types.ObjectId.isValid(taskId)) {
    throw AppError.notFound('Task not found');
  }
  const task = await Task.findById(taskId);
  if (!task) {
    throw AppError.notFound('Task not found');
  }
  await getProjectForMember(task.project.toString(), userId);
  return task;
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<ITask> {
  const task = await getTaskWithAccessCheck(taskId, userId);
  if (input.title !== undefined) task.title = input.title;
  if (input.description !== undefined) task.description = input.description;
  if (input.status !== undefined) task.status = input.status;
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.assignee !== undefined) {
    task.assignee = input.assignee ? new Types.ObjectId(input.assignee) : undefined;
  }
  if (input.dueDate !== undefined) {
    task.dueDate = input.dueDate ? new Date(input.dueDate) : undefined;
  }
  await task.save();
  return task;
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  const task = await getTaskWithAccessCheck(taskId, userId);
  await task.deleteOne();
}
