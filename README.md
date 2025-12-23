
---

# 🎬 Film Öneri Sistemi - Backend Servisi (Faz 3 MVP)

Bu proje, **Yazılım Kalite Standartları** dersi kapsamında geliştirilen **Akıllı Film Öneri Sistemi**nin Backend servisidir.

Sistem, **Node.js** ve **Express** üzerinde çalışmakta olup, veri tabanı gereksinimi olmadan (In-Memory) çalışacak şekilde tasarlanmıştır. Öneri motoru, **İçerik Tabanlı Filtreleme (Content-Based Filtering)** ve **Kosinüs Benzerliği (Cosine Similarity)** algoritmalarını kullanır.

---

## 🚀 Kurulum ve Başlatma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Ön Hazırlık
*   Bilgisayarınızda **Node.js** yüklü olmalıdır.

### 2. Bağımlılıkların Yüklenmesi
Terminali açın ve proje klasörüne giderek komutu çalıştırın:
```bash
npm install
```

### 3. Sunucuyu Başlatma
```bash
npm start
```
*   Sunucu şu adreste çalışmaya başlayacaktır: `http://localhost:3000`
*   Konsol Çıktısı: `🚀 Film Öneri Sistemi Backend Çalışıyor`

---

## 📡 API Dokümantasyonu

Backend servisi, Frontend uygulaması ile iletişim kurmak için aşağıdaki 4 temel uç noktayı (endpoint) sunar.

### 1. Film Listesi ve Filtreleme
Tüm filmleri listeler veya türe göre filtreler.

*   **URL:** `/api/movies`
*   **Method:** `GET`
*   **Query Param:** `?genre=Sci-Fi` (Opsiyonel: Türe göre filtreler. Boş bırakılırsa hepsi gelir.)
*   **Örnek Yanıt:**
```json
[
  {
    "id": 1,
    "title": "Inception",
    "tags": ["Sci-Fi", "Action"],
    "rating": 8.8,
    "isLiked": false  // Kullanıcı bu filmi beğendi mi?
  },
  ...
]
```

### 2. Beğeni İşlemi (Toggle Like)
Kullanıcının bir filmi beğenmesini veya beğenisini geri almasını sağlar.

*   **URL:** `/api/like`
*   **Method:** `POST`
*   **Body (JSON):**
```json
{
  "movieId": 1
}
```
*   **Açıklama:** Eğer film daha önce beğenilmişse listeden çıkarır (Unlike), beğenilmemişse ekler (Like).

### 3. Öneri Sistemi
Kullanıcının beğeni geçmişine dayanarak matematiksel olarak en benzer filmleri önerir.

*   **URL:** `/api/recommendations`
*   **Method:** `GET`
*   **Mantık:** Kullanıcının beğendiği filmlerin vektörleri ile diğer filmler arasındaki **Kosinüs Benzerliği** hesaplanır.
*   **Şeffaflık (Transparency):** Yanıt, önerinin neden yapıldığını içerir.
*   **Örnek Yanıt:**
```json
[
  {
    "id": 2,
    "title": "The Matrix",
    "score": "0.82",             // Benzerlik Oranı (0.0 - 1.0)
    "reason": ["Sci-Fi", "Action"] // Eşleşen Etiketler
  },
  ...
]
```

### 4. Beğenilen Filmler
Kullanıcının beğendiği filmlerin listesini döner.

*   **URL:** `/api/likes`
*   **Method:** `GET`

---

## 🧪 Test ve Kalite Güvencesi (QA)

Bu proje, **ISO/IEC 25010** standartları gereği **Fonksiyonel Doğruluk** ve **Güvenilirlik** testlerine tabidir. Testler **Jest** kütüphanesi ile yazılmıştır.

### Testlerin Amacı Nedir?
1.  **Matematiksel Doğruluk:** Vektör benzerlik algoritmasının (Cosine Similarity) doğru hesap yaptığını kanıtlamak.
2.  **Veri Bütünlüğü:** Film etiketlerinin doğru şekilde sayısal vektörlere dönüştürüldüğünü doğrulamak.
3.  **İş Mantığı:** Kullanıcıya, zaten izlediği bir filmin tekrar önerilmediğini garanti altına almak.

### Testleri Çalıştırma
Otomatik testleri başlatmak için terminalde şu komutu çalıştırın:

```bash
npm test
```

### Beklenen Çıktı
Başarılı bir test süreci sonunda terminalde **"PASS"** ibaresi ve yeşil onay işaretleri görülmelidir.

```text
 PASS  tests/engine.test.js
  AI Engine Unit Tests
    ✓ Benzer iki vektörün skoru 1.0 olmalı (2 ms)
    ✓ Tamamen farklı vektörlerin skoru 0 olmalı (1 ms)
    ✓ Kısmen benzer vektörler mantıklı skor üretmeli (1 ms)
    ✓ Öneri mantığı izlenen filmleri filtrelemeli (1 ms)
```

---

## 📂 Proje Mimarisi

```text
backend/
├── data/
│   └── movies.json       # Veri Seti (Single Source of Truth)
├── src/
│   ├── app.js            # API Yönlendirmeleri (Routes)
│   ├── engine.js         # AI Algoritma Çekirdeği (Logic Layer)
│   └── server.js         # Sunucu Başlatıcı
├── tests/
│   └── engine.test.js    # Birim Testleri
└── package.json
```