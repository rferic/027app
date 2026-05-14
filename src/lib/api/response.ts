export function apiOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status })
}

export function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>
): Response {
  return Response.json(
    { error: code, message, ...(fields ? { fields } : {}) },
    { status }
  )
}

export function apiList<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number,
  baseUrl: string
): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const links: string[] = []
  const totalPages = Math.ceil(total / perPage)

  if (page > 1) links.push(`<${baseUrl}?page=${page - 1}>; rel="prev"`)
  if (page < totalPages) links.push(`<${baseUrl}?page=${page + 1}>; rel="next"`)
  if (links.length > 0) headers.set('Link', links.join(', '))

  return new Response(JSON.stringify(items), { status: 200, headers })
}
