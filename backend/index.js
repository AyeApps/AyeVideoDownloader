const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

let rawPythonUrl = process.env.PYTHON_API_URL || 'https://api-ayvddw.ayeapps.com/api/v1';

// Prevent loopback if PYTHON_API_URL was mistakenly set to the BFF's own public domain (back-ayvddw.ayeapps.com)
if (rawPythonUrl.includes('back-ayvddw.ayeapps.com')) {
    console.warn(`[WARNING] Loopback detected: PYTHON_API_URL was pointing to BFF itself (back-ayvddw.ayeapps.com). Overriding to https://api-ayvddw.ayeapps.com/api/v1`);
    rawPythonUrl = 'https://api-ayvddw.ayeapps.com/api/v1';
}

if (!rawPythonUrl.endsWith('/api/v1') && !rawPythonUrl.endsWith('/api')) {
    rawPythonUrl = `${rawPythonUrl.replace(/\/+$/, '')}/api/v1`;
}

const PYTHON_API_URL = rawPythonUrl;

// Web Backend BFF (Backend for Frontend)
// Orchestrates calls to the Python microservice and handles Web-specific logic

app.post('/api/auth/register', async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/auth/register`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Register failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const response = await axios.post(`${PYTHON_API_URL}/auth/login`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Login failed' });
    }
});

app.post('/api/formats', async (req, res) => {
    try {
        const { url } = req.body;
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }
        
        const response = await axios.post(`${PYTHON_API_URL}/formats/fetch`, { url }, {
            headers: { Authorization: authHeader }
        });
        
        return res.json(response.data);
    } catch (error) {
        console.error("Format fetch error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch formats from Railway API' });
    }
});

app.post('/api/download', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }
        
        const response = await axios.post(`${PYTHON_API_URL}/downloads/`, req.body, {
            headers: { Authorization: authHeader }
        });
        
        return res.json(response.data);
    } catch (error) {
        console.error("Download error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Download failed via Railway API' });
    }
});

app.get('/api/download/:jobId', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const { jobId } = req.params;
        const response = await axios.get(`${PYTHON_API_URL}/downloads/${jobId}`, {
            headers: authHeader ? { Authorization: authHeader } : {}
        });
        return res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch job status' });
    }
});

app.get('/api/download/:jobId/stream', async (req, res) => {
    try {
        const token = req.query.token || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : '');
        const { jobId } = req.params;

        const response = await axios({
            method: 'get',
            url: `${PYTHON_API_URL}/downloads/${jobId}/stream`,
            responseType: 'stream',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        response.data.pipe(res);
    } catch (error) {
        console.error("Stream proxy error:", error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to stream progress' });
    }
});

app.get('/api/download/:jobId/file', async (req, res) => {
    try {
        const token = req.query.token;
        const { jobId } = req.params;
        
        const response = await axios({
            method: 'get',
            url: `${PYTHON_API_URL}/downloads/${jobId}/file`,
            responseType: 'stream',
            timeout: 300000, // 5 minutos para archivos grandes
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Pasar headers importantes al cliente
        const contentDisposition = response.headers['content-disposition'] || `attachment; filename="video_${jobId}.mp4"`;
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const contentLength = response.headers['content-length'];
        
        res.setHeader('Content-Disposition', contentDisposition);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
        if (contentLength) res.setHeader('Content-Length', contentLength);
        
        response.data.pipe(res);
    } catch (error) {
        console.error("File download error:", error.message);
        res.status(error.response?.status || 500).send('File download failed');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aye Web Backend (BFF) is running on port ${PORT}`);
    console.log(`Proxying requests to Python API at ${PYTHON_API_URL}`);
});
