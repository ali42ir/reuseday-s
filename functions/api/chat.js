// functions/api/chat.js  (Cloudflare Pages Function)

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { prompt } = await request.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = env.GEMINI_API_KEY; // از Settings → Variables ست شده
    const url =
      https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey};

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }]}],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer.';

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
