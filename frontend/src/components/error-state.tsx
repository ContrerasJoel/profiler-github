'use client';

import { Clock, RotateCw, ServerCrash, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileError } from '@/store/profile-store';

/**
 * Un único "algo salió mal" no ayuda a nadie. Cada causa lleva a una acción distinta:
 * el usuario no existe (corregir el nombre), se agotó el rate limit (esperar) o el
 * backend no responde (reintentar).
 */
export function ErrorState({
  error,
  username,
  onRetry,
}: {
  error: ProfileError;
  username: string;
  onRetry: () => void;
}) {
  const { icon, title, canRetry } = describe(error.status);

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="text-muted-foreground/60">{icon}</div>

        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{error.message}</p>
        </div>

        {canRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            <RotateCw className="size-4" aria-hidden />
            Reintentar
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Revisá que <span className="font-medium">{username}</span> sea el nombre exacto
            del usuario en GitHub.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function describe(status: number): { icon: React.ReactNode; title: string; canRetry: boolean } {
  if (status === 404) {
    return {
      icon: <UserX className="size-8" aria-hidden />,
      title: 'Usuario no encontrado',
      canRetry: false,
    };
  }

  if (status === 429) {
    return {
      icon: <Clock className="size-8" aria-hidden />,
      title: 'Demasiadas peticiones',
      canRetry: true,
    };
  }

  return {
    icon: <ServerCrash className="size-8" aria-hidden />,
    title: 'No pudimos cargar el perfil',
    canRetry: true,
  };
}
