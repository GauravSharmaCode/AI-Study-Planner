import { Request, Response, NextFunction } from 'express';

/**
 * A higher-order function that wraps an asynchronous route handler,
 * allowing errors to be automatically passed to the next middleware.
 *
 * @param {Function} fn - An asynchronous function that takes Express
 * request, response, and next function as parameters.
 * @returns {Function} A new function that executes the given async
 * function and catches any errors, passing them to the next middleware.
 */
export const catchAsync = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};
