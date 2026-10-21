// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// Handle Enter Key on Input
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        fetchWeatherData();
    }
}

// Generate QR Code dynamically pointing to current URL
window.onload = () => {
    let currentUrl = window.location.href;
    // Fallback demo URL if running locally (file:// protocol)
    if (currentUrl.startsWith('file://')) {
        currentUrl = "https://open-meteo.com/"; 
    }
    // Use a nice color scheme for the QR code matching the site
    document.getElementById('qrCodeImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}&color=0a192f&bgcolor=ffffff`;
};

// Main Fetch Function
async function fetchWeatherData() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
        alert("Silakan masukkan nama kota terlebih dahulu!");
        return;
    }

    // UI Loading State
    const btn = document.getElementById('searchBtn');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('btnLoader');
    const resultsGrid = document.getElementById('resultsGrid');

    btn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    resultsGrid.style.display = 'none';

    try {
        // 1. Geocoding API (Dapatkan Lat & Lon)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results) {
            throw new Error("Kota tidak ditemukan. Mohon periksa ejaan Anda.");
        }

        const lat = geoData.results[0].latitude;
        const lon = geoData.results[0].longitude;
        const namaKota = geoData.results[0].name;
        const negara = geoData.results[0].country;

        // 2. Weather API (Suhu & Kelembapan)
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`);
        const weatherData = await weatherRes.json();

        // 3. Air Quality API (AQI & PM2.5)
        const airRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5`);
        const airData = await airRes.json();

        // Ekstrak Data
        const temp = weatherData.current.temperature_2m;
        const humidity = weatherData.current.relative_humidity_2m;
        const wind = weatherData.current.wind_speed_10m;
        const aqi = airData.current.us_aqi;
        const pm25 = airData.current.pm2_5;

        // 4. Update DOM
        document.getElementById('valTemp').innerHTML = `${temp} <span>°C</span>`;
        document.getElementById('valHumidity').innerHTML = `${humidity} <span>%</span>`;
        document.getElementById('valAqi').innerText = aqi;
        document.getElementById('valLocation').innerText = `${namaKota}, ${negara}`;

        // 5. Logika Saran Kesehatan
        const aqiStatusEl = document.getElementById('aqiStatus');
        const adviceEl = document.getElementById('adviceText');
        let saran = "";

        aqiStatusEl.className = 'status-badge'; // Reset classes

        if (aqi <= 50) {
            aqiStatusEl.innerText = "BAIK (GOOD)";
            aqiStatusEl.classList.add('status-good');
            saran = "Udara sangat bersih! Sangat cocok untuk berolahraga di luar ruangan, bersepeda, atau berjalan santai bersama keluarga.";
        } else if (aqi <= 100) {
            aqiStatusEl.innerText = "SEDANG (MODERATE)";
            aqiStatusEl.classList.add('status-warn');
            saran = "Udara masih cukup aman. Namun, bagi penderita asma atau alergi, sebaiknya kurangi aktivitas fisik berat di luar ruangan.";
        } else {
            aqiStatusEl.innerText = "TIDAK SEHAT (UNHEALTHY)";
            aqiStatusEl.classList.add('status-bad');
            saran = "Peringatan! Kualitas udara buruk. Gunakan masker (KN95) jika terpaksa keluar rumah, dan nyalakan penjernih udara (air purifier) di dalam ruangan.";
        }

        // Tambahan saran berdasarkan suhu
        if (temp > 32) {
            saran += " Suhu saat ini cukup terik, pastikan tubuh tetap terhidrasi dengan minum air yang cukup.";
        } else if (temp < 20) {
            saran += " Suhu cukup dingin, gunakan pakaian hangat atau jaket agar tidak masuk angin.";
        }

        adviceEl.innerHTML = `<strong>${saran}</strong><br><br><small style="color:var(--text-light); font-size: 0.95rem;"><i class="fas fa-microscope"></i> Detail Lingkungan: Partikel PM2.5 berada di angka ${pm25} µg/m³ dengan kecepatan angin ${wind} km/jam.</small>`;

        // Tampilkan Grid
        resultsGrid.style.display = 'grid';

    } catch (error) {
        alert(error.message);
    } finally {
        // Reset UI State
        btn.disabled = false;
        btnText.style.display = 'inline';
        loader.style.display = 'none';
    }
}
