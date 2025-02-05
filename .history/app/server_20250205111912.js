const express = require('express');
const { OpenVidu } = require('openvidu-node-client');
const app = express();

const OPENVIDU_URL = 'https://localhost:4443';
const OPENVIDU_SECRET = 'MY_SECRET';

const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

app.use(express.json());

// Rota para criar uma nova sessão de broadcasting
app.post('/api/sessions', async (req, res) => {
    try {
        const session = await openvidu.createSession();
        res.json({ sessionId: session.sessionId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para gerar token (para broadcaster ou viewer)
app.post('/api/sessions/:sessionId/connections', async (req, res) => {
    const { sessionId } = req.params;
    const { role } = req.body; // 'PUBLISHER' ou 'SUBSCRIBER'

    try {
        const session = openvidu.activeSessions.find(s => s.sessionId === sessionId);
        if (!session) {
            throw new Error('Sessão não encontrada');
        }

        const connection = await session.createConnection({
            role: role,
            data: JSON.stringify({ clientData: role === 'PUBLISHER' ? 'broadcaster' : 'viewer' })
        });

        res.json({ token: connection.token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
}); 