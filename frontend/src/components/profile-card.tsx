import Image from 'next/image';
import {
  Building2,
  CalendarDays,
  ExternalLink,
  Link as LinkIcon,
  Mail,
  MapPin,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatMonthYear } from '@/lib/format';
import type { Profile } from '@/lib/schemas';

export function ProfileCard({ profile }: { profile: Profile }) {
  const details = [
    profile.company && { icon: <Building2 className="size-4" aria-hidden />, text: profile.company },
    profile.location && { icon: <MapPin className="size-4" aria-hidden />, text: profile.location },
    profile.email && { icon: <Mail className="size-4" aria-hidden />, text: profile.email },
    profile.blog && {
      icon: <LinkIcon className="size-4" aria-hidden />,
      text: profile.blog,
      href: normalizeUrl(profile.blog),
    },
    {
      icon: <CalendarDays className="size-4" aria-hidden />,
      text: `En GitHub desde ${formatMonthYear(profile.createdAt)}`,
    },
  ].filter(Boolean) as { icon: ReactNode; text: string; href?: string }[];

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Image
          src={profile.avatarUrl}
          alt=""
          width={112}
          height={112}
          priority
          className="size-24 shrink-0 rounded-full ring-1 ring-border sm:size-28"
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold tracking-tight">
                {profile.name ?? profile.login}
              </h2>
              <p className="text-muted-foreground">@{profile.login}</p>
            </div>

            <div className="flex items-center gap-2">
              {profile.type !== 'User' ? <Badge variant="secondary">{profile.type}</Badge> : null}
              {profile.hireable ? <Badge>Disponible para trabajar</Badge> : null}
            </div>
          </div>

          {profile.bio ? <p className="text-pretty text-sm">{profile.bio}</p> : null}

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {details.map((detail) => (
              <li key={detail.text} className="flex min-w-0 items-center gap-1.5">
                {detail.icon}
                {detail.href ? (
                  <a
                    href={detail.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {detail.text}
                  </a>
                ) : (
                  <span className="truncate">{detail.text}</span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              // El botón se renderiza como enlace: hay que avisar a Base UI para que no
              // aplique la semántica nativa de <button>.
              nativeButton={false}
              render={<a href={profile.htmlUrl} target="_blank" rel="noopener noreferrer" />}
            >
              Ver en GitHub
              <ExternalLink className="size-3.5" aria-hidden />
            </Button>

            {profile.twitterUsername ? (
              <Button
                size="sm"
                variant="ghost"
                nativeButton={false}
                render={
                  <a
                    href={`https://x.com/${profile.twitterUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                @{profile.twitterUsername}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** GitHub deja guardar el blog sin esquema ("midominio.com"), que como href sería relativo. */
function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
