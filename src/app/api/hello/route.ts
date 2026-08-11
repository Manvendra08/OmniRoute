/**
 * GET / HEAD / OPTIONS /api/hello
 * Health check endpoint for Claude Code CLI and third-party gateway probes.
 */

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET() {
  return Response.json(
    { status: "ok", message: "OmniRoute gateway ready" },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
