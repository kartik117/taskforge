import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import * as taskService from '../services/taskService';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export async function create(req: AuthenticatedRequest, res: Response): Promise<void> {
  const task = await taskService.createTask(req.params.projectId, req.userId as string, req.body);
  res.status(201).json(task);
}

export async function listForProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tasks = await taskService.listTasksForProject(req.params.projectId, req.userId as string);
  res.status(200).json(tasks);
}

export async function update(req: AuthenticatedRequest, res: Response): Promise<void> {
  const task = await taskService.updateTask(req.params.id, req.userId as string, req.body);
  res.status(200).json(task);
}

export async function remove(req: AuthenticatedRequest, res: Response): Promise<void> {
  await taskService.deleteTask(req.params.id, req.userId as string);
  res.status(204).send();
}
