/**
 * Adapts a handler to a Next.js App Router route export.
 */
import { serverDeps } from "./deps";
import { run, type Handler } from "./http";

interface RouteOptions {
  /** Applies the same-origin write checks (all non-GET methods). */
  write: boolean;
  name: string;
}

export function route(handler: Handler, opts: RouteOptions) {
  return async (request: Request, ctx: { params: Promise<Record<string, string>> }): Promise<Response> =>
    run(handler, request, (await ctx?.params) ?? {}, serverDeps(), { write: opts.write, route: opts.name });
}
