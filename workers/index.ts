// Cloudflare Worker for Nexus-AI

export interface Env {
  OPENAI_API_KEY: string;
  HUGGINGFACE_API_KEY: string;
  KV: KVNamespace;
  D1: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    if (path === '/api/health') {
      return handleHealthCheck();
    }

    if (path === '/api/generate' && request.method === 'POST') {
      return handleGenerate(request, env);
    }

    if (path === '/api/embed' && request.method === 'POST') {
      return handleEmbed(request, env);
    }

    if (path === '/api/cache' && request.method === 'GET') {
      return handleGetCache(url, env);
    }

    if (path === '/api/cache' && request.method === 'POST') {
      return handleSetCache(request, env);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  },
};

async function handleHealthCheck(): Promise<Response> {
  return Response.json({ status: 'healthy', timestamp: new Date().toISOString() });
}

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  try {
    const { prompt, model = 'gpt-4' } = await request.json();

    // Simulate text generation
    const response = {
      text: `Generated response for: ${prompt}`,
      model,
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: 'Failed to generate text' }, { status: 500 });
  }
}

async function handleEmbed(request: Request, env: Env): Promise<Response> {
  try {
    const { text } = await request.json();

    // Simulate embedding generation
    const embedding = new Array(1536).fill(0).map(() => Math.random());

    const response = {
      embedding,
      dimensions: embedding.length,
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}

async function handleGetCache(url: URL, env: Env): Promise<Response> {
  const key = url.searchParams.get('key');
  if (!key) {
    return Response.json({ error: 'Key required' }, { status: 400 });
  }

  const value = await env.KV.get(key);
  return Response.json({ key, value });
}

async function handleSetCache(request: Request, env: Env): Promise<Response> {
  try {
    const { key, value, ttl } = await request.json();

    if (ttl) {
      await env.KV.put(key, value, { expirationTtl: ttl });
    } else {
      await env.KV.put(key, value);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to set cache' }, { status: 500 });
  }
}
