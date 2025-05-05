import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { z } from 'zod';

export class DataProcessingException extends HttpException {
  constructor() {
    super(
      'An error occurred while processing the data',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export const handleDBValidationError = (
  error: unknown,
  logger: Logger,
  message: string,
  params?: Record<string, any>,
) => {
  if (error instanceof z.ZodError) {
    // Log the detailed error for internal debugging
    logger.error(message, {
      ...(params ?? {}),
      errors: error.errors,
      stack: error.stack,
    });
  } else if (error instanceof Error) {
    logger.error(message, {
      ...(params ?? {}),
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.error(message, {
      ...(params ?? {}),
      error,
    });
  }

  // Throw generic error
  throw new DataProcessingException();
};
