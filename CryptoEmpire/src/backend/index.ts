console.log("Backend script started."); // Added logging
// src/backend/index.ts

import express from 'express';
import dotenv from 'dotenv';
dotenv.config(); // Загружаем переменные окружения

import { initRedisClient } from './ton-connect/storage';
import { getConnector } from './ton-connect/connector';
import { CHAIN } from '@tonconnect/sdk'; // Для указания тестовой или основной сети
import { verifyInitData } from '../utils/telegram'; // Импортируем verifyInitData

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json()); // Для парсинга JSON тел запросов

// Middleware для получения initData и коннектора
app.use(async (req, res, next) => { // Делаем middleware асинхронным
    const initData = req.headers['x-telegram-init-data'] as string;
    if (!initData) {
        // В продакшене здесь нужно отправлять 401 Unauthorized или другую ошибку
        console.warn("Request without X-Telegram-Init-Data header. For development, allowing access.");
        // Для пирамиды это должно быть строго запрещено
        // return res.status(401).send('Unauthorized: X-Telegram-Init-Data header is missing.');
        // Пока что, для разработки, пропускаем, но это УЯЗВИМОСТЬ
        (req as any).connectorInfo = null; 
        next();
        return;
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error("TELEGRAM_BOT_TOKEN is not set. Cannot verify initData.");
        // В продакшене это должно приводить к ошибке сервера, т.к. приложение не может работать безопасно
        return res.status(500).send('Server configuration error: Missing Telegram Bot Token.');
    }

    const isInitDataValid = await verifyInitData(initData, botToken);
    if (!isInitDataValid) {
        console.warn("Invalid Telegram Init Data received.");
        return res.status(403).send('Forbidden: Invalid Telegram Init Data.');
    }
    console.log("Telegram Init Data verified (basic checks passed).");

    const connectorInfo = getConnector(initData);

    if (!connectorInfo) {
         // Сообщение улучшено в предыдущем шаге, можно оставить или уточнить
         return res.status(400).send('Invalid Telegram Init Data or connector initialization failed.');
    }

    (req as any).connectorInfo = connectorInfo; // Прикрепляем коннектор и userId к запросу
    next();
});

// Эндпоинт для генерации ссылки подключения кошелька
app.post('/api/generate-connect-link', async (req, res) => {
    const connectorInfo = (req as any).connectorInfo;
    if (!connectorInfo) {
        return res.status(400).send("Connector not available.");
    }

    const { connector } = connectorInfo;

    try {
         // Получаем список доступных кошельков (опционально, можно использовать универсальную ссылку)
        // const wallets = await getWallets();
        // const tonkeeper = wallets.find(wallet => wallet.appName === 'tonkeeper');
        // const link = connector.connect({ bridgeUrl: tonkeeper.bridgeUrl, universalLink: tonkeeper.universalLink });

        // Используем универсальную ссылку для подключения
        const link = connector.connect();

        res.json({ link });
    } catch (error) {
        console.error("Error generating connect link:", error);
        res.status(500).send("Failed to generate connect link.");
    }
});

// Эндпоинт для отправки платежа
app.post('/api/send-payment', async (req, res) => {
    const connectorInfo = (req as any).connectorInfo;
    if (!connectorInfo) {
        return res.status(400).send("Connector not available.");
    }

    const { connector, userId } = connectorInfo;
    const { recipient, amount, paymentId } = req.body; // Получаем детали платежа из тела запроса

    if (!connector.connected) {
        return res.status(400).send("Wallet not connected.");
    }

    if (!recipient || !amount || !paymentId) {
         return res.status(400).send("Missing payment details (recipient, amount, paymentId).");
    }

    if (!process.env.RECIPIENT_WALLET_ADDRESS || process.env.RECIPIENT_WALLET_ADDRESS !== recipient) {
         // В реальном приложении вы, вероятно, не будете позволять фронтенду указывать любой адрес получателя
         // Получатель должен быть настроен на бэкенде
        console.warn(`Recipient address mismatch or not set: ${recipient}`);
         // return res.status(400).send("Invalid recipient address."); // Раскомментировать в продакшене
    }

    const transactionRequest = {
        validUntil: Math.round(Date.now() / 1000) + 600, // 10 минут
        messages: [
            {
                address: recipient,
                amount: amount, // Сумма в nanoTON (string)
                // payload: paymentId // Можно добавить paymentId в payload, если нужно
                 // stateInit: ... // Если нужно деплоить контракт
            }
        ],
         payload: paymentId // Можно также добавить paymentId как общий payload транзакции
    };

    try {
        console.log(`User ${userId} attempting to send transaction:`, transactionRequest);
        const result = await connector.sendTransaction(transactionRequest);
        console.log(`User ${userId} transaction sent:`, result);
        res.json({ success: true, txHash: result.boc }); // Возвращаем хэш транзакции или другой идентификатор

        // TODO: Отслеживать подтверждение транзакции на блокчейне
        // Например, с помощью TonApi или другого источника данных блокчейна

    } catch (error) {
        console.error(`User ${userId} transaction failed:`, error);
         // Обработка ошибок, включая UserRejectsError
        if (error instanceof Error && error.name === 'UserRejectsError') {
             res.status(400).json({ success: false, error: "Transaction rejected by user." });
        } else {
            res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
    }
});

// TODO: Реализовать WebSocket сервер для уведомлений фронтенда

async function startBackend() {
    await initRedisClient();

    app.listen(port, () => {
        console.log(`Backend running on port ${port}`);
    });
}

startBackend().catch(console.error); 