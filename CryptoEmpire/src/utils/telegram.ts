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
    // Эта функция должна:
    // 1. Извлечь 'hash' из initData.
    // 2. Сформировать строку для проверки хэша: отсортировать все параметры initData (кроме hash) по ключу и объединить их в формате 'key=value\nkey=value'.
    // 3. Вычислить HmacSHA256 хэш этой строки, используя SECRET_KEY.
    // 4. SECRET_KEY вычисляется как HmacSHA256 от строки "WebAppData" используя SHA256 хэш вашего botToken в качестве ключа.
    // 5. Сравнить вычисленный хэш с хэшем из initData.
    // 6. Проверить auth_date, чтобы убедиться, что данные не устарели (рекомендуется не старше 24 часов).

    console.warn("InitData verification is NOT implemented. THIS IS A SECURITY RISK.");

    // Placeholder for verification logic
    // const { hash, ...dataToCheck } = parseInitData(initData) || {};
    // if (!hash || !dataToCheck) return false;

    // ... (реализация верификации)

    return false; // Пока всегда возвращаем false, так как верификация не реализована
} 