import express from 'express';
import {
  createUser,
  getUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe,
  getUserStats,
  changePassword
} from '../controllers/userController';
import { validateRequest } from '../middleware/validateRequest';
import {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserIdParamSchema,
  PaginationQuerySchema,
  ChangePasswordRequestSchema
} from '../schemas';
import { protect, restrictTo } from '../middleware/auth';


const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Current user routes
router.get('/me', getMe, getUser);
router.patch('/me', validateRequest(UpdateUserRequestSchema), updateMe);
router.delete('/me', deleteMe);

// User management routes - admin only for most operations
router.get('/stats', restrictTo('admin'), getUserStats);
router.get('/', restrictTo('admin'), validateRequest(PaginationQuerySchema), getAllUsers);

// Admin-only user creation
router.post('/', restrictTo('admin'), validateRequest(CreateUserRequestSchema), createUser);

router
  .route('/:id')
  .get(validateRequest(UserIdParamSchema), getUser)
  .patch(validateRequest(UserIdParamSchema), validateRequest(UpdateUserRequestSchema), restrictTo('admin'), updateUser)
  .delete(validateRequest(UserIdParamSchema), restrictTo('admin'), deleteUser);

router.patch(
  '/:id/change-password',
  validateRequest(UserIdParamSchema),
  validateRequest(ChangePasswordRequestSchema),
  restrictTo('admin'),
  changePassword
);


export default router;
