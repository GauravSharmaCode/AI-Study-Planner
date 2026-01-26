import express from 'express';
import request from 'supertest';
import { validateRequest } from '../src/middleware/validateRequest';
import { CreateUserRequestSchema } from '../src/schemas';
import globalErrorHandler from '../src/middleware/errorHandler';

describe('Zod Validation Middleware - User Service', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Test route
        app.post('/test-validate', validateRequest(CreateUserRequestSchema), (req, res) => {
            res.status(200).json({ success: true });
        });

        app.use(globalErrorHandler);
    });

    test('should fail validation with empty body', async () => {
        const response = await request(app)
            .post('/test-validate')
            .send({})
            .expect(400);

        expect(response.body.status).toBe('fail');
        expect(response.body.message).toContain('body.email: Required');
    });

    test('should fail validation with invalid email', async () => {
        const response = await request(app)
            .post('/test-validate')
            .send({
                email: 'invalid-email',
                name: 'John Doe',
                password: 'Password123'
            })
            .expect(400);

        expect(response.body.message).toContain('body.email: Invalid email address');
    });

    test('should pass validation with valid data', async () => {
        await request(app)
            .post('/test-validate')
            .send({
                email: 'john@example.com',
                name: 'John Doe',
                password: 'Password123'
            })
            .expect(200);
    });
});
