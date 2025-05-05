import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, z } from 'zod';

export class ZodValidationPipe<T extends ZodSchema>
  implements PipeTransform<unknown, z.infer<T>>
{
  constructor(private schema: T) {}

  transform(value: unknown, metadata: ArgumentMetadata): z.infer<T> {
    const parsedValue = this.schema.safeParse(value);
    if (parsedValue.success) {
      return parsedValue.data;
    }
    throw new BadRequestException({ error: parsedValue.error, metadata });
  }
}
