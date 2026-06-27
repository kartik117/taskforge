import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateBody } from '../middleware/validate';
import * as taskController from '../controllers/taskController';

// mergeParams so this nested router (mounted at /api/projects/:projectId/tasks) can read req.params.projectId
const router = Router({ mergeParams: true });

router.post('/', validateBody(taskController.createTaskSchema), asyncHandler(taskController.create));
router.get('/', asyncHandler(taskController.listForProject));

export default router;
