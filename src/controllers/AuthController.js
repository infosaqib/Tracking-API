const AuthService = require('../services/AuthService');
const { validate, userSchemas } = require('../middleware/validation');
const logger = require('../config/logger');

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error('Register controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'REGISTRATION_FAILED'
      });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.login(email, password, ipAddress, userAgent);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Login controller error:', error);
      res.status(401).json({
        success: false,
        message: error.message,
        code: 'LOGIN_FAILED'
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      const result = await AuthService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Refresh token controller error:', error);
      res.status(401).json({
        success: false,
        message: error.message,
        code: 'TOKEN_REFRESH_FAILED'
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      const result = await AuthService.logout(req.user.id, req.token);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        code: 'LOGOUT_FAILED'
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const user = await AuthService.getUserById(req.user.id);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get profile controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        code: 'GET_PROFILE_FAILED'
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const result = await AuthService.updateProfile(req.user.id, req.body);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result
      });
    } catch (error) {
      logger.error('Update profile controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'UPDATE_PROFILE_FAILED'
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirm password do not match',
          code: 'PASSWORD_MISMATCH'
        });
      }

      await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'CHANGE_PASSWORD_FAILED'
      });
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      const result = await AuthService.verifyEmail(token);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Verify email controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'EMAIL_VERIFICATION_FAILED'
      });
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;
      
      const result = await AuthService.resendVerificationEmail(email);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Resend verification email controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'RESEND_VERIFICATION_FAILED'
      });
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      const result = await AuthService.forgotPassword(email);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Forgot password controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'FORGOT_PASSWORD_FAILED'
      });
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      const result = await AuthService.resetPassword(token, password);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Reset password controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'RESET_PASSWORD_FAILED'
      });
    }
  }

  /**
   * Generate API key
   */
  async generateApiKey(req, res) {
    try {
      const { name, permissions = [] } = req.body;
      
      const result = await AuthService.generateApiKey(req.user.id, name, permissions);
      
      res.json({
        success: true,
        message: 'API key generated successfully',
        data: result
      });
    } catch (error) {
      logger.error('Generate API key controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'GENERATE_API_KEY_FAILED'
      });
    }
  }

  /**
   * Get user's API keys
   */
  async getApiKeys(req, res) {
    try {
      const user = await AuthService.getUserById(req.user.id);
      
      res.json({
        success: true,
        data: user.apiKeys || []
      });
    } catch (error) {
      logger.error('Get API keys controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get API keys',
        code: 'GET_API_KEYS_FAILED'
      });
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(req, res) {
    try {
      const { keyId } = req.params;
      
      const result = await AuthService.revokeApiKey(req.user.id, keyId);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Revoke API key controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'REVOKE_API_KEY_FAILED'
      });
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(req, res) {
    try {
      const { page, limit, sort, order, role, isActive, search } = req.query;
      
      const filters = { role, isActive, search };
      const pagination = { page, limit, sort, order };
      
      const result = await AuthService.getAllUsers(filters, pagination);
      
      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Get all users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        code: 'GET_USERS_FAILED'
      });
    }
  }

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(req, res) {
    try {
      const { userId } = req.params;
      
      const result = await AuthService.deactivateUser(userId);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Deactivate user controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'DEACTIVATE_USER_FAILED'
      });
    }
  }

  /**
   * Activate user (admin only)
   */
  async activateUser(req, res) {
    try {
      const { userId } = req.params;
      
      const result = await AuthService.activateUser(userId);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Activate user controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'ACTIVATE_USER_FAILED'
      });
    }
  }
}

module.exports = new AuthController();
