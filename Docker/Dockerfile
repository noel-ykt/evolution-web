# Используем официальный образ Node.js версии 20
FROM node:22

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json из папки app
COPY app/package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь исходный код из папки app
COPY app/ ./

# Устанавливаем переменную окружения
ENV NODE_ENV=production

# Выполняем сборку приложения
RUN npm run build

# Указываем порт, который использует приложение
EXPOSE 3000

# Команда для запуска сервера
CMD ["npm", "run", "server:start"]