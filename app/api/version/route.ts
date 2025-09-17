export async function GET() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";
  return new Response(
    JSON.stringify({ version, buildTime }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}

