// src/backend/ton-connect/storage.ts

import { IStorage } from '@tonconnect/sdk';
import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export async function initRedisClient(): Promise<void> {
    console.log("initRedisClient called.");
    if (!process.env.REDIS_URL) {
        console.error("REDIS_URL is not set in .env");
        return;
    }
    console.log("REDIS_URL found, creating client...");
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', err => console.error('Redis Client Error', err));
    console.log("Attempting to connect to Redis...");
    await client.connect();
    console.log("Redis client connected successfully.");
}

export class TonConnectStorage implements IStorage {
    constructor(private readonly chatId: number | string) {} // Используем chatId или уникальный user ID

    private getKey(key: string): string {
        return `tonconnect:${this.chatId}:${key}`;
    }

    async removeItem(key: string): Promise<void> {
        if (!client) {
            console.error("Redis client not initialized");
            return;
        }
        await client.del(this.getKey(key));
    }

    async setItem(key: string, value: string): Promise<void> {
         if (!client) {
            console.error("Redis client not initialized");
            return;
        }
        await client.set(this.getKey(key), value);
    }

    async getItem(key: string): Promise<string | null> {
         if (!client) {
            console.error("Redis client not initialized");
            return null;
        }
        return (await client.get(this.getKey(key))) || null;
    }
} 