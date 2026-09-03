import { Redis } from '@upstash/redis';

export const GET = async (request: Request) => {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const redis = Redis.fromEnv();
    const response = await redis.ping();

    if (response !== 'PONG') {
      console.error('Redis keepalive returned an unexpected response.');
      return Response.json({ success: false }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Redis keepalive failed.', error);
    return Response.json({ success: false }, { status: 500 });
  }
};
