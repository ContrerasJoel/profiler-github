import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

/**
 * Pipe genérico para validar cualquier entrada con un esquema de Zod.
 *
 * Se instancia con el esquema concreto en el punto de uso, p. ej.:
 *   `@Param('username', new ZodValidationPipe(usernameSchema)) username: string`
 *
 * Devuelve el dato ya parseado (con `trim` y transformaciones aplicadas), así que el
 * controlador trabaja siempre con un valor limpio y tipado.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: result.error.issues.map((issue) => issue.message),
        error: 'Bad Request',
      });
    }

    return result.data;
  }
}
