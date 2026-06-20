import { Request, Response, NextFunction } from 'express';
import { createResponse } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err);

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json(
    createResponse(false, message, undefined, process.env.NODE_ENV === 'development' ? err : undefined)
  );
};
