const express = require('express');
const cors = require('cors');
const movies = require('../data/movies.json');
const { getRecommendationsByHistory } = require('./engine');

const app = express();
app.use(cors());
app.use(express.json());

// --- IN-MEMORY DATABASE (RAM Bellek) ---
// MVP olduğu için database yerine değişkende tutuyoruz. 
// Server kapanırsa sıfırlanır, bu kabul edilebilir.
let userLikedMovies = []; 

// 1. Filmleri Listele (Filtreleme Destekli)
app.get('/api/movies', (req, res) => {
    const genre = req.query.genre;
    let result = movies;
    
    // Tür Filtreleme (Hard Filter)
    if (genre && genre !== 'All') {
        result = movies.filter(m => m.tags.includes(genre));
    }
    
    // UI'da "Kalp" ikonunu dolu göstermek için beğeni bilgisini ekle
    const resultWithLikes = result.map(m => ({
        ...m,
        isLiked: userLikedMovies.includes(m.id)
    }));

    res.json(resultWithLikes);
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