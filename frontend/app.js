const API_URL = 'http://127.0.0.1:5000/api';
let allMovies = [];
let currentFilter = 'All';

let currentPage = 1;
let isFetching = false;
let hasMore = true; // Daha yüklenecek veri var mı?


// BAŞLANGIÇ
document.addEventListener('DOMContentLoaded', async () => {
    // Tema kontrolü... (Mevcut kodlar kalsın)
    
    // Gözcü'yü Başlat (Infinite Scroll)
    setupIntersectionObserver();
    
    // İlk veriyi çek
    await loadMovies(true); // true = reset (sıfırdan yükle)
});

// 1. VERİ ÇEKME
async function fetchMovies() {
    try {
        const res = await fetch(`${API_URL}/movies`);
        allMovies = await res.json();
        renderMovies(allMovies);
        updateLikeCount();
    } catch (e) { console.error(e); }
}

async function loadMovies(reset = false) {
    // Eğer zaten yükleme yapılıyorsa veya veri bittiyse dur.
    if (isFetching || (!hasMore && !reset)) return;

    isFetching = true;
    
    // Yükleniyor animasyonunu göster
    const sentinel = document.getElementById('infinite-scroll-sentinel');
    sentinel.classList.remove('opacity-0');

    if (reset) {
        currentPage = 1;
        hasMore = true;
        document.getElementById('movies-grid').innerHTML = ''; // Listeyi temizle
        document.getElementById('end-of-list').classList.add('hidden');
    }

    try {
        // Backend'e sayfa numarası ile istek at
        const url = `${API_URL}/movies?genre=${currentFilter}&page=${currentPage}&limit=20`;
        const res = await fetch(url);
        const { data, meta } = await res.json();

        // Veriyi Ekrana Bas (Append Mode)
        renderMoviesAppend(data);

        // State Güncelleme
        allMovies = reset ? data : [...allMovies, ...data]; // Hafızayı güncelle
        
        if (data.length === 0 || currentPage >= meta.totalPages) {
            hasMore = false;
            document.getElementById('end-of-list').classList.remove('hidden');
            sentinel.classList.add('hidden'); // Gözcüyü gizle
        } else {
            currentPage++;
        }

    } catch (e) {
        console.error(e);
    } finally {
        isFetching = false;
        sentinel.classList.add('opacity-0');
    }
}


// --- APPEND RENDERING (Ekleme Yapan Render) ---
function renderMoviesAppend(movies) {
    const grid = document.getElementById('movies-grid');
    movies.forEach(movie => {
        grid.innerHTML += createCardHTML(movie);
    });
}

// --- INTERSECTION OBSERVER (Gözcü Kurulumu) ---
function setupIntersectionObserver() {
    const sentinel = document.getElementById('infinite-scroll-sentinel');
    
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
            loadMovies(false); // false = append (ekle)
        }
    }, { rootMargin: '100px' });

    observer.observe(sentinel);
}


function filterByGenre(genre) {
    currentFilter = genre;
    
    // UI Güncelleme (Buton renkleri vs. - Eski kodun aynısı)
    document.querySelectorAll('.filter-btn').forEach(btn => { /* ... */ });

    // LİSTEYİ SIFIRLA VE YENİDEN ÇEK
    loadMovies(true); 
}

function handleSort() {
    const criteria = document.getElementById('sort-select').value;
    let sorted = [...allMovies];
    
    // Grid'i temizle ve sıralanmış veriyi bas
    document.getElementById('movies-grid').innerHTML = '';
    sorted.forEach(m => document.getElementById('movies-grid').innerHTML += createCardHTML(m));
}


// 2. KART ÇİZME (Render)
function renderMovies(movies) {
    const grid = document.getElementById('movies-grid');
    grid.innerHTML = '';
    movies.forEach(movie => {
        grid.innerHTML += createCardHTML(movie);
    });
}

// 3. KART HTML (Zenginleştirilmiş)
function createCardHTML(movie, isRec = false) {
    const likeClass = movie.isLiked ? 'text-secondary fa-solid' : 'text-slate-400 fa-regular';
    // isRec (Öneri) ise farklı border rengi
    const borderClass = isRec ? 'border-primary/50 ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-800';

    return `
    <div class="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border ${borderClass} flex flex-col h-full">
        <!-- Tıklanabilir Alan (Detay için) -->
        <div onclick="openModal(${movie.id})" class="cursor-pointer relative aspect-[2/3] overflow-hidden bg-slate-800">
            <img src="${movie.poster}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                <span class="text-white font-bold tracking-widest text-sm uppercase px-4 py-2 border border-white/30 rounded-full backdrop-blur-sm">Detayları Gör</span>
            </div>
            ${isRec ? `<div class="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">%${(movie.score*100).toFixed(0)} Match</div>` : ''}
        </div>

        <div class="p-5 flex flex-col flex-grow relative">
            <div class="flex justify-between items-start mb-2">
                <h3 onclick="openModal(${movie.id})" class="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight hover:text-primary transition cursor-pointer">${movie.title}</h3>
                <span class="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded">${movie.year}</span>
            </div>
            
            <div class="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">
                <span><i class="fa-regular fa-clock mr-1"></i>${movie.runtime || 'N/A'}</span>
                <span class="text-yellow-500"><i class="fa-solid fa-star mr-1"></i>${movie.imdb_score || movie.rating}</span>
            </div>

            <!-- Like Butonu -->
            <button onclick="toggleLike(${movie.id})" class="absolute top-[-24px] right-4 w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl flex items-center justify-center hover:scale-110 transition z-10 group/btn">
                <i class="fa-heart text-xl transition ${likeClass} group-hover/btn:text-secondary"></i>
            </button>
        </div>
    </div>
    `;
}


function handleSort() {
    const criteria = document.getElementById('sort-select').value;
    let sorted = [...allMovies]; // Kopya oluştur

    // Önce mevcut filtreyi uygula
    if (currentFilter !== 'All') {
        sorted = sorted.filter(m => m.tags.includes(currentFilter));
    }

    // Sonra sırala
    switch(criteria) {
        case 'year_desc': sorted.sort((a,b) => b.year - a.year); break;
        case 'year_asc': sorted.sort((a,b) => a.year - b.year); break;
        case 'imdb_desc': sorted.sort((a,b) => (b.imdb_score || b.rating) - (a.imdb_score || a.rating)); break;
        case 'runtime_desc': 
            // "142 min" stringini sayıya çevirme
            sorted.sort((a,b) => parseInt(b.runtime) - parseInt(a.runtime)); 
            break;
    }
    renderMovies(sorted);
}

// 5. MODAL AÇMA (Detay Sayfası)
function openModal(id) {
    const movie = allMovies.find(m => m.id === id);
    if (!movie) return;

    // Verileri Doldur
    document.getElementById('modal-poster').src = movie.poster;
    document.getElementById('modal-title').innerText = movie.title;
    document.getElementById('modal-overview').innerText = movie.overview || "Özet bulunamadı.";
    document.getElementById('modal-director').innerHTML = `<i class="fa-solid fa-video mr-2"></i>${movie.director}`;
    document.getElementById('modal-runtime').innerHTML = `<i class="fa-regular fa-clock mr-2"></i>${movie.runtime}`;
    document.getElementById('modal-year').innerText = movie.year;
    document.getElementById('modal-score').innerText = movie.imdb_score || movie.rating;

    // Etiketleri Doldur
    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = movie.tags.map(tag => 
        `<span class="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700">${tag}</span>`
    ).join('');

    // Modalı Göster
    document.getElementById('movie-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Arka plan kaymasını engelle
}

function closeModal() {
    document.getElementById('movie-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// 6. TEMA DEĞİŞTİRME
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        updateThemeIcon(true);
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        updateThemeIcon(false);
    }
}

function updateThemeIcon(isLight) {
    const icon = document.getElementById('theme-icon');
    if (isLight) {
        icon.classList.remove('fa-sun', 'text-yellow-500');
        icon.classList.add('fa-moon', 'text-slate-600');
    } else {
        icon.classList.add('fa-sun', 'text-yellow-500');
        icon.classList.remove('fa-moon', 'text-slate-600');
    }
}


async function toggleLike(id) {
    await fetch(`${API_URL}/like`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({movieId: id}) });
    // Local state güncelle
    const m = allMovies.find(m => m.id === id);
    if(m) m.isLiked = !m.isLiked;
    
    // UI Güncelle (Tüm sayfayı yenilemeden)
    handleSort(); // Mevcut sıralama/filtre bozulmasın
    updateLikeCount();
    checkRecommendations();
}

async function checkRecommendations() {
    const res = await fetch(`${API_URL}/recommendations`);
    const data = await res.json();
    const section = document.getElementById('recommendation-section');
    const grid = document.getElementById('recommendation-grid');
    
    if (data.length > 0) {
        section.classList.remove('hidden');
        grid.innerHTML = data.map(m => createCardHTML(m, true)).join('');
    } else {
        section.classList.add('hidden');
    }
}

function filterByGenre(genre) {
    currentFilter = genre;
    // Buton stilleri güncelleme (Daha önceki gibi)
    handleSort(); // Filtre + Sıralama uygula
}

function updateLikeCount() {
    document.getElementById('like-count').innerText = allMovies.filter(m => m.isLiked).length;
}



function showLikesModal() {
    const modal = document.getElementById('likes-modal');
    const grid = document.getElementById('liked-movies-grid');
    const emptyState = document.getElementById('empty-likes-state');
    
    // 1. Beğenilenleri Filtrele
    const likedMovies = allMovies.filter(m => m.isLiked);

    // 2. İçeriği Temizle
    grid.innerHTML = '';

    // 3. Duruma Göre Render Et
    if (likedMovies.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
    } else {
        grid.classList.remove('hidden');
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        likedMovies.forEach(movie => {
            grid.innerHTML += createCardHTML(movie);
        });
    }

    // 4. Modalı Göster
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Arka planı kilitle
}

function closeLikesModal() {
    const modal = document.getElementById('likes-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Kaydırmayı aç
}