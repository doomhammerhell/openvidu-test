const express = require('express');
const OpenVidu = require('openvidu-node-client').OpenVidu;
const app = express();

const OPENVIDU_URL = 'https://localhost:4443';
const OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';

const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

app.use(express.json());

// Webhook para gerenciar permissões quando um participante entra
app.post('/webhook', async (req, res) => {
    const event = req.body;
    
    if (event.event === 'participantJoined') {
        try {
            const session = await openvidu.getActiveSession(event.sessionId);
            const connection = session.getConnection(event.connectionId);
            
            // Se não for o host (primeiro participante), remove permissões de publicação
            if (session.activeConnections.length > 1) {
                const connection = session.getConnection(event.connectionId);
                await connection.forceUpdatePermissions({
                    publish: false,
                    subscribe: true,
                    force: false
                });
            }
        } catch (error) {
            console.error('Erro ao atualizar permissões:', error);
        }
    }
    
    res.status(200).send('OK');
});

// Endpoint para criar nova sessão
app.post('/api/sessions', async (req, res) => {
    try {
        const session = await openvidu.createSession({
            customSessionId: req.body.sessionId,
            defaultOutputMode: 'COMPOSED',
            recordingMode: 'ALWAYS'
        });
        
        res.json({ sessionId: session.sessionId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para gerar token
app.post('/api/sessions/:sessionId/connections', async (req, res) => {
    try {
        const session = await openvidu.getActiveSession(req.params.sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Sessão não encontrada' });
        }

        const isHost = session.activeConnections.length === 0;
        const connectionProperties = {
            role: isHost ? 'MODERATOR' : 'SUBSCRIBER',
            data: JSON.stringify({ isHost }),
            kurentoOptions: {
                videoMaxRecvBandwidth: 1000,
                videoMinRecvBandwidth: 300,
                videoMaxSendBandwidth: isHost ? 1000 : 0,
                videoMinSendBandwidth: isHost ? 300 : 0
            }
        };

        const token = await session.generateToken(connectionProperties);
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Permission server running on port ${PORT}`);
});
