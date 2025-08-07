# Use official Node.js LTS image
FROM node:22.17.1-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

# Remove dev dependencies for final image
RUN npm prune --production

CMD ["node", "dist/index.js"]