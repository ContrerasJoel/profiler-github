import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { usernameSchema } from './schemas/username.schema';
import type { ProfileResponse } from './schemas/profile.schema';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':username')
  @ApiOperation({
    summary: 'Perfil de GitHub agregado',
    description:
      'Consulta la API pública de GitHub y devuelve el perfil junto con métricas ya calculadas ' +
      '(estrellas totales, distribución de lenguajes, top de repositorios y repos creados por año), ' +
      'listas para renderizar sin post-procesado en el cliente.',
  })
  @ApiParam({
    name: 'username',
    example: 'ContrerasJoel',
    description: 'Username de GitHub. Se valida con la misma regla que usa GitHub.',
  })
  @ApiResponse({ status: 200, description: 'Perfil agregado correctamente.' })
  @ApiResponse({ status: 400, description: 'El username no cumple el formato de GitHub.' })
  @ApiResponse({ status: 404, description: 'El usuario no existe en GitHub.' })
  @ApiResponse({ status: 429, description: 'Rate limit agotado (propio o de GitHub).' })
  @ApiResponse({ status: 503, description: 'La API de GitHub no está disponible.' })
  getProfile(
    @Param('username', new ZodValidationPipe(usernameSchema)) username: string,
  ): Promise<ProfileResponse> {
    return this.userService.getProfile(username);
  }
}
