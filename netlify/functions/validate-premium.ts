export default async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = await req.json();
    const { code } = body || {};

    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "CODE_REQUIRED" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ TEMPORAL (por ahora): lista blanca mínima
    // En el siguiente paso la conectamos con Hotmart para que sea automática.
    const ALLOWED_CODES = [
  "NOR-TEST-2025"
];


    const ok = ALLOWED_CODES.includes(code.trim());

    return new Response(JSON.stringify({ ok }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "SERVER_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
