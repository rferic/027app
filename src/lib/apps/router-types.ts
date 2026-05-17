export interface HandlerContext {
  groupId: string
  groupSlug: string
}

export type RouteHandler = (req: Request, ctx: HandlerContext) => Promise<Response> | Response
