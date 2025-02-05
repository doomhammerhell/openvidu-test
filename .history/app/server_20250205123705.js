const express = require('express');
const { OpenVidu } = require('openvidu-node-client');
const path = require('path');
const app = express();

// Aceitar certificados auto-assinados em desenvolvimento
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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
        await openvidu.fetch();

        const properties = {
            recordingMode: 'MANUAL',
            defaultRecordingProperties: {
                hasAudio: true,
                hasVideo: true
            },
            customSessionId: `session-${Date.now()}`,
            mediaMode: 'ROUTED',
            recordingLayout: 'BEST_FIT',
            defaultOutputMode: 'COMPOSED',
            forcedVideoCodec: 'VP8'
        };

        const session = await openvidu.createSession(properties);
        console.log('Sessão criada com ID:', session.sessionId);
        res.status(200).json({ 
            sessionId: session.sessionId,
            status: 'created'
        });
    } catch (error) {
        if (error.message.includes('already exists')) {
            // Se a sessão já existe, retorne ela
            const sessionId = error.message.split('"')[1];
            res.status(200).json({ 
                sessionId: sessionId,
                status: 'exists'
            });
        } else {
            console.error('Erro detalhado ao criar sessão:', error);
            res.status(500).json({ 
                error: error.message,
                stack: error.stack,
                details: JSON.stringify(error, null, 2)
            });
        }
    }
});

// Gerar token
app.post('/api/sessions/:sessionId/connections', async (req, res) => {
    const sessionId = req.params.sessionId;
    console.log('Gerando token para sessão:', sessionId);
    
    try {
        await openvidu.fetch();
        
        let session = openvidu.activeSessions.find(s => s.sessionId === sessionId);
        
        if (!session) {
            session = await openvidu.createSession({ customSessionId: sessionId });
        }

        const connectionProperties = {
            role: req.body.role || 'PUBLISHER',
            data: JSON.stringify({ clientData: req.body.username || 'user' }),
            kurentoOptions: {
                videoMaxRecvBandwidth: 1000,
                videoMinRecvBandwidth: 300,
                videoMaxSendBandwidth: 1000,
                videoMinSendBandwidth: 300,
                allowedFilters: ['GStreamerFilter', 'FaceDetectionFilter']
            }
        };

        const connection = await session.createConnection(connectionProperties);
        console.log('Token gerado:', connection.token);
        
        res.status(200).json({ 
            token: connection.token,
            status: 'connected'
        });
    } catch (error) {
        console.error('Erro detalhado ao gerar token:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack,
            details: JSON.stringify(error, null, 2)
        });
    }
});

// Rota de healthcheck
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        openviduUrl: OPENVIDU_URL
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('OpenVidu URL:', OPENVIDU_URL);
    console.log('OpenVidu Secret:', OPENVIDU_SECRET);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
}); 