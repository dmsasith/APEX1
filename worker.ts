import { onRequest, CloudflareEnv } from './functions/api/[[path]]';

export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return onRequest({ request, env });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Static assets binding unavailable.', { status: 500 });
  },
};
