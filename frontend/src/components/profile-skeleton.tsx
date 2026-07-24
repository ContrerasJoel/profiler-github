import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * El esqueleto replica la retícula real para que la página no salte cuando llegan los
 * datos: mismas alturas, mismo número de columnas.
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Skeleton className="size-24 shrink-0 rounded-full sm:size-28" />

          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index}>
            <CardContent className="space-y-2 px-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-14" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
