const movies = require('../data/imdb_listesi_tr.json');

// 1. ADIM: Evrensel Etiket Kümesini (Corpus) Oluştur
const allTags = [...new Set(movies.flatMap(movie => movie.tags))];

// Vektör Oluşturucu
function createVector(movieTags) {
    return allTags.map(tag => movieTags.includes(tag) ? 1 : 0);
}

// Kosinüs Benzerliği (Matematik Çekirdeği)
function calculateCosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
}

// --- YENİ EKLENEN ÖZELLİK: LİSTE BAZLI ÖNERİ ---
// Kullanıcının beğendiği ID'leri alır, öneri üretir
function getRecommendationsByHistory(likedMovieIds) {
    // 1. Beğenilen filmlerin objelerini bul
    const likedMovies = movies.filter(m => likedMovieIds.includes(m.id));
    if (likedMovies.length === 0) return [];

    // 2. Kullanıcı Profil Vektörü Oluştur (Basitçe son beğenilen filmi referans alıyoruz - MVP için en güvenlisi)
    // Not: Gelişmiş versiyonda vektörlerin ortalaması alınabilir.
    const lastLiked = likedMovies[likedMovies.length - 1]; 
    const targetVector = createVector(lastLiked.tags);

    // 3. Hesaplama
    const recommendations = movies
        .filter(m => !likedMovieIds.includes(m.id)) // Zaten beğendiklerini listeden çıkar
        .map(movie => {
            const currentVector = createVector(movie.tags);
            const score = calculateCosineSimilarity(targetVector, currentVector);
            
            // Şeffaflık (Transparency) için nedenini bul (Ortak etiketler)
            const commonTags = movie.tags.filter(tag => lastLiked.tags.includes(tag));
            
            return { 
                ...movie, 
                score: parseFloat(score.toFixed(2)),
                reason: commonTags // UI'da göstermek için
            };
        })
        .filter(m => m.score > 0) // Hiç benzemeyenleri at (Threshold)
        .sort((a, b) => b.score - a.score) // En yüksek puanlı en üste
        .slice(0, 3); // İlk 3

    return recommendations;
}

module.exports = { getRecommendationsByHistory, createVector, calculateCosineSimilarity };