import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateBody } from '../middleware/validate';
import * as projectController from '../controllers/projectController';
import taskRouter from './task.routes';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(projectController.createProjectSchema), asyncHandler(projectController.create));
router.get('/', asyncHandler(projectController.list));
router.get('/:id', asyncHandler(projectController.getOne));
router.post(
  '/:id/members',
  validateBody(projectController.addMemberSchema),
  asyncHandler(projectController.addMember)
);
router.delete('/:id', asyncHandler(projectController.remove));

router.use('/:projectId/tasks', taskRouter);

export default router;
