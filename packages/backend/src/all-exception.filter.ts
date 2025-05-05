import { Catch, ArgumentsHost } from '@nestjs/common';
import { AbstractHttpAdapter, BaseExceptionFilter } from '@nestjs/core';
import { APIError } from 'openai';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly httpAdapter: AbstractHttpAdapter;
  constructor(httpAdapter: AbstractHttpAdapter) {
    super();
    this.httpAdapter = httpAdapter;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const isOpenAIException = exception instanceof APIError;

    if (isOpenAIException) {
      const httpStatus = exception.status;
      const responseBody = {
        statusCode: httpStatus,
        message: exception.message,
        error: exception.error,
      };
      return this.httpAdapter.reply(
        ctx.getResponse(),
        responseBody,
        httpStatus,
      );
    }
    super.catch(exception, host);
  }
}
