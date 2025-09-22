const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, userSchemas, handleValidationErrors } = require('../middleware/validation');

// Public routes
router.post('/register', 
  validate(userSchemas.register, 'body'),
  AuthController.register
);

router.post('/login', 
  validate(userSchemas.login, 'body'),
  AuthController.login
);

router.post('/refresh-token', 
  AuthController.refreshToken
);

router.post('/forgot-password', 
  AuthController.forgotPassword
);

router.post('/reset-password/:token', 
  AuthController.resetPassword
);

router.get('/verify-email/:token', 
  AuthController.verifyEmail
);

router.post('/resend-verification', 
  AuthController.resendVerificationEmail
);

// Protected routes
router.use(authenticate);

router.post('/logout', 
  AuthController.logout
);

router.get('/profile', 
  AuthController.getProfile
);

router.put('/profile', 
  validate(userSchemas.updateProfile, 'body'),
  AuthController.updateProfile
);

router.put('/change-password', 
  validate(userSchemas.changePassword, 'body'),
  AuthController.changePassword
);

router.post('/api-keys', 
  AuthController.generateApiKey
);

router.get('/api-keys', 
  AuthController.getApiKeys
);

router.delete('/api-keys/:keyId', 
  AuthController.revokeApiKey
);

// Admin routes
router.get('/users', 
  authorize('admin'),
  AuthController.getAllUsers
);

router.put('/users/:userId/deactivate', 
  authorize('admin'),
  AuthController.deactivateUser
);

router.put('/users/:userId/activate', 
  authorize('admin'),
  AuthController.activateUser
);

module.exports = router;
