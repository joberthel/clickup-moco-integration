import { FastifyInstance } from 'fastify';
import { CLICKUP_ID, HOST } from '../../environment';

export default async (server: FastifyInstance) => {
    server.get('/', async (request, reply) => {
        return reply.redirect(`https://app.clickup.com/api?client_id=${CLICKUP_ID}&redirect_uri=${HOST}/login/callback`);
    });

    server.get('/callback', async (request, reply) => {
        return reply.sendFile('callback.html');
    });
};
