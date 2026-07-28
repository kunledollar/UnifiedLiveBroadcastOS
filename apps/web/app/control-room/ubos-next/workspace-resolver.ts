import { workspaceById } from './metadata';

/** Safely resolves optional router state during static prerendering. */
export function resolvePrototypeWorkspace(pathname: string | null) {
  const candidate = pathname?.split('/').filter(Boolean).at(-1);
  return candidate && candidate in workspaceById
    ? workspaceById[candidate as keyof typeof workspaceById]
    : workspaceById.director;
}
