FROM node:18-alpine

WORKDIR /app

# Copia os arquivos de configuração
COPY package*.json ./
COPY next.config.js ./
COPY tsconfig.json ./

# Instala as dependências
RUN npm install

# Copia o código fonte
COPY src ./src
COPY public ./public

# Gera o build
RUN npm run build

# Expõe a porta que o Next.js usa
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 