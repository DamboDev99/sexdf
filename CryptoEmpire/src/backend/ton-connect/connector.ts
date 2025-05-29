// src/backend/ton-connect/connector.ts

import TonConnect from '@tonconnect/sdk';
import { TonConnectStorage } from './storage';
import { initDataPayload, parseInitData } from '../../utils/telegram'; // Предполагаем утилиту для парсинга initData

// В реальном приложении, возможно, потребуется более надежный способ получения ID пользователя
// В данном примере используем ID пользователя из initData
function getUserIdFromInitData(initData: string): number | string | null {
    try {
        const parsed = parseInitData(initData);
        return parsed?.user?.id || parsed?.chat?.id || null;
    } catch (e) {
        console.error("Failed to parse initData:", e);
        return null;
    }
}

// Хранилище коннекторов по ID пользователя/чата
const connectors: Map<number | string, TonConnect> = new Map();

export function getConnector(initData: string): { connector: TonConnect, userId: number | string } | null {
    const userId = getUserIdFromInitData(initData);

    if (!userId) {
        console.error("Could not get user ID from initData.");
        return null;
    }

    let connector = connectors.get(userId);

    if (!connector) {
        if (!process.env.MANIFEST_URL) {
             console.error("MANIFEST_URL is not set in .env");
             return null;
        }
         // Создаем новый экземпляр коннектора для этого пользователя
        connector = new TonConnect({
            storage: new TonConnectStorage(userId),
            manifestUrl: process.env.MANIFEST_URL,
            logger: {
                log: console.log,
                warn: console.warn,
                error: console.error,
            }
        });

        // TODO: Подписаться на onStatusChange для отслеживания подключения/отключения
        // и уведомления фронтенда (например, через WebSocket)
        connector.onStatusChange(async (wallet) => {
            console.log(`Wallet status changed for user ${userId}:`, wallet);
            // Здесь можно отправить уведомление на фронтенд Mini App через WebSocket
            // о том, что кошелек подключен (если wallet не null) или отключен.
            if (wallet) {
                 console.log(`User ${userId} connected wallet: ${wallet.device.appName}`);
                 // Пример отправки уведомления (нужна реализация WebSocket сервера)
                 // notifyFrontend(userId, { type: 'wallet_connected', wallet: wallet });
            } else {
                console.log(`User ${userId} disconnected wallet.`);
                 // notifyFrontend(userId, { type: 'wallet_disconnected' });
            }
        });

        connectors.set(userId, connector);
         console.log(`Created new connector for user ${userId}.`);
    }

     // Попытка восстановить существующее соединение
     connector.restoreConnection().catch(e => console.error(`Failed to restore connection for user ${userId}:`, e));

    return { connector, userId };
}

// TODO: Реализовать утилиту для парсинга и верификации initData Telegram
// src/utils/telegram.ts
// export function parseInitData(initData: string): initDataPayload | null { ... }
// export interface initDataPayload { ... } 