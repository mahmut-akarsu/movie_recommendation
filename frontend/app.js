const API_URL = 'http://127.0.0.1:5000/api';
let allMovies = [];

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    await fetchMovies();
    
    // Yükleme ekranını kaldır
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
        }, 500);
    }, 800);
});



// 1. Filmleri Getir
//buraya bakım yapılacak
async function fetchMovies(genre = 'All') {
    try {
        const url =
          genre === 'All'
            ? `${API_URL}/movies`
            : `${API_URL}/movies?genre=${encodeURIComponent(genre)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        allMovies = await response.json();
        renderMovies(allMovies);
        updateLikeCount();
    } catch (error) {
        console.error("Bağlantı Hatası:", error);
    }
}


// 2. Kartları Ekrana Bas (Modern Tasarım Şablonu Burada)
function renderMovies(movies) {
    const grid = document.getElementById('movies-grid');
    grid.innerHTML = '';

    movies.forEach(movie => {
        const card = createMovieCard(movie);
        grid.innerHTML += card;
    });
}

// 3. Tekil Kart Tasarımı (HTML Template)
// Buradaki class'lar estetiği sağlayan kısımdır.
function createMovieCard(movie, isRecommendation = false) {
    const likeClass = movie.isLiked ? 'text-rose-500 fa-solid' : 'text-slate-400 fa-regular';
    const borderClass = isRecommendation ? 'border border-primary/30 shadow-primary/10' : 'border border-slate-800 hover:border-slate-600';
    
    // Şeffaflık Rozeti (Sadece önerilerde çıkar)
    const matchBadge = isRecommendation 
        ? `<div class="absolute top-3 left-3 bg-dark/80 backdrop-blur-md px-3 py-1 rounded-full border border-primary/30 flex items-center gap-2">
             <i class="fa-solid fa-wand-magic-sparkles text-primary text-xs"></i>
             <span class="text-xs font-bold text-white">%${(movie.score * 100).toFixed(0)} Match</span>
           </div>`
        : '';

    return `
        <div class="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${borderClass}">
            
            ${matchBadge}

            <!-- Poster Alanı -->
            <div class="relative aspect-[2/3] overflow-hidden">
                <img src="${movie.poster}" alt="${movie.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
            </div>

            <!-- İçerik Alanı -->
            <div class="p-5 relative">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-bold text-white leading-tight line-clamp-1">${movie.title}</h3>
                    <div class="flex items-center gap-1 text-amber-400 text-sm font-bold">
                        <i class="fa-solid fa-star"></i>
                        <span>${movie.imdb_score}</span>
                    </div>
                </div>
                
                <p class="text-sm text-slate-400 mb-4 font-medium">${movie.year} • ${movie.director}</p>
                
                <div class="flex flex-wrap gap-2 mb-4">
                    ${movie.tags.slice(0, 3).map(tag => `<span class="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-slate-700 text-slate-300">${tag}</span>`).join('')}
                </div>

                <!-- Like Butonu (Sağ altta yüzen buton) -->
                <button onclick="toggleLike(${movie.id})" class="absolute -top-6 right-4 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 shadow-xl flex items-center justify-center hover:bg-white hover:scale-110 transition group/btn">
                    <i class="fa-heart text-xl transition ${likeClass} group-hover/btn:text-rose-500"></i>
                </button>
            </div>
        </div>
    `;
}

// 4. Beğeni Fonksiyonu (Backend'e POST atar)
async function toggleLike(movieId) {
    try {
        const res = await fetch(`${API_URL}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieId })
        });
        const data = await res.json();
        
        if(data.success) {
            // Arayüzü güncelle (Sayfayı yenilemeden)
            updateUI(movieId); 
            fetchRecommendations(); // Beğeni değişti, önerileri yenile!
        }
    } catch (error) {
        console.error(error);
    }
}

// 5. UI Güncelleme (Optimistik güncelleme)
function updateUI(movieId) {
    // Ana listedeki filmi bul ve durumunu değiştir
    const movie = allMovies.find(m => m.id === movieId);
    if(movie) movie.isLiked = !movie.isLiked;
    
    // Tüm kartları yeniden çiz (Basit yöntem)
    renderMovies(allMovies);
    updateLikeCount();
}

// 6. Önerileri Getir (AI Endpoint)
async function fetchRecommendations() {
    const res = await fetch(`${API_URL}/recommendations`);
    const recommendations = await res.json();
    
    const recSection = document.getElementById('recommendation-section');
    const recGrid = document.getElementById('recommendation-grid');
    
    if(recommendations.length > 0) {
        recSection.classList.remove('hidden');
        recGrid.innerHTML = '';
        recommendations.forEach(movie => {
            recGrid.innerHTML += createMovieCard(movie, true);
        });
    } else {
        recSection.classList.add('hidden');
    }
}

// 7. Filtreleme (Frontend tarafında style class değişimi)
function filterByGenre(genre) {
    // Buton stillerini güncelle
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white', 'shadow-lg');
        btn.classList.add('bg-slate-800', 'text-slate-400');
        if(btn.innerText.includes(genre === 'All' ? 'Tümü' : genre)) { // Basit eşleştirme
            btn.classList.remove('bg-slate-800', 'text-slate-400');
            btn.classList.add('bg-primary', 'text-white', 'shadow-lg');
        }
    });

    // Veriyi yeniden çek
    fetchMovies(genre);
}

// Yardımcı: Beğeni Sayısını Güncelle
function updateLikeCount() {
    const count = allMovies.filter(m => m.isLiked).length;
    document.getElementById('like-count').innerText = count;
}