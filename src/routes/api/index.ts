import { FastifyInstance } from 'fastify';

export default async (server: FastifyInstance) => {
    server.register(import('./login'), { prefix: 'login' });

    server.get('/health', async (request, reply) => {
        return reply.send();
    });
};
