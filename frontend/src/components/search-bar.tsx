'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usernameSchema } from '@/lib/schemas';
import { useProfileStore } from '@/store/profile-store';

/**
 * Perfiles con bastante actividad. El reto pide mostrar el perfil propio —y es el que
 * carga por defecto—, pero una cuenta pequeña deja los gráficos casi vacíos, así que
 * damos un atajo para ver la app con datos densos.
 */
const EXAMPLES = ['torvalds', 'gaearon', 'sindresorhus'];

export function SearchBar() {
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadProfile = useProfileStore((state) => state.loadProfile);
  const status = useProfileStore((state) => state.status);
  const history = useProfileStore((state) => state.history);
  const currentUsername = useProfileStore((state) => state.username);

  const isLoading = status === 'loading';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validamos en el cliente con la misma regla que el backend: el error se ve al
    // instante y nos ahorramos un viaje de red que sabemos que va a fallar.
    const result = usernameSchema.safeParse(value);

    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }

    setValidationError(null);
    void loadProfile(result.data);
  }

  function handleShortcut(username: string) {
    setValue(username);
    setValidationError(null);
    void loadProfile(username);
  }

  const shortcuts = [...history, ...EXAMPLES.filter((name) => !includesName(history, name))].slice(
    0,
    6,
  );

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Buscá un usuario de GitHub…"
            aria-label="Usuario de GitHub"
            aria-invalid={validationError !== null}
            aria-describedby={validationError ? 'search-error' : undefined}
            autoComplete="off"
            spellCheck={false}
            className="h-11 pl-9"
          />
        </div>

        <Button type="submit" size="lg" className="h-11" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Search className="size-4" aria-hidden />
          )}
          <span className="hidden sm:inline">Buscar</span>
        </Button>
      </form>

      {validationError ? (
        <p id="search-error" role="alert" className="text-sm text-destructive">
          {validationError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Probá con:</span>
        {shortcuts.map((username) => (
          <Button
            key={username}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-full px-3 text-xs font-normal"
            disabled={isLoading}
            aria-current={username.toLowerCase() === currentUsername.toLowerCase()}
            onClick={() => handleShortcut(username)}
          >
            {username}
          </Button>
        ))}
      </div>
    </div>
  );
}

function includesName(list: string[], name: string): boolean {
  return list.some((entry) => entry.toLowerCase() === name.toLowerCase());
}
