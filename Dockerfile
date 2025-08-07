FROM node:22.17.1-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22.17.1-alpine

WORKDIR /app

COPY package.json package-lock.json* .env ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

CMD ["node", "dist/index.js"]