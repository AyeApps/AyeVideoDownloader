const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'https://ayevideodownloader-production.up.railway.app/api/v1';

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
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch formats from Railway API' });
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
        res.status(error.response?.status || 500).json({ error: 'Download failed via Railway API' });
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

app.get('/api/download/:jobId/file', async (req, res) => {
    try {
        const token = req.query.token;
        const { jobId } = req.params;
        
        const response = await axios({
            method: 'get',
            url: `${PYTHON_API_URL}/downloads/${jobId}/file`,
            responseType: 'stream',
            headers: { Authorization: `Bearer ${token}` }
        });
        
        res.setHeader('Content-Disposition', response.headers['content-disposition'] || `attachment; filename="video_${jobId}.mp4"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        
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
