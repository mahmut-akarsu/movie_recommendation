const { calculateCosineSimilarity, createVector, getRecommendationsByHistory } = require('../src/engine');
// Testlerin veri setine bağımlı olmaması için mock data kullanılabilir 
// ancak MVP'de gerçek movies.json üzerinden test etmek süreci hızlandırır.
const movies = require('../data/movies.json'); 

describe('FILM ÖNERİ MOTORU TEST SUITE', () => {

    // ----------------------------------------------------------------
    // BÖLÜM 1: MATEMATİKSEL ÇEKİRDEK (Unit Tests - Math Core)
    // Amacı: Kosinüs benzerliği formülünün hatasız çalıştığını kanıtlamak.
    // ----------------------------------------------------------------
    describe('1. Matematiksel Hesaplama (Cosine Similarity)', () => {
        
        test('Birebir aynı vektörler için skor 1.0 (veya çok yakın) olmalı', () => {
            const vecA = [1, 1, 0, 1];
            const vecB = [1, 1, 0, 1];
            expect(calculateCosineSimilarity(vecA, vecB)).toBeCloseTo(1.0);
        });

        test('Tamamen zıt vektörler için skor 0 olmalı', () => {
            const vecA = [1, 1, 0, 0];
            const vecB = [0, 0, 1, 1];
            expect(calculateCosineSimilarity(vecA, vecB)).toBe(0);
        });
        
        test('Kısmen benzer vektörler mantıklı bir ondalık skor üretmeli', () => {
            // A: [1, 1, 0] (Büyüklük: sqrt(2))
            // B: [1, 0, 1] (Büyüklük: sqrt(2))
            // Dot: 1*1 = 1
            // Beklenen: 1 / 2 = 0.5
            const vecA = [1, 1, 0];
            const vecB = [1, 0, 1];
            expect(calculateCosineSimilarity(vecA, vecB)).toBeCloseTo(0.5);
        });

        test('Sıfır vektörü (etiketsiz film) ile işlem yapıldığında NaN dönmemeli, 0 dönmeli', () => {
            // ISO Güvenilirlik Testi: Bölme işleminde 0 hatası (Division by Zero) kontrolü
            const vecA = [0, 0, 0];
            const vecB = [1, 1, 1];
            expect(calculateCosineSimilarity(vecA, vecB)).toBe(0);
        });
    });

    // ----------------------------------------------------------------
    // BÖLÜM 2: VEKTÖRLEŞTİRME (Unit Tests - Vectorization)
    // Amacı: Film etiketlerinin doğru şekilde 1 ve 0'a dönüştüğünü doğrulamak.
    // ----------------------------------------------------------------
    describe('2. Veri Dönüşümü ve Vektörleştirme', () => {
        
        test('Vektör uzunluğu, evrensel etiket sayısı ile aynı olmalı', () => {
            // Veri setinden rastgele bir filmi alıp test edelim
            const sampleMovie = movies[0]; 
            const vector = createVector(sampleMovie.tags);
            
            // Corpus'taki toplam unique tag sayısını bulalım (engine.js mantığıyla aynı)
            const allTags = [...new Set(movies.flatMap(m => m.tags))];
            
            expect(vector.length).toBe(allTags.length);
        });

        test('Vektör sadece 0 ve 1 değerlerini içermeli', () => {
            const sampleMovie = movies[0];
            const vector = createVector(sampleMovie.tags);
            
            // Dizide 0 veya 1 harici bir şey var mı?
            const isValid = vector.every(val => val === 0 || val === 1);
            expect(isValid).toBe(true);
        });
    });

    // ----------------------------------------------------------------
    // BÖLÜM 3: ÖNERİ MANTIĞI (Integration Tests - Business Logic)
    // Amacı: Sistemin doğru filmleri önerdiğini ve kurallara uyduğunu doğrulamak.
    // ----------------------------------------------------------------
    describe('3. Öneri Senaryoları (Recommendation Logic)', () => {

        test('Hiçbir film beğenilmediyse boş liste dönmeli', () => {
            const history = []; // Boş beğeni geçmişi
            const result = getRecommendationsByHistory(history);
            expect(result).toEqual([]);
        });

        test('Beğenilen film, öneri listesinde ASLA yer almamalı (Filtreleme Kontrolü)', () => {
            // Kullanıcı ID:1 (Inception) filmini beğendi diyelim
            const likedId = 1; 
            const history = [likedId];
            
            const results = getRecommendationsByHistory(history);
            
            // Sonuçların içinde ID:1 var mı?
            const containsLikedMovie = results.some(m => m.id === likedId);
            expect(containsLikedMovie).toBe(false);
        });

        test('Öneriler, Benzerlik Skoruna göre büyükten küçüğe sıralanmalı', () => {
            // Inception (Sci-Fi) beğenildiğinde
            const history = [1];
            const results = getRecommendationsByHistory(history);

            // İlk önerinin puanı, ikinci öneriden büyük veya eşit olmalı
            if (results.length >= 2) {
                const firstScore = parseFloat(results[0].score);
                const secondScore = parseFloat(results[1].score);
                expect(firstScore).toBeGreaterThanOrEqual(secondScore);
            }
        });

        test('Şeffaflık verisi (Reason/Score) her sonuçta bulunmalı', () => {
            const history = [1];
            const results = getRecommendationsByHistory(history);
            
            // Dönen her objede 'score' ve 'reason' alanı var mı?
            results.forEach(movie => {
                expect(movie).toHaveProperty('score');
                expect(movie).toHaveProperty('reason');
            });
        });
    });
})