import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateBody } from '../middleware/validate';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', validateBody(authController.registerSchema), asyncHandler(authController.register));
router.post('/login', validateBody(authController.loginSchema), asyncHandler(authController.login));
router.post(
  '/register/verify-otp',
  validateBody(authController.verifyOtpSchema),
  asyncHandler(authController.verifyRegisterOtp)
);
router.post(
  '/login/verify-otp',
  validateBody(authController.verifyOtpSchema),
  asyncHandler(authController.verifyLoginOtp)
);

export default router;
