export function apiQueryKey(path: string, auth = true) {
  const [pathname, ...rest] = path.split('?');
  const search = rest.join('?') || '';
  return ['api', pathname, search, auth] as const;
}

export function apiResourceKey(pathname: string) {
  return ['api', pathname] as const;
}

export function apiListKey(
  endpoint: string,
  params: Record<string, unknown>,
  auth = true,
) {
  const [pathname] = endpoint.split('?');
  return ['api', pathname, 'list', params, auth] as const;
}
