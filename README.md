# Perpétuo Boneco - Pablo Dashboard

Este dashboard foi criado para monitorar vendas e tráfego em tempo real.

## Como publicar na Vercel

1. **Integração com GitHub**: Certifique-se de que todos os arquivos (incluindo a pasta `/api`) foram enviados para o seu repositório.
2. **Configuração na Vercel**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Backend**: O backend está configurado como uma Serverless Function na pasta `/api`. A Vercel detectará isso automaticamente e criará a rota `/api/data`.

## Desenvolvimento Local

1. Instale as dependências: `npm install`
2. Inicie o servidor de desenvolvimento: `npm run dev`
3. O app estará disponível em `http://localhost:3000`
