import type { FastifyRequest } from 'fastify';

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export function requestContext(req: FastifyRequest): RequestContext {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };
}
