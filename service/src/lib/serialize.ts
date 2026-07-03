export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      out[snake] = toSnakeCase(v as Record<string, unknown>);
    } else {
      out[snake] = v instanceof Date ? v.toISOString() : v;
    }
  }
  return out;
}

export function rowsToSnake<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map((r) => toSnakeCase(r));
}

export function rowToSnake<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  return toSnakeCase(row);
}

export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
