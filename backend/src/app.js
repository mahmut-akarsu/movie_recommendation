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
    const genre = req.query.genre;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search; 

    let result = movies;

    if (search) {
        const term = search.toLowerCase();
        result = result.filter(m => m.title.toLowerCase().includes(term));
    }

    // Filtreleme
    if (genre && genre !== 'All') {
        result = movies.filter(m => m.tags.includes(genre));
    }

    // MAPLEME (Resim Optimizasyonu Burada)
    // w500 (büyük) yerine w185 (küçük) linki üretiyoruz
    const optimizedResult = result.map(m => ({
        ...m,
        isLiked: userLikedMovies.includes(m.id),
        // Ana poster (w500) kalsın (Detay için)
        poster: m.poster, 
        // Liste için optimize edilmiş küçük resim (w185)
        thumbnail: m.poster.replace('/w500/', '/w185/').replace('/original/', '/w185/') 
    }));

    // Sayfalama
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResult = optimizedResult.slice(startIndex, endIndex);

    res.json({
        data: paginatedResult,
        meta: {
            total: optimizedResult.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(optimizedResult.length / limit)
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