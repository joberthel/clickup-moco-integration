import { Collection } from 'mongodb';
import { FastifyInstance } from 'fastify';

export interface Webhook {
    _id?: string;
    userid: number;
    team_id: number;
    secret: string;
}

export default class WebhookService {
    private collection: Collection;

    constructor(server: FastifyInstance) {
        this.collection = server.db.collection('webhooks');
    }

    async create(webhook: Webhook): Promise<Webhook | false> {
        const { insertedId } = await this.collection.insertOne(webhook);
        return await this.getOne(insertedId);
    }

    async getAll(filter = {}): Promise<Webhook[]> {
        return await this.collection.find(filter).toArray();
    }

    async getOne(id: string): Promise<Webhook | false> {
        const webhook = await this.collection.findOne({ _id: id });

        if (!webhook) {
            return false;
        }

        return webhook;
    }

    async update(id: string, webhook: Webhook): Promise<Webhook | false> {
        await this.collection.updateOne(
            {
                _id: id
            },
            {
                $set: webhook
            },
            {
                upsert: true
            }
        );

        return await this.getOne(id);
    }

    async delete(id: string): Promise<void> {
        await this.collection.deleteOne({ _id: id });
    }
}
