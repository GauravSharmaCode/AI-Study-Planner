import sessionRoutes from '../sessionRoutes';
import { protect } from '../../middleware/auth';

describe('Session Routes', () => {
    it('should have the protect middleware applied', () => {
        // Find the middleware in the router stack
        // Express router stack items have a handle property which is the middleware function
        const protectMiddleware = sessionRoutes.stack.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (layer: any) => layer.name === 'protect' || layer.handle === protect
        );

        expect(protectMiddleware).toBeDefined();
        // Also verify it applies to all routes (no path restriction for use)
        expect(protectMiddleware?.regexp.toString()).toContain('^\\/?(?=\\/|$)');
    });
});
