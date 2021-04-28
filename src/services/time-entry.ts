import { Collection } from 'mongodb';
import { FastifyInstance } from 'fastify';

export interface TimeEntry {
    _id?: string;
}

export default class TimeEntryService {
    private collection: Collection;

    constructor(server: FastifyInstance) {
        this.collection = server.db.collection('timeEntries');
    }

    async create(timeEntry: TimeEntry): Promise<TimeEntry | false> {
        const { insertedId } = await this.collection.insertOne(timeEntry);
        return await this.getOne(insertedId);
    }

    async getAll(filter = {}): Promise<TimeEntry[]> {
        return await this.collection.find(filter).toArray();
    }

    async getOne(id: string): Promise<TimeEntry | false> {
        const timeEntry = await this.collection.findOne({ _id: id });

        if (!timeEntry) {
            return false;
        }

        return timeEntry;
    }

    async update(id: string, timeEntry: TimeEntry): Promise<TimeEntry | false> {
        await this.collection.updateOne(
            {
                _id: id
            },
            {
                $set: timeEntry
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
