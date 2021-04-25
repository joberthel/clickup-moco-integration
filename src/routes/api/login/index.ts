import { FastifyInstance } from 'fastify';
import UserService from '../../../services/user';

import { validate } from '../../../utils/moco';
import { getToken, getUser } from '../../../utils/clickup';

export default async (server: FastifyInstance) => {
    const userService = new UserService(server);

    server.post('/', async (request, reply) => {
        const { body } = request;
        const { mocoKey, clickupCode } = body as any;

        if (await validate(mocoKey)) {
            const clickupToken = await getToken(clickupCode);
            const clickupUser = await getUser(clickupToken);

            if (clickupUser) {
                const user = await userService.update(clickupUser.id, {
                    username: clickupUser.username,
                    credentials: {
                        mocoKey,
                        clickupToken
                    }
                });

                if (user !== false) {
                    return reply.send({ success: true, username: user.username });
                }
            }
        }

        return reply.send({ success: false });
    });
};
