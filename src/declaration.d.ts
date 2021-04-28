import { Db } from 'mongodb';
import { PrettyOptions } from 'pino-pretty';

declare module 'fastify' {
    interface FastifyInstance {
        db: Db;
    }

    interface FastifyLoggerInstance extends PrettyOptions {}
}
