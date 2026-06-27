import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import * as projectService from '../services/projectService';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
});

export async function create(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, description } = req.body as z.infer<typeof createProjectSchema>;
  const project = await projectService.createProject(req.userId as string, name, description);
  res.status(201).json(project);
}

export async function list(req: AuthenticatedRequest, res: Response): Promise<void> {
  const projects = await projectService.listProjectsForUser(req.userId as string);
  res.status(200).json(projects);
}

export async function getOne(req: AuthenticatedRequest, res: Response): Promise<void> {
  const project = await projectService.getProjectForMember(req.params.id, req.userId as string);
  res.status(200).json(project);
}

export async function addMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { email } = req.body as z.infer<typeof addMemberSchema>;
  const project = await projectService.addMember(req.params.id, req.userId as string, email);
  res.status(200).json(project);
}

export async function remove(req: AuthenticatedRequest, res: Response): Promise<void> {
  await projectService.deleteProject(req.params.id, req.userId as string);
  res.status(204).send();
}
