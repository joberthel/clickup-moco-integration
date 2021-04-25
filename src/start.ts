import app from './app';
import { PORT } from './environment';

app().then(server => {
    server.listen(PORT, '0.0.0.0', (err, address) => {
        if (err) {
            server.log.error(err);
            process.exit(1);
        }

        server.log.info(`server listening on ${address}`);

        process.on('SIGINT', () => server.close());
        process.on('SIGTERM', () => server.close());
    });
});
