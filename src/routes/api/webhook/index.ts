import EventEmitter from 'events';
import { FastifyInstance } from 'fastify';
import UserService from '../../../services/user';
import { trackClickupTask } from '../../../utils/moco';
import WebhookService from '../../../services/webhook';
import { ClickupUser, getTimeEntry, getTask } from '../../../utils/clickup';

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
        if (typeof body.history_items === 'undefined') {
            server.log.warn(`Skipping because of empty history items!`, body);
            return;
        };

        const webhook = await webhookService.getOne(body.webhook_id);
        if (webhook === false) {
            server.log.warn(`Webhook with id ${body.webhook_id} not found!`, body);
            return;
        };

        for (const historyItem of body.history_items) {
            if (historyItem.user.id != webhook.userid) {
                server.log.warn(`Skipping because user is not the same as webhook user!`, body);
                continue;
            };

            const user = await userService.getOne(historyItem.user.id);
            if (user === false) continue;

            server.log.info(`Received time tracking from ${user.username}`);

            const timeEntry = await getTimeEntry(user.credentials.clickupToken, webhook.team_id, historyItem.after.id);
            if (timeEntry === false) continue;

            server.log.info(`Time tracking details were found in ClickUp.`);

            const task = await getTask(user.credentials.clickupToken, timeEntry.task.id);
            if (task === false) continue;

            server.log.info(`Starting time tracking in MOCO.`);

            try {
                await trackClickupTask(user.credentials.mocoKey, task, timeEntry, server.log);
            } catch (error) {
                console.error(error);
                server.log.error(`There was an error tracking the time for task ${task.custom_id || task.id} (${user.username}).`);
            }
        }
    });

    server.post('/track', async (request, reply) => {
        const { body } = request as any;
        eventEmitter.emit(body.event, body);

        return reply.send();
    });
};
