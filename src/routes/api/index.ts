import { FastifyInstance } from 'fastify';

export default async (server: FastifyInstance) => {
    server.register(import('./login'), { prefix: 'login' });
    server.register(import('./webhook'), { prefix: 'webhook' });

    server.get('/health', async (request, reply) => {
        return reply.send();
    });
};
