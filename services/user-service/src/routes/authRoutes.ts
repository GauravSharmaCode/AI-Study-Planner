import express, { Request, Response } from 'express';
import { register, login, logout } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { CreateUserRequestSchema, LoginRequestSchema } from '../schemas';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, name, preferences? }
 */
router.post('/register',
  validateRequest(CreateUserRequestSchema),
  register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 * @body    { email, password }
 */
router.post('/login',
  validateRequest(LoginRequestSchema),
  login
);


/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/logout',
  optionalAuth,
  logout
);

/**
 * @route   GET /api/v1/auth/health
 * @desc    Health check for auth routes
 * @access  Public
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'user-service-auth',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/logout'
    ]
  });
});

export default router;
