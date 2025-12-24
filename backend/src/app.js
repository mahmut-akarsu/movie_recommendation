const express = require('express');
const cors = require('cors');
const movies = require('../data/imdb_listesi_tr.json');
const { getRecommendationsByHistory } = require('./engine');

const app = express();
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// --- IN-MEMORY DATABASE (RAM Bellek) ---
// MVP olduğu için database yerine değişkende tutuyoruz. 
// Server kapanırsa sıfırlanır, bu kabul edilebilir.
let userLikedMovies = []; 

// 1. Filmleri Listele (Filtreleme Destekli)
app.get('/api/movies', (req, res) => {
    // Query Parametrelerini Al (Varsayılan: Sayfa 1, Limit 20)
    const genre = req.query.genre;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let result = movies;

    // 1. Önce Filtreleme (Tüm veri üzerinde)
    if (genre && genre !== 'All') {
        result = movies.filter(m => m.tags.includes(genre));
    }

    // 2. Beğeni Bilgisini Ekle (Tüm veri üzerinde)
    // Not: Gerçek DB olsaydı bunu SQL/Mongo query içinde yapardık.
    const fullResultWithLikes = result.map(m => ({
        ...m,
        isLiked: userLikedMovies.includes(m.id)
    }));

    // 3. Sayfalama (Pagination Logic)
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Sadece istenen aralığı kesip alıyoruz
    const paginatedResult = fullResultWithLikes.slice(startIndex, endIndex);

    // 4. Metadata ile Birlikte Dön
    res.json({
        data: paginatedResult,
        meta: {
            total: fullResultWithLikes.length, // Toplam kaç film var (filtreye uyan)
            page: page,
            limit: limit,
            totalPages: Math.ceil(fullResultWithLikes.length / limit)
        }
    });
});

// 2. Beğeni Ekle / Çıkar (Toggle Like)
app.post('/api/like', (req, res) => {
    const { movieId } = req.body;
    
    if (userLikedMovies.includes(movieId)) {
        // Zaten beğendiyse çıkar (Unlike)
        userLikedMovies = userLikedMovies.filter(id => id !== movieId);
    } else {
        // Beğenmediyse ekle (Like)
        userLikedMovies.push(movieId);
    }

    res.json({ success: true, currentLikes: userLikedMovies });
});

// 3. Öneri İste (AI Endpoint)
app.get('/api/recommendations', (req, res) => {
    // Backend hafızasındaki beğenilere göre hesapla
    const results = getRecommendationsByHistory(userLikedMovies);
    
    res.json(results);
});

// 4. Beğenilenleri Listele
app.get('/api/likes', (req, res) => {
    const likedList = movies.filter(m => userLikedMovies.includes(m.id));
    res.json(likedList);
});

module.exports = app;