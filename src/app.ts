import path from 'path';
import fastify from 'fastify';

export default async () => {
    const server = fastify({
        logger: { prettyPrint: true }
    });

    // plugins
    await server.register(import('./plugins/mongo-db'));
    await server.register(import('fastify-static'), {
        root: path.join(__dirname, '..', 'public'),
        serve: false
    });

    // routes
    await server.register(import('./routes/api'), { prefix: 'api' });
    await server.register(import('./routes/login'), { prefix: 'login' });

    return server;
};
