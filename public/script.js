document.addEventListener('DOMContentLoaded', () => {
    // Sesuaikan ID dengan HTML baru (automationForm)
    const form = document.getElementById('automationForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('resultArea');
    const errorArea = document.getElementById('errorArea');
    const errorText = document.getElementById('errorText');
    const downloadLink = document.getElementById('downloadLink');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Ambil data dari input ID yang baru
        const projectUrl = document.getElementById('projectInput').value;
        const smartGenerate = document.getElementById('smartGenerate').checked;
        const multiSync = document.getElementById('multiSync').checked;

        // 2. Set UI ke mode Loading
        setLoading(true);
        resultArea.classList.add('hidden');
        errorArea.classList.add('hidden');

        try {
            // 3. Kirim request ke Backend
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: projectUrl,
                    options: {
                        smartGenerate,
                        multiSync
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initialize creative workflow.');
            }

            if (data.error && data.error.code !== 0) {
                 throw new Error(data.error.text);
            }

            // 4. Sukses
            downloadLink.href = data.downloadUrl || '#';
            resultArea.classList.remove('hidden');

        } catch (error) {
            // 5. Error
            console.error(error);
            errorText.innerText = error.message;
            errorArea.classList.remove('hidden');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            // Menggunakan bahasa Inggris agar sesuai tema baru
            btnText.innerHTML = 'Processing...'; 
            loader.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            // Menggunakan innerHTML agar icon FontAwesome tetap muncul
            btnText.innerHTML = 'Start Automating <i class="fas fa-arrow-right"></i>';
            loader.classList.add('hidden');
        }
    }
});