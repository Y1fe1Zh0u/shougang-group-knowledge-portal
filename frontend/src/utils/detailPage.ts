export function resolveDetailBackTarget(returnTo: unknown, spaceId: string) {
  return typeof returnTo === 'string' ? returnTo : `/space/${spaceId}`;
}
