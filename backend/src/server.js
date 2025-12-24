const app = require('./app'); // app.js'i çağır
const PORT = 5000; // Standart port

app.listen(PORT, () => {
    console.log(`🚀 Film Öneri Sistemi Backend Çalışıyor: http://localhost:${PORT}`);
    console.log(`📊 API Test: http://localhost:${PORT}/api/movies`);
});