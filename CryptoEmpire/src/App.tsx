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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectionLink, setConnectionLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    // Инициализация Telegram Mini App
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand(); // Развернуть Mini App на весь экран

      // Получаем данные пользователя Telegram
      setTelegramUser(window.Telegram.WebApp.initDataUnsafe?.user);

       // Скрываем кнопку "назад" по умолчанию, если она не нужна
       window.Telegram.WebApp.BackButton.hide();

      // Пример подписки на событие изменения статуса кошелька (если бэкенд шлет через WebSockets)
      // window.Telegram.WebApp.onEvent('wallet_status_changed', (data: any) => {
      //   if (data.type === 'wallet_connected') {
      //     setWalletConnected(true);
      //     console.log("Wallet connected:", data.wallet);
      //   } else if (data.type === 'wallet_disconnected') {
      //     setWalletConnected(false);
      //     console.log("Wallet disconnected");
      //   }
      // });

    } else {
      console.warn("Telegram WebApp object is not available. Are you running in Telegram?");
      setError("Not running in Telegram environment.");
      // Можно показать заглушку для разработки вне Telegram
    }
  }, []);

  const handleConnectWalletClick = async () => {
    if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initData) {
      setError("Telegram initData is not available.");
      console.error("Telegram initData is not available.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setConnectionLink(null);

    try {
      const response = await fetch('/api/generate-connect-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': window.Telegram.WebApp.initData
        },
        // Тело запроса может быть пустым, если бэкенд его не требует для этой операции
        // body: JSON.stringify({ userId: telegramUser?.id }) // Если нужно передать userId
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Failed to get connection link: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      if (data.link) {
        setConnectionLink(data.link);
        // Открываем ссылку для подключения кошелька
        // window.Telegram.WebApp.openLink(data.link);
        // Обычно, после openLink, Mini App может закрыться или перейти в фон,
        // а кошелек откроется. Возврат и обновление статуса - через deep link или WebSocket.
        // Для простоты пока просто покажем ссылку.
        console.log("Connection link:", data.link);
        // Установим walletConnected в true условно, для демонстрации
        // В реальности это должно управляться через коллбэки TonConnect или WebSocket
        setWalletConnected(true); 
      } else {
        throw new Error("Connection link was not found in the response.");
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err.message || "An unknown error occurred.");
      setWalletConnected(false);
    } finally {
      setIsLoading(false);
    }
  };


  // Временные заглушки для ESLint, пока логика не реализована
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onWalletConnected = () => {}; // Пустая заглушка функции


  return (
    <div className="app-container">
      {/* Верхняя панель (Хедер) */}
      <div className="header-panel">
        {/* Placeholder для иконки депа/TON */}
        <div className="header-icon left">💰 [TON Logo / Бачей]</div>
        {/* Placeholder для иконки информации */}
        <div className="header-icon right">❓ [Инфо Icon]</div>
        {/* Placeholder для иконки проекта/фазы */}
        <div className="header-project-icon center">🏗️ [Project Icon / Phase]</div>
      </div>

      {/* Центральная область контента */}
      <div className="content-area">
        {/* Placeholder для центральной PNG картинки фона */}
        <div className="background-image-placeholder"></div>

        {/* Здесь будут наложены элементы: путаны, индикаторы, кнопки взаимодействия */}
        <div className="overlay-elements">
          {telegramUser && (
            <div>
              <p>Привет, {telegramUser.first_name || 'User'}!</p>
            </div>
          )}

          {!walletConnected ? (
            <button onClick={handleConnectWalletClick} disabled={isLoading}>
              {isLoading ? 'Загрузка...' : 'Подключить кошелек'}
            </button>
          ) : (
            <p>Кошелек подключен! (Статус условный)</p>
          )}
          {connectionLink && <p>Ссылка для подключения: <a href={connectionLink} target="_blank" rel="noopener noreferrer">{connectionLink}</a></p>}
          {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}
          
          {/* Пример: Placeholder для индикатора Hunger */}
          <div className="indicator hunger">❤️ Hunger: [Value]</div>
           {/* Пример: Placeholder для индикатора Happy */}
          <div className="indicator happy">😊 Happy: [Value]</div>
          {/* Placeholder для путан и их статусов */}
          <div className="prostitutes-area"></div>
           {/* Placeholder для кнопок Auto/Refresh */}
           <div className="action-buttons"></div>
        </div>
      </div>

      {/* Нижняя навигационная панель (Футер) */}
      <div className="footer-nav">
        {/* Иконки навигации */}
        <div className="nav-icon">🛒 Притон</div>
        <div className="nav-icon">👤 Профиль</div>
        <div className="nav-icon">💎 Пожертвование</div>
        <div className="nav-icon">🤝 Друзья</div>
      </div>

       {/* Placeholder для других элементов, например, модальных окон */}
      <div className="modal-placeholder"></div>

    </div>
  );
}

export default App; 