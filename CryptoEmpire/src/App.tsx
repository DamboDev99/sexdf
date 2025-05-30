// src/App.tsx
import React, { useEffect, useState } from 'react';
import './App.css'; // Файл стилей, который вы можете создать

// Объявляем интерфейс Telegram.WebApp, если используете TypeScript
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData?: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          receiver?: any; // Define more specifically if needed
          chat?: any; // Define more specifically if needed
          auth_date: number;
          hash: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          active: boolean;
          visible: boolean;
          setTextDomain: (domain: string) => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        onEvent: (eventType: string, callback: (...args: any[]) => void) => void;
        offEvent: (eventType: string, callback: (...args: any[]) => void) => void;
        sendData: (data: any) => void;
        openLink: (url: string) => void; // Для открытия ссылок кошельков
        openTelegramLink: (url: string) => void;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        themeParams: any; // Define more specifically if needed
        colorScheme: 'light' | 'dark';
        headerColor: string;
        backgroundColor: string;
        SETTINGS_BUTTON_EVENTS: {
             // Add specific event types if known
        };
        HAPTICS_IMPACT_OCCURRED: string;
        HAPTICS_NOTIFICATION_OCCURRED: string;
        HAPTICS_SELECTION_CHANGED: string;
      };
    };
  }
}


function App() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [connectionLink, setConnectionLink] = useState<string | null>(null);

  useEffect(() => {
    // Инициализация Telegram Mini App
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand(); // Развернуть Mini App на весь экран

      // Получаем данные пользователя Telegram
      setTelegramUser(window.Telegram.WebApp.initDataUnsafe?.user);

      // Здесь можно подписаться на события Mini App, например, закрытие
      // window.Telegram.WebApp.onEvent('viewportChanged', onViewportChanged);

      // Пример использования главной кнопки Telegram
      window.Telegram.WebApp.MainButton.setText('Подключить кошелек');
      window.Telegram.WebApp.MainButton.show();
      window.Telegram.WebApp.MainButton.onClick(handleConnectWallet);

       // Скрываем кнопку "назад" по умолчанию, если она не нужна
       window.Telegram.WebApp.BackButton.hide();

    } else {
      console.warn("Telegram WebApp object is not available. Are you running in Telegram?");
      // Можно показать заглушку для разработки вне Telegram
    }
  }, []);

  // --- Функции для взаимодействия с бэкендом и TON Connect ---

  const handleConnectWallet = async () => {
    console.log("Attempting to connect wallet...");
    // Здесь фронтенд должен запросить у бэкенда ссылку для подключения
    // Пример:
    try {
        // Предполагаем, что у вас есть бэкенд, который на эндпоинте /generate-connect-link
        // возвращает ссылку, сгенерированную с помощью connector.connect()
        const response = await fetch('/api/generate-connect-link', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 // Возможно, нужно передать user.id или initDataUnsafe для идентификации пользователя на бэкенде
                 'X-Telegram-Init-Data': window.Telegram.WebApp.initData || ''
             },
             // body: JSON.stringify({ userId: telegramUser?.id }) // Отправляем ID пользователя, если нужно
        });
        const data = await response.json();
        const link = data.link; // Ожидаем получить link в ответе

        if (link) {
            setConnectionLink(link);
            // Открываем ссылку с помощью Telegram Mini Apps API
            window.Telegram.WebApp.openLink(link);

            // Здесь также нужно начать слушать на бэкенде (или через WebSocket)
            // статус подключения для этого пользователя.
            // Когда бэкенд обнаружит, что кошелек подключен, он должен уведомить фронтенд.

            // Пример: Подписка на статус подключения (нужен WebSocket или long polling)
            // subscribeToConnectionStatus(telegramUser.id);

        } else {
            console.error("Failed to get connection link from backend");
            // Показать ошибку пользователю
        }

    } catch (error) {
        console.error("Error fetching connection link:", error);
        // Показать ошибку пользователю
    }
  };

  // Placeholder функция для отправки платежа
  const handleSendPayment = async () => {
    console.log("Attempting to send payment...");
     // Здесь фронтенд должен запросить у бэкенда сформировать транзакцию
     // и получить результат вызова connector.sendTransaction()
    try {
        // Пример:
        const paymentDetails = {
            recipient: 'ВАШ_АДРЕС_КОШЕЛЬКА_TON', // Адрес, куда отправляем TON
            amount: '100000000', // Сумма в nanoTON (например, 0.1 TON)
            paymentId: 'order-abc-123', // Уникальный ID платежа
            // Возможно, другие данные, как comment, stateInit и т.д.
        };

        const response = await fetch('/api/send-payment', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'X-Telegram-Init-Data': window.Telegram.WebApp.initData || '' // Передаем initData для верификации на бэкенде
             },
             body: JSON.stringify(paymentDetails)
        });
        const result = await response.json(); // Ожидаем результат транзакции

        if (result && result.success) {
            console.log("Payment initiated successfully:", result.txHash);
             // Показать пользователю сообщение об успехе или о необходимости подтвердить в кошельке
            alert("Платеж успешно инициирован! Пожалуйста, подтвердите его в вашем кошельке.");
             // Возможно, показать ссылку на explorer для отслеживания транзакции
        } else {
            console.error("Payment failed:", result.error);
            alert("Ошибка при инициации платежа: " + (result.error || "Неизвестная ошибка"));
             // Показать ошибку пользователю
        }

    } catch (error) {
        console.error("Error sending payment:", error);
        alert("Произошла ошибка при отправке платежа.");
         // Показать ошибку пользователю
    }
  };

   // Пример функции, которая будет вызвана, когда бэкенд уведомит фронтенд о подключении
   // (Эта часть требует дополнительной реализации бэкенда и механизма уведомлений)
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const onWalletConnected = () => {
       setWalletConnected(true);
        window.Telegram.WebApp.MainButton.setText('Отправить 0.1 TON'); // Меняем текст кнопки
        window.Telegram.WebApp.MainButton.onClick(handleSendPayment); // Меняем действие кнопки
        alert("Кошелек успешно подключен!");
   };

   // В реальном приложении вам нужен механизм (например, WebSocket) для получения
   // уведомлений с бэкенда, например, когда кошелек подключился или транзакция подтверждена.
   // useEffect(() => {
   //     // Установка соединения с WebSocket или long polling
   //     const ws = new WebSocket(`ws://your-backend.com/ws?userId=${telegramUser?.id}`);
   //     ws.onmessage = (event) => {
   //         const message = JSON.parse(event.data);
   //         if (message.type === 'wallet_connected') {
   //              onWalletConnected();
   //         }
   //          // Обработка других типов сообщений, например, подтверждение платежа
   //     };
   //     return () => ws.close();
   // }, [telegramUser]); // Зависит от наличия данных пользователя

  return (
    <div className="App">
      <header className="App-header">
        <h1>Прием платежей TON</h1>
        {telegramUser && (
          <p>Добро пожаловать, {telegramUser.first_name}!</p>
        )}

        {!walletConnected ? (
            <>
              <p>Подключите ваш TON кошелек, чтобы совершить платеж.</p>
               {/* Кнопка MainButton Telegram будет использоваться для этого */}
               {/* <button onClick={handleConnectWallet}>Подключить кошелек</button> */}
               {/* {connectionLink && (
                 <p>Используйте эту ссылку для подключения: <a href={connectionLink} target="_blank" rel="noopener noreferrer">{connectionLink}</a></p>
               )} */}
            </>
        ) : (
            <>
             <p>Кошелек подключен!</p>
             <p>Теперь вы можете отправить платеж.</p>
              {/* Кнопка MainButton Telegram будет использоваться для этого */}
             {/* <button onClick={handleSendPayment}>Отправить 0.1 TON</button> */}

             {/* Здесь может быть форма ввода суммы и других деталей платежа */}
            </>
        )}

        {/* Элементы UI для ввода деталей платежа могут быть здесь */}
        {/* Например:
        <input type="number" placeholder="Введите сумму в TON" />
        <button onClick={handleSendPayment}>Оплатить</button>
        */}

      </header>
    </div>
  );
}

export default App; 