import { Db } from 'mongodb';

declare module 'fastify' {
    interface FastifyInstance {
        db: Db;
    }
}
