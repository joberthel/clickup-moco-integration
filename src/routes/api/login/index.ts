import { FastifyInstance } from 'fastify';
import { validate } from '../../../utils/moco';
import UserService from '../../../services/user';
import WebhookService from '../../../services/webhook';
import { getToken, getUser, createWebhooks } from '../../../utils/clickup';

export default async (server: FastifyInstance) => {
    const userService = new UserService(server);
    const webhookService = new WebhookService(server);

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
                    const webhooks = await createWebhooks(clickupToken);
                    let success = webhooks.length > 0;

                    for (const webhook of webhooks) {
                        success = success && (await webhookService.update(webhook.id, {
                            userid: webhook.userid,
                            team_id: webhook.team_id,
                            secret: webhook.secret
                        })) !== false;
                    }

                    return reply.send({ success, username: user.username });
                }
            }
        }

        return reply.send({ success: false });
    });
};
