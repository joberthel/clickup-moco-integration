import { Collection } from 'mongodb';
import { FastifyInstance } from 'fastify';

export interface User {
    _id?: number;
    username: string;
    credentials: {
        mocoKey: string;
        clickupToken: string;
    };
}

export default class UserService {
    private collection: Collection;

    constructor(server: FastifyInstance) {
        this.collection = server.db.collection('users');
    }

    async create(user: User): Promise<User | false> {
        const { insertedId } = await this.collection.insertOne(user);
        return await this.getOne(insertedId);
    }

    async getAll(filter = {}): Promise<User[]> {
        return await this.collection.find(filter).toArray();
    }

    async getOne(id: number): Promise<User | false> {
        const user = await this.collection.findOne({ _id: id });

        if (!user) {
            return false;
        }

        return user;
    }

    async update(id: number, user: User): Promise<User | false> {
        await this.collection.updateOne(
            {
                _id: id
            },
            {
                $set: user
            },
            {
                upsert: true
            }
        );

        return await this.getOne(id);
    }

    async delete(id: number): Promise<void> {
        await this.collection.deleteOne({ _id: id });
    }
}
