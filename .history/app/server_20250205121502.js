const express = require('express');
const { OpenVidu } = require('openvidu-node-client');
const path = require('path');
const app = express();

const OPENVIDU_URL = process.env.OPENVIDU_URL || 'https://openvidu-server:4443';
const OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';

console.log('OpenVidu URL:', OPENVIDU_URL);
console.log('OpenVidu Secret:', OPENVIDU_SECRET);

const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});

// Criar nova sessão
app.post('/api/sessions', async (req, res) => {
    console.log('Criando nova sessão...');
    try {
        const session = await openvidu.createSession();
        console.log('Sessão criada:', session.sessionId);
        res.json({ sessionId: session.sessionId });
    } catch (error) {
        console.error('Erro ao criar sessão:', error);
        res.status(500).json({ error: error.message });
    }
});

// Gerar token
app.post('/api/sessions/:sessionId/connections', async (req, res) => {
    const sessionId = req.params.sessionId;
    console.log('Gerando token para sessão:', sessionId);
    
    try {
        const session = await openvidu.activeSessions.find(s => s.sessionId === sessionId);
        if (!session) {
            throw new Error(`Sessão não encontrada: ${sessionId}`);
        }

        const connection = await session.createConnection();
        console.log('Token gerado:', connection.token);
        res.json({ token: connection.token });
    } catch (error) {
        console.error('Erro ao gerar token:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 