import path from 'path';
import cron from 'node-cron';
import fastify from 'fastify';
import { syncMissedTimeEntries } from './utils/cron';

export default async () => {
    const server = fastify({
        disableRequestLogging: true,
        logger:
            process.env.NODE_ENV === 'production'
                ? false
                : {
                      prettyPrint: {
                          translateTime: 'SYS:HH:MM:ss.l o',
                          colorize: true
                      },
                      level: 'info'
                  }
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

    cron.schedule('*/5 * * * *', async () => {
        server.log.info('CronJob started!')

        try {
            await syncMissedTimeEntries(server);
        } catch (err) {
            server.log.error('An error during cron job execution occured.', err);
        }

        server.log.info('CronJob finished!')
    });

    return server;
};
