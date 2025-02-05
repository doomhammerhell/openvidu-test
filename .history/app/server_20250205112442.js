const express = require('express');
const { OpenVidu } = require('openvidu-node-client');
const path = require('path');
const app = express();

// Aceitar certificados auto-assinados em desenvolvimento
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const OPENVIDU_URL = 'https://openvidu-server:4443';
const OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';

const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Adicionar middleware para logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Adicionar CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

// Rota para criar uma nova sessão de broadcasting
app.post('/api/sessions', async (req, res) => {
    console.log('Criando nova sessão...');
    try {
        const session = await openvidu.createSession({
            customSessionId: String(Math.random()).slice(2),
            recordingMode: 'MANUAL',
            defaultRecordingProperties: {
                name: 'MyRecording',
                hasAudio: true,
                hasVideo: true,
            }
        });
        console.log('Sessão criada:', session.sessionId);
        res.json({ sessionId: session.sessionId });
    } catch (error) {
        console.error('Erro ao criar sessão:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para gerar token (para broadcaster ou viewer)
app.post('/api/sessions/:sessionId/connections', async (req, res) => {
    const { sessionId } = req.params;
    const { role } = req.body; // 'PUBLISHER' ou 'SUBSCRIBER'
    console.log(`Gerando token para sessão ${sessionId} com role ${role}`);

    try {
        const session = await openvidu.activeSessions.find(s => s.sessionId === sessionId);
        if (!session) {
            throw new Error('Sessão não encontrada');
        }

        const connection = await session.createConnection({
            role: role,
            data: JSON.stringify({ clientData: role === 'PUBLISHER' ? 'broadcaster' : 'viewer' }),
            kurentoOptions: {
                videoMaxRecvBandwidth: 1000,
                videoMinRecvBandwidth: 300,
                videoMaxSendBandwidth: 1000,
                videoMinSendBandwidth: 300,
                allowedFilters: ['GStreamerFilter', 'FaceDetectionFilter']
            }
        });

        console.log('Token gerado com sucesso');
        res.json({ token: connection.token });
    } catch (error) {
        console.error('Erro ao gerar token:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
}); 