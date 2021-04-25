import EventEmitter from 'events';
import { FastifyInstance } from 'fastify';
import UserService from '../../../services/user';
import WebhookService from '../../../services/webhook';
import { ClickupUser, getTimeEntry } from '../../../utils/clickup';

export interface TaskTimeTrackedUpdated {
    event: 'taskTimeTrackedUpdated';
    history_items?: TaskTimeTrackedUpdatedHistoryItems[];
    task_id: string;
    webhook_id: string;
}

export interface TaskTimeTrackedUpdatedHistoryItems {
    id: string;
    field: string;
    user: ClickupUser;
    after: {
        id: string;
    };
}

export default async (server: FastifyInstance) => {
    const userService = new UserService(server);
    const webhookService = new WebhookService(server);

    const eventEmitter = new EventEmitter();
    eventEmitter.on('taskTimeTrackedUpdated', async (body: TaskTimeTrackedUpdated) => {
        if (typeof body.history_items !== 'undefined') {
            const webhook = await webhookService.getOne(body.webhook_id);

            if (webhook !== false) {
                for (const historyItem of body.history_items) {
                    const user = await userService.getOne(historyItem.user.id);

                    if (user !== false) {
                        const timeEntry = await getTimeEntry(user.credentials.clickupToken, webhook.team_id, historyItem.after.id);

                        if (timeEntry !== false) {
                            // TODO: store time entry in moco, if not already in mongodb
                            // TODO: store time entry id in mongodb
                        }
                    }
                }
            }
        }
    });

    server.post('/track', async (request, reply) => {
        const { body } = request as any;
        eventEmitter.emit(body.event, body);

        return reply.send();
    });
};
