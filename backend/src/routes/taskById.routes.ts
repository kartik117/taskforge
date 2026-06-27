import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateBody } from '../middleware/validate';
import * as taskController from '../controllers/taskController';

const router = Router();

router.use(requireAuth);

router.patch('/:id', validateBody(taskController.updateTaskSchema), asyncHandler(taskController.update));
router.delete('/:id', asyncHandler(taskController.remove));

export default router;
