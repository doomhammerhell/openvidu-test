const express = require('express');
const { OpenVidu } = require('openvidu-node-client');
const path = require('path');
const app = express();

// Aceitar certificados auto-assinados em desenvolvimento
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Use a URL correta do OpenVidu Server (usando o nome do container)
const OPENVIDU_URL = 'https://openvidu-server:4443';
const OPENVIDU_SECRET = 'MY_SECRET';

console.log('Inicializando OpenVidu com URL:', OPENVIDU_URL);
const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

// Rota para criar sessão
app.post('/api/sessions', async (req, res) => {
    console.log('Criando nova sessão...');
    try {
        const sessionProperties = {
            recordingMode: 'MANUAL',
            defaultRecordingProperties: {
                hasAudio: true,
                hasVideo: true
            }
        };

        const session = await openvidu.createSession(sessionProperties);
        console.log('Sessão criada com ID:', session.sessionId);
        res.json({ sessionId: session.sessionId });
    } catch (error) {
        console.error('Erro ao criar sessão:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.toString(),
            stack: error.stack 
        });
    }
});

// Rota para criar conexão
app.post('/api/sessions/:sessionId/connections', async (req, res) => {
    const { sessionId } = req.params;
    const { role } = req.body;
    
    console.log(`Criando conexão para sessão ${sessionId} com role ${role}`);
    
    try {
        const session = await openvidu.activeSessions.find(s => s.sessionId === sessionId);
        if (!session) {
            const error = new Error(`Sessão não encontrada: ${sessionId}`);
            console.error(error);
            return res.status(404).json({ error: error.message });
        }

        const connectionProperties = {
            role: role || 'PUBLISHER',
            data: JSON.stringify({ clientData: role === 'PUBLISHER' ? 'broadcaster' : 'viewer' }),
            kurentoOptions: {
                videoMaxRecvBandwidth: 1000,
                videoMinRecvBandwidth: 300,
                videoMaxSendBandwidth: 1000,
                videoMinSendBandwidth: 300
            }
        };

        const connection = await session.createConnection(connectionProperties);
        console.log('Conexão criada com token:', connection.token);
        res.json({ token: connection.token });
    } catch (error) {
        console.error('Erro ao criar conexão:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.toString(),
            stack: error.stack 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('OpenVidu URL:', OPENVIDU_URL);
    console.log('OpenVidu Secret:', OPENVIDU_SECRET);
}); 