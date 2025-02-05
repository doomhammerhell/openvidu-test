const express = require('express');
const { OpenVidu } = require('openvidu-node-client');
const path = require('path');
const app = express();

// Aceitar certificados auto-assinados em desenvolvimento
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const OPENVIDU_URL = 'https://openvidu-server:4443';
const OPENVIDU_SECRET = 'MY_SECRET';

console.log('Inicializando OpenVidu com URL:', OPENVIDU_URL);
const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para logs detalhados
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body) {
        console.log('Body:', JSON.stringify(req.body));
    }
    next();
});

// Rota para criar sessão
app.post('/api/sessions', async (req, res) => {
    try {
        console.log('Iniciando criação de sessão...');
        
        // Forçar a inicialização do OpenVidu
        await openvidu.fetch();
        
        const properties = {
            recordingMode: 'MANUAL',
            defaultRecordingProperties: {
                hasAudio: true,
                hasVideo: true
            }
        };

        const session = await openvidu.createSession(properties);
        console.log('Sessão criada com sucesso:', session.sessionId);
        
        res.status(200).json({ 
            sessionId: session.sessionId,
            status: 'created'
        });
    } catch (error) {
        console.error('Erro ao criar sessão:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Rota para criar conexão
app.post('/api/sessions/:sessionId/connections', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { role = 'PUBLISHER' } = req.body;

        console.log(`Criando conexão para sessão ${sessionId} com role ${role}`);

        // Forçar atualização das sessões ativas
        await openvidu.fetch();
        
        // Encontrar a sessão
        const session = openvidu.activeSessions.find(s => s.sessionId === sessionId);
        
        if (!session) {
            throw new Error(`Sessão não encontrada: ${sessionId}`);
        }

        const connection = await session.createConnection({
            role,
            data: JSON.stringify({ clientData: role === 'PUBLISHER' ? 'broadcaster' : 'viewer' }),
            kurentoOptions: {
                allowedFilters: ['GStreamerFilter', 'FaceDetectionFilter']
            }
        });

        console.log('Token gerado:', connection.token);
        
        res.status(200).json({ 
            token: connection.token,
            status: 'connected'
        });
    } catch (error) {
        console.error('Erro ao criar conexão:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Rota de healthcheck
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('OpenVidu URL:', OPENVIDU_URL);
}); 