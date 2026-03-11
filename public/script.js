document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('scrapeForm');
    const btnScrape = document.getElementById('btnScrape');
    const btnText = document.getElementById('btnText');
    const loadingRing = document.getElementById('loadingRing');
    
    const resultBox = document.getElementById('resultBox');
    const btnDownload = document.getElementById('btnDownload');
    
    const errorBox = document.getElementById('errorBox');
    const errorMsg = document.getElementById('errorMsg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const url = document.getElementById('targetUrl').value;
        const renameAssets = document.getElementById('optRename').checked;
        const saveStructure = document.getElementById('optStructure').checked;

        setLoading(true);
        resultBox.classList.add('hidden');
        errorBox.classList.add('hidden');

        try {
            // Tembak API Backend Vercel
            const response = await fetch('/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    options: {
                        smartGenerate: renameAssets, // Mapping sesuai backend yg kita buat sblmnya
                        multiSync: saveStructure
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Gagal mengekstrak website.');
            if (data.error && data.error.code !== 0) throw new Error(data.error.text);

            // Berhasil
            btnDownload.href = data.downloadUrl || '#';
            resultBox.classList.remove('hidden');

        } catch (error) {
            // Gagal
            console.error(error);
            errorMsg.innerText = error.message;
            errorBox.classList.remove('hidden');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            btnScrape.disabled = true;
            btnText.innerHTML = '';
            loadingRing.classList.remove('hidden');
        } else {
            btnScrape.disabled = false;
            btnText.innerHTML = 'Mulai Scraping <i class="fas fa-arrow-right"></i>';
            loadingRing.classList.add('hidden');
        }
    }
});
