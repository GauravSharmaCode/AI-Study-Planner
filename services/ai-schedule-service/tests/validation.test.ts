import express from 'express';
import request from 'supertest';
import { validateRequest } from '../src/middleware/validateRequest';
import { CreateStudyPlanSchema } from '../src/schemas';
import globalErrorHandler from '../src/middleware/errorHandler';

describe('Zod Validation Middleware - AI Schedule Service', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Test route
        app.post('/test-validate', validateRequest(CreateStudyPlanSchema), (req, res) => {
            res.status(200).json({ success: true });
        });

        app.use(globalErrorHandler);
    });

    test('should fail validation with missing subjects', async () => {
        const response = await request(app)
            .post('/test-validate')
            .send({
                availableHoursPerDay: 4,
                targetCompletionDate: '2025-09-01',
                userId: 'user-123'
            })
            .expect(400);

        expect(response.body.status).toBe('fail');
        expect(response.body.message).toContain('body.subjects: Required');
    });

    test('should fail validation with invalid date', async () => {
        const response = await request(app)
            .post('/test-validate')
            .send({
                subjects: ['Math'],
                availableHoursPerDay: 4,
                targetCompletionDate: 'invalid-date',
                userId: 'user-123'
            })
            .expect(400);

        expect(response.body.message).toContain('body.targetCompletionDate: Invalid date format');
    });

    test('should pass validation with valid data', async () => {
        await request(app)
            .post('/test-validate')
            .send({
                subjects: ['Math'],
                availableHoursPerDay: 4,
                targetCompletionDate: '2025-09-01',
                userId: 'user-123'
            })
            .expect(200);
    });
});
