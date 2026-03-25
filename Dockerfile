FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src /app/src
COPy tsconfig.json tsconfig.json
RUN npm run build

CMD ["node", "build/index.js"]
