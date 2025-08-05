# Use official Node.js LTS image
FROM node:22.17.1

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

RUN npm run build

CMD ["node", "dist/index.js"]