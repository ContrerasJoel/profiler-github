import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * Caché en memoria con TTL, deliberadamente mínima.
 *
 * El objetivo no es escalar sino proteger el rate limit de GitHub (5.000 req/hora con
 * token): perfiles repetidos no vuelven a salir a la red durante el TTL. Para una sola
 * instancia esto sobra; con varias réplicas el reemplazo natural sería Redis, y por eso
 * la interfaz se mantiene pequeña (`get` / `set` / `delete`).
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry>();

  /** Cota de memoria: evita que un scraper llene el proceso con miles de usernames. */
  private static readonly MAX_ENTRIES = 500;

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (this.store.size >= CacheService.MAX_ENTRIES) {
      this.evictOldest();
    }

    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Purga lo ya vencido y, si aún así está lleno, descarta la entrada más antigua. */
  private evictOldest(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }

    if (this.store.size >= CacheService.MAX_ENTRIES) {
      const oldest = this.store.keys().next();
      if (!oldest.done) {
        this.store.delete(oldest.value);
        this.logger.debug(`Caché llena: se descartó "${oldest.value}".`);
      }
    }
  }
}
