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
import { userValidation, paginationValidation } from '../middleware/validation';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Current user routes
router.get('/me', getMe, getUser);
router.patch('/me', userValidation.update, updateMe);
router.delete('/me', deleteMe);

// User management routes - admin only for most operations
router.get('/stats', restrictTo('admin'), getUserStats);
router.get('/', restrictTo('admin'), paginationValidation, getAllUsers);

// Admin-only user creation
router.post('/', restrictTo('admin'), userValidation.create, createUser);

router
  .route('/:id')
  .get(userValidation.params, getUser)
  .patch(userValidation.params, userValidation.update, restrictTo('admin'), updateUser)
  .delete(userValidation.params, restrictTo('admin'), deleteUser);

router.patch(
  '/:id/change-password',
  userValidation.params,
  userValidation.changePassword,
  restrictTo('admin'),
  changePassword
);

export default router;
