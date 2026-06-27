import { Types } from 'mongoose';
import { Project, IProject } from '../models/Project';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { AppError } from '../utils/AppError';

export async function createProject(ownerId: string, name: string, description?: string): Promise<IProject> {
  return Project.create({ name, description, owner: ownerId, members: [ownerId] });
}

export async function listProjectsForUser(userId: string): Promise<IProject[]> {
  return Project.find({ $or: [{ owner: userId }, { members: userId }] }).sort({ createdAt: -1 });
}

export async function getProjectForMember(projectId: string, userId: string): Promise<IProject> {
  if (!Types.ObjectId.isValid(projectId)) {
    throw AppError.notFound('Project not found');
  }
  const project = await Project.findById(projectId);
  if (!project) {
    throw AppError.notFound('Project not found');
  }
  const isMember = project.members.some((m) => m.toString() === userId) || project.owner.toString() === userId;
  if (!isMember) {
    throw AppError.forbidden('You are not a member of this project');
  }
  return project;
}

export async function addMember(projectId: string, requesterId: string, memberEmail: string): Promise<IProject> {
  const project = await getProjectForMember(projectId, requesterId);
  if (project.owner.toString() !== requesterId) {
    throw AppError.forbidden('Only the project owner can add members');
  }
  const member = await User.findOne({ email: memberEmail.toLowerCase() });
  if (!member) {
    throw AppError.notFound('No user with that email');
  }
  if (!project.members.some((m) => m.toString() === member._id.toString())) {
    project.members.push(member._id);
    await project.save();
  }
  return project;
}

export async function deleteProject(projectId: string, requesterId: string): Promise<void> {
  const project = await getProjectForMember(projectId, requesterId);
  if (project.owner.toString() !== requesterId) {
    throw AppError.forbidden('Only the project owner can delete this project');
  }
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
}
