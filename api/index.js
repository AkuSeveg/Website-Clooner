// api/index.js
const axios = require('axios');

// Fungsi utama (Diubah namanya agar sesuai tema CreativeFlow)
async function runCreativeWorkflow(projectUrl, options = {}) {
    try {
        if (!projectUrl) throw new Error('Project URL is required');
        const targetUrl = projectUrl.startsWith('https://') || projectUrl.startsWith('http://') 
            ? projectUrl 
            : `https://${projectUrl}`;
        
        // 1. Tangkap opsi dari Frontend (CreativeFlow)
        const {
            smartGenerate = false,
            multiSync = false
        } = options;

        // 2. Mapping ke parameter yang dibutuhkan oleh API pihak ketiga
        const renameAssets = smartGenerate;
        const saveStructure = multiSync;
        
        // 3. Request inisiasi proses
        const initResponse = await axios.post('https://copier.saveweb2zip.com/api/copySite', {
            url: targetUrl,
            renameAssets,
            saveStructure,
            alternativeAlgorithm: false,
            mobileVersion: false
        }, {
            headers: {
                'accept': '*/*',
                'content-type': 'application/json',
                'origin': 'https://saveweb2zip.com',
                'referer': 'https://saveweb2zip.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // Ambil MD5 hash untuk tracking progress
        const taskId = initResponse.data.md5;
        if (!taskId) throw new Error("Gagal menginisiasi workflow.");
        
        // 4. Polling status (Menunggu proses selesai)
        let attempts = 0;
        const maxAttempts = 55; // Vercel timeout limit protection (~55 detik)

        while (attempts < maxAttempts) {
            const statusResponse = await axios.get(`https://copier.saveweb2zip.com/api/getStatus/${taskId}`, {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'origin': 'https://saveweb2zip.com',
                    'referer': 'https://saveweb2zip.com/',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            
            const processData = statusResponse.data;

            if (processData.isFinished) {
                 return {
                    url: targetUrl,
                    error: {
                        text: processData.errorText,
                        code: processData.errorCode,
                    },
                    copiedFilesAmount: processData.copiedFilesAmount,
                    // Pastikan menggunakan taskId yang valid dari awal
                    downloadUrl: `https://copier.saveweb2zip.com/api/downloadArchive/${taskId}`
                };
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error("Timeout: Proses terlalu lama untuk eksekusi serverless.");

    } catch (error) {
        // Tangani error spesifik dari Axios jika ada
        if (error.response && error.response.data) {
            throw new Error(error.response.data.error || 'Terjadi kesalahan pada server pihak ketiga.');
        }
        throw error;
    }
}

// Handler untuk Vercel Serverless Function
module.exports = async (req, res) => {
    // Enable CORS (Sangat penting agar Frontend bisa menembak API ini)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url, options } = req.body;
        // Panggil fungsi utama kita
        const result = await runCreativeWorkflow(url, options);
        // FIX: Typo "re\nsult" diperbaiki menjadi "result"
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};