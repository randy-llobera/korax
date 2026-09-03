import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { pingMock, redisFromEnvMock } = vi.hoisted(() => ({
  pingMock: vi.fn(),
  redisFromEnvMock: vi.fn(),
}));

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: redisFromEnvMock,
  },
}));

import { GET } from '@/app/api/cron/redis-keepalive/route';

const createRequest = (authorization?: string) =>
  new Request('http://localhost/api/cron/redis-keepalive', {
    headers: authorization ? { authorization } : undefined,
  });

describe('redis keepalive cron route', () => {
  beforeEach(() => {
    pingMock.mockReset();
    redisFromEnvMock.mockReset();
    redisFromEnvMock.mockReturnValue({ ping: pingMock });
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects requests without authorization', async () => {
    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized.' });
    expect(redisFromEnvMock).not.toHaveBeenCalled();
  });

  it('rejects requests with invalid authorization', async () => {
    const response = await GET(createRequest('Bearer wrong-secret'));

    expect(response.status).toBe(401);
    expect(redisFromEnvMock).not.toHaveBeenCalled();
  });

  it('fails closed when CRON_SECRET is not configured', async () => {
    vi.stubEnv('CRON_SECRET', undefined);

    const response = await GET(createRequest('Bearer undefined'));

    expect(response.status).toBe(401);
    expect(redisFromEnvMock).not.toHaveBeenCalled();
  });

  it('returns success when Redis responds with PONG', async () => {
    pingMock.mockResolvedValue('PONG');

    const response = await GET(createRequest('Bearer test-cron-secret'));

    expect(redisFromEnvMock).toHaveBeenCalledOnce();
    expect(pingMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('returns an error for an unexpected Redis response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    pingMock.mockResolvedValue('unexpected');

    const response = await GET(createRequest('Bearer test-cron-secret'));

    expect(pingMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ success: false });
  });

  it('returns an error when Redis ping fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    pingMock.mockRejectedValue(new Error('Redis unavailable'));

    const response = await GET(createRequest('Bearer test-cron-secret'));

    expect(pingMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ success: false });
  });
});
