/**
 * Error Handling Examples
 * This file demonstrates how to use the comprehensive error handling system
 */

const {
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    ExternalServiceError,
    DatabaseError,
    BusinessLogicError,
    asyncHandler
} = require('../utils/errors');

const { wrapAsync, wrapController, serviceWrapper } = require('../utils/asyncWrapper');

/**
 * Example Controller with Error Handling
 */
class ExampleController {

    /**
     * Example: Using asyncHandler wrapper
     */
    async getExample(req, res) {
        // This will automatically catch any errors and pass them to the global error handler
        const { id } = req.params;

        if (!id) {
            throw new ValidationError('ID is required', [], 'MISSING_ID');
        }

        if (id === 'invalid') {
            throw new NotFoundError('Example not found', 'EXAMPLE_NOT_FOUND');
        }

        // Simulate some async operation
        const result = await this.simulateAsyncOperation(id);

        res.json({
            success: true,
            data: result
        });
    }

    /**
     * Example: Using wrapAsync wrapper
     */
    getExampleWrapped = wrapAsync(async (req, res) => {
        const { id } = req.params;

        if (!id) {
            throw new ValidationError('ID is required');
        }

        const result = await this.simulateAsyncOperation(id);

        res.json({
            success: true,
            data: result
        });
    });

    /**
     * Example: Business logic error
     */
    async processOrder(req, res) {
        const { orderId, action } = req.body;

        if (!orderId) {
            throw new ValidationError('Order ID is required');
        }

        if (action === 'cancel') {
            // Check if order can be cancelled
            const order = await this.getOrder(orderId);

            if (!order) {
                throw new NotFoundError('Order not found');
            }

            if (order.status === 'shipped') {
                throw new BusinessLogicError('Cannot cancel shipped order', 'ORDER_ALREADY_SHIPPED');
            }

            if (order.status === 'cancelled') {
                throw new ConflictError('Order already cancelled', 'ORDER_ALREADY_CANCELLED');
            }
        }

        res.json({
            success: true,
            message: 'Order processed successfully'
        });
    }

    /**
     * Example: External service error
     */
    async callExternalAPI(req, res) {
        try {
            const response = await this.simulateExternalAPICall();
            res.json({
                success: true,
                data: response
            });
        } catch (error) {
            // Wrap external service error
            throw new ExternalServiceError('Payment Gateway', error.message, 'PAYMENT_SERVICE_ERROR');
        }
    }

    /**
     * Example: Database error
     */
    async createUser(req, res) {
        const { email, password } = req.body;

        try {
            const user = await this.simulateDatabaseOperation({ email, password });
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictError('Email already exists', 'EMAIL_ALREADY_EXISTS');
            }
            throw new DatabaseError('Failed to create user', 'USER_CREATION_FAILED');
        }
    }

    /**
     * Example: Rate limiting
     */
    async login(req, res) {
        const { email, password } = req.body;

        // Simulate rate limiting check
        const attempts = await this.getLoginAttempts(req.ip);

        if (attempts > 5) {
            throw new RateLimitError('Too many login attempts', 900, 'LOGIN_RATE_LIMIT');
        }

        // Simulate authentication
        const user = await this.authenticateUser(email, password);

        if (!user) {
            await this.incrementLoginAttempts(req.ip);
            throw new AuthenticationError('Invalid credentials', 'INVALID_CREDENTIALS');
        }

        res.json({
            success: true,
            data: { user, token: 'jwt-token' }
        });
    }

    /**
     * Example: Authorization error
     */
    async adminOnlyAction(req, res) {
        const user = req.user;

        if (!user) {
            throw new AuthenticationError('Authentication required');
        }

        if (user.role !== 'admin') {
            throw new AuthorizationError('Admin access required', 'ADMIN_REQUIRED');
        }

        res.json({
            success: true,
            message: 'Admin action completed'
        });
    }

    /**
     * Example: Validation with detailed errors
     */
    async validateUser(req, res) {
        const { email, password, age } = req.body;
        const errors = [];

        if (!email) {
            errors.push({
                field: 'email',
                message: 'Email is required',
                value: email
            });
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.push({
                field: 'email',
                message: 'Invalid email format',
                value: email
            });
        }

        if (!password) {
            errors.push({
                field: 'password',
                message: 'Password is required',
                value: password
            });
        } else if (password.length < 6) {
            errors.push({
                field: 'password',
                message: 'Password must be at least 6 characters',
                value: password
            });
        }

        if (age !== undefined && (age < 0 || age > 150)) {
            errors.push({
                field: 'age',
                message: 'Age must be between 0 and 150',
                value: age
            });
        }

        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors, 'USER_VALIDATION_FAILED');
        }

        res.json({
            success: true,
            message: 'Validation passed'
        });
    }

    // Helper methods (simulated)
    async simulateAsyncOperation(id) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ id, name: 'Example Item', createdAt: new Date() });
            }, 100);
        });
    }

    async getOrder(orderId) {
        // Simulate database lookup
        return { id: orderId, status: 'pending' };
    }

    async simulateExternalAPICall() {
        // Simulate external API call that might fail
        if (Math.random() > 0.5) {
            throw new Error('External service unavailable');
        }
        return { status: 'success', data: 'External data' };
    }

    async simulateDatabaseOperation(data) {
        // Simulate database operation that might fail
        if (data.email === 'existing@example.com') {
            const error = new Error('Duplicate key');
            error.code = 11000;
            throw error;
        }
        return { id: 1, ...data, createdAt: new Date() };
    }

    async getLoginAttempts(ip) {
        // Simulate rate limiting check
        return Math.floor(Math.random() * 10);
    }

    async incrementLoginAttempts(ip) {
        // Simulate incrementing login attempts
        return true;
    }

    async authenticateUser(email, password) {
        // Simulate authentication
        if (email === 'user@example.com' && password === 'password') {
            return { id: 1, email, role: 'user' };
        }
        return null;
    }
}

// Create controller instance
const exampleController = new ExampleController();

// Wrap the entire controller
const wrappedController = wrapController(exampleController);

// Example routes using the wrapped controller
const express = require('express');
const router = express.Router();

// Using asyncHandler wrapper
router.get('/example/:id', asyncHandler(exampleController.getExample.bind(exampleController)));

// Using wrapAsync wrapper
router.get('/example-wrapped/:id', exampleController.getExampleWrapped);

// Using wrapped controller
router.post('/process-order', wrappedController.processOrder);
router.post('/call-external', wrappedController.callExternalAPI);
router.post('/create-user', wrappedController.createUser);
router.post('/login', wrappedController.login);
router.get('/admin-action', wrappedController.adminOnlyAction);
router.post('/validate-user', wrappedController.validateUser);

module.exports = {
    ExampleController,
    exampleController,
    wrappedController,
    router
};

/**
 * Usage Examples:
 * 
 * 1. Basic error handling:
 *    GET /example/123 - Success
 *    GET /example/invalid - 404 Not Found
 *    GET /example - 400 Validation Error
 * 
 * 2. Business logic errors:
 *    POST /process-order { orderId: "123", action: "cancel" } - Success
 *    POST /process-order { orderId: "456", action: "cancel" } - 422 Business Logic Error
 * 
 * 3. External service errors:
 *    POST /call-external - 502 External Service Error (50% chance)
 * 
 * 4. Database errors:
 *    POST /create-user { email: "existing@example.com", password: "123456" } - 409 Conflict
 * 
 * 5. Rate limiting:
 *    POST /login { email: "user@example.com", password: "wrong" } - 429 Rate Limit (after 5 attempts)
 * 
 * 6. Authorization:
 *    GET /admin-action - 403 Forbidden (if not admin)
 * 
 * 7. Validation:
 *    POST /validate-user { email: "invalid", password: "123" } - 400 Validation Error with details
 */
