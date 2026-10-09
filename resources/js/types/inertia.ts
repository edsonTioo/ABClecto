import { router } from '@inertiajs/react';

/**
 * Payload que Inertia acepta en `router.post/put` (derivado de su firma real,
 * para no depender de tipos internos que @inertiajs/react no re-exporta).
 */
export type InertiaPayload = NonNullable<Parameters<typeof router.post>[1]>;

/** Valor aceptado dentro de un campo de ese payload. */
export type InertiaValue = Exclude<InertiaPayload, FormData> extends Record<string, infer V> ? V : never;
