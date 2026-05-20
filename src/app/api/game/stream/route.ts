import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const redis = Redis.fromEnv();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get('roomId');
  
  if (!roomId) {
    return new Response('Missing roomId', { status: 400 });
  }

  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  };

  const stream = new ReadableStream({
    async start(controller) {
      const channel = `room-events:${roomId}`;
      
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
          console.error('Error sending event', e);
        }
      };

      // Send initial connection success event
      sendEvent({ type: 'connected', roomId });

      try {
        // Create an HTTP streaming connection to Upstash Redis for subscribe
        // Because @upstash/redis REST client does not support native subscribe (which blocks),
        // We have to use something else or use Upstash's subscribe endpoint if they have one.
        // Wait, @upstash/redis doesn't natively support long-lived Pub/Sub via the standard client methods because it's REST.
        // BUT we can use standard fetch with Upstash if they support it, or we use a hack.
      } catch (err) {
        console.error('Stream error:', err);
        controller.close();
      }
    },
    cancel() {
      console.log('Stream canceled by client');
    }
  });

  return new Response(stream, { headers });
}
