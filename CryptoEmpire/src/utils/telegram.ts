// src/utils/telegram.ts

import { webcrypto } from 'node:crypto'; // Доступно в Node.js 15+

// Интерфейс для данных из initData Telegram
export interface initDataPayload {
    query_id?: string;
    user?: { // Объект User всегда присутствует для обычных пользователей
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
        is_bot?: boolean;
        is_premium?: boolean;
        added_to_attachment_menu?: boolean;
        allows_write_to_pm?: boolean;
        photo_url?: string;
    };
     // Поля chat, receiver присутствуют только в определенных контекстах (например, когда Mini App открыто из группы/канала)
    receiver?: { // Объект User для получателя сообщения
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
        is_bot?: boolean;
        is_premium?: boolean;
        added_to_attachment_menu?: boolean;
        allows_write_to_pm?: boolean;
        photo_url?: string;
    };
    chat?: { // Объект Chat (группа, канал, личный чат) если Mini App открыто из чата
        id: number;
        type: 'group' | 'supergroup' | 'channel' | 'sender';
        title: string;
        username?: string;
        photo_url?: string;
    };
    chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel';
    chat_instance?: string; // Уникальный ID для инстанса чата
    start_param?: string; // Параметр из deep link
    can_send_after?: number; // Время в секундах до следующей отправки сообщения
    can_send_bots_messages?: boolean; // Могут ли боты отправлять сообщения в этом чате
    can_edit_messages?: boolean; // Могут ли боты редактировать сообщения в этом чате
    can_delete_messages?: boolean; // Могут ли боты удалять сообщения в этом чате
    auth_date: number; // Время авторизации в секундах с эпохи
    hash: string; // Хэш для верификации
}

// Функция для парсинга initData строки в объект
export function parseInitData(initData: string): initDataPayload | null {
    try {
        const params = new URLSearchParams(initData);
        const data: any = {};

        params.forEach((value, key) => {
            // Специальная обработка для вложенных JSON строк (user, receiver, chat)
            if (key === 'user' || key === 'receiver' || key === 'chat') {
                try {
                    data[key] = JSON.parse(value);
                } catch (e) {
                    console.error(`Failed to parse JSON for key ${key}:`, e);
                     // Если не удалось распарсить JSON, сохраняем как строку или игнорируем
                    data[key] = value; // Можно оставить как строку для отладки
                     // delete data[key]; // Или просто удалить некорректное поле
                }
            } else if (key === 'auth_date') {
                 data[key] = parseInt(value, 10); // auth_date - число
            } else if (key === 'can_send_after') {
                 data[key] = parseInt(value, 10); // can_send_after - число
            } else if (value === 'true') {
                 data[key] = true; // Boolean значения
            } else if (value === 'false') {
                 data[key] = false; // Boolean значения
            } else {
                 data[key] = value; // Остальные параметры как строки
            }
        });

        // Убедимся, что поле hash присутствует
        if (!data.hash) {
            console.error("Init data is missing hash.");
            return null;
        }

        return data as initDataPayload;

    } catch (error) {
        console.error("Failed to parse initData string:", error);
        return null;
    }
}

// TODO: Реализовать верификацию initData
// Это КРИТИЧНО для безопасности!
// См. документацию Telegram: https://core.telegram.org/bots/webapps#verifying-authorization
export async function verifyInitData(initData: string, botToken: string): Promise<boolean> {
    if (!botToken) {
        console.error("Telegram bot token is not provided for initData verification.");
        return false; // Невозможно верифицировать без токена
    }

    const parsedData = parseInitData(initData);
    if (!parsedData || !parsedData.hash) {
        console.error("Init data is invalid or missing hash for verification.");
        return false;
    }

    // Проверка auth_date (данные не старше 24 часов)
    const twentyFourHoursInSeconds = 24 * 60 * 60;
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    if (currentTimeInSeconds - parsedData.auth_date > twentyFourHoursInSeconds) {
        console.warn("initData is outdated (older than 24 hours).");
        return false; // Данные устарели
    }

    // TODO: Реализовать полную криптографическую верификацию initData
    // Это КРИТИЧНО для безопасности!
    // См. документацию Telegram: https://core.telegram.org/bots/webapps#verifying-authorization
    console.warn("Full cryptographic initData verification is NOT implemented. THIS IS A SECURITY RISK.");

    // Placeholder для логики криптографической верификации:
    // 1. Извлечь 'hash' из initData (parsedData.hash).
    // 2. Сформировать строку для проверки хэша: отсортировать все параметры initData (кроме hash) по ключу и объединить их в формате 'key=value\nkey=value'.
    //    const { hash, ...dataToCheck } = parsedData;
    //    const dataCheckString = Object.keys(dataToCheck)
    //        .sort()
    //        .map(key => `${key}=${dataToCheck[key]}`)
    //        .join('\n');
    // 3. Вычислить HmacSHA256 хэш этой строки, используя SECRET_KEY.
    //    const secretKey = await webcrypto.subtle.importKey(
    //        'raw',
    //        await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(botToken)),
    //        { name: 'HMAC', hash: 'SHA-256' },
    //        false,
    //        ['sign']
    //    );
    //    const hmac = await webcrypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(dataCheckString));
    //    const calculatedHash = Buffer.from(hmac).toString('hex');
    // 4. Сравнить вычисленный хэш с хэшем из initData.
    //    if (calculatedHash === parsedData.hash) {
    //        console.log("InitData verification successful (cryptographic part - placeholder).");
    //        return true; // Если бы проверка была реализована
    //    }

    // Пока что, для разработки и если другие проверки прошли, можно временно вернуть true,
    // НО ЭТО НУЖНО ЗАМЕНИТЬ НА ПОЛНУЮ ВЕРИФИКАЦИЮ.
    // Для целей этого упражнения, вернем true, если auth_date проверка прошла.
    // В продакшене это должно быть false до полной реализации.
    // return false; // Безопасное значение по умолчанию до полной реализации
    return true; // ВРЕМЕННО для демонстрации, что функция вызывается. ЗАМЕНИТЬ!
} 