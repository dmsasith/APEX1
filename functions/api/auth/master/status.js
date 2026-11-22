export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      configured: true,
      source: 'env',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}

export async function onRequest(context) {
  if (context.request.method.toUpperCase() === 'GET') {
    return onRequestGet();
  }
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
