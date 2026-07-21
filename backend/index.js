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
        
        const response = await axios.post(`${PYTHON_API_URL}/downloads`, req.body, {
            headers: { Authorization: authHeader }
        });
        
        return res.json(response.data);
    } catch (error) {
        console.error("Download error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Download failed via Railway API' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Aye Web Backend (BFF) is running on port ${PORT}`);
    console.log(`Proxying requests to Python API at ${PYTHON_API_URL}`);
});
