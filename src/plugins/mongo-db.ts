import fp from 'fastify-plugin';
import { MongoClient } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE } from '../environment';

export default fp(async (server: FastifyInstance, opts: unknown, done: Function) => {
    const client = new MongoClient(`mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}`);
    await client.connect();

    server.decorate('db', client.db(MONGODB_DATABASE));

    server.addHook('onClose', async () => {
        await client.close();
    });

    done();
});
