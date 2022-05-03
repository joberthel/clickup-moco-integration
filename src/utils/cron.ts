import { FastifyInstance } from 'fastify';
import { trackClickupTask } from './moco';
import UserService from '../services/user';
import WebhookService from '../services/webhook';
import TimeEntryService from '../services/time-entry';
import { getTask, getTimeEntries, getToken } from './clickup';

export async function syncMissedTimeEntries(server: FastifyInstance) {
    const userService = new UserService(server);
    const webhookService = new WebhookService(server);
    const timeEntryService = new TimeEntryService(server);

    const webhooks = await webhookService.getAll();

    for (const webhook of webhooks) {
        const user = await userService.getOne(webhook.userid);

        if (user !== false) {
            server.log.info(`[CRON] Checking entries for ${user.username}`);

            const timeEntries = await getTimeEntries(user.credentials.clickupToken, webhook.team_id);

            for (const timeEntry of timeEntries) {
                if ((await timeEntryService.getOne(timeEntry.id)) !== false) {
                    continue; // already tracked
                }

                await timeEntryService.create({ _id: timeEntry.id });

                const task = await getTask(user.credentials.clickupToken, timeEntry.task.id);
                if (task === false) {
                    continue; // task not found
                }

                server.log.info(`[CRON] Starting time tracking in MOCO for ${user.username}.`);

                try {
                    await trackClickupTask(user.credentials.mocoKey, task, timeEntry, server.log);
                } catch (error) {
                    console.error(error);
                    server.log.error(`There was an error tracking the time for task ${task.custom_id || task.id} (${user.username}).`);
                }
            }
        }
    }
}
