// Simple test API endpoint
export async function GET() {
  return Response.json({
    success: true,
    message: "WorkerGigBD API is working!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
}
