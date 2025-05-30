# Topluluk Soru-Cevap Sistemi

Bu proje React Native ve Expo kullanılarak geliştirilmiş bir hayvan sahipleri topluluk uygulamasıdır. Topluluk modülü ile kullanıcılar soru sorabilir ve cevap verebilir.

## 📱 Özellikler

### 1. Ana Topluluk Sayfası (`/community`)
- **Yeni Soru Oluştur** butonu (gradient tasarım)
- Tüm soruların listelenmesi
- Her soru kartında:
  - Soru başlığı
  - Soru sahibinin adı
  - Soru önizlemesi
  - Cevap sayısı
  - "Soruyu Gör" butonu

### 2. Gelişmiş Soru Oluşturma Formu
- **Konu Seçimi**: 12 farklı kategori seçeneği
  - Köpek Eğitimi ve Psikolojisi
  - Köpek Irkları, Bakımı, Beslenmesi
  - Kedi Irkları, Bakımı, Genel Konular
  - Kemirgenler, Sürüngenler, Kuşlar
  - Akvaryum ve Balık Konuları
- **Breadcrumb** navigasyon
- **Gelişmiş form** validasyonu
- **Fotoğraf yükleme** ve **anket oluşturma** seçenekleri
- **Responsive dropdown** menü

### 3. Soru Detay Sayfası (`/question-detail`)
- Soru başlığı ve detayı
- Soru sahibi bilgisi
- Tüm cevapların listelenmesi
- Cevap verme formu (giriş yapmış kullanıcılar için)
- Giriş yapmamış kullanıcılar için giriş yönlendirmesi

### 4. Kimlik Doğrulama
- AsyncStorage kullanarak kullanıcı oturumu kontrol edilir
- Giriş yapmamış kullanıcılar soru soramaz ve cevap veremez
- Otomatik giriş sayfasına yönlendirme

## 🛠 Teknik Detaylar

### Dosya Yapısı
```
app/
├── (tabs)/
│   └── community.tsx          # Ana topluluk sayfası
├── question-detail.tsx        # Soru detay sayfası
services/
└── communityService.ts        # API servisleri
```

### API Endpoints
- `GET /api/questions` - Tüm soruları getir
- `GET /api/questions/{id}` - Belirli soruyu getir
- `POST /api/questions` - Yeni soru oluştur
- `GET /api/answers?questionId={id}` - Soruya ait cevapları getir
- `POST /api/answers` - Yeni cevap oluştur

### Kullanılan Teknolojiler
- **React Native** - Mobile framework
- **Expo Router** - Navigation
- **TypeScript** - Type safety
- **AsyncStorage** - Local storage
- **LinearGradient** - UI enhancements
- **Picker** - Dropdown component

## 🎨 Tasarım Anlayışı

### Renk Paleti
- **Ana Renk**: `#AB75C2` (Ana mor renk)
- **İkincil Renk**: `#9B6BB0` (Gradient mor)
- **Metin Renkleri**: `#1F2937`, `#6B7280`, `#9CA3AF`
- **Arka Plan**: `#FFFFFF`, `#F8F9FA`
- **Başlık Alt Rengi**: `#F3E5F5`

### UI Bileşenleri
- **Kartlar**: Gölgeli, 16px yuvarlak köşeli beyaz kartlar
- **Butonlar**: Gradient arka planlı, yuvarlak köşeli
- **Modal**: Alt taraftan açılan, şeffaf overlay (%95 height)
- **Form**: Modern kenarlıklı input alanları
- **Dropdown**: Özel tasarım dropdown menü

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+
- Expo CLI
- Android Studio / Xcode (mobil test için)

### Kurulum Adımları
```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm start

# Android için
npm run android

# iOS için
npm run ios
```

### Backend Yapılandırması
`services/communityService.ts` dosyasında `BASE_URL` değerini backend sunucunuzun adresine göre ayarlayın:

```typescript
const BASE_URL = 'http://localhost:8080'; // Yerel geliştirme
// const BASE_URL = 'https://api.yourapp.com'; // Production
```

## 📝 Kullanım Senaryoları

### Yeni Soru Sormak
1. Topluluk sayfasında gradient "Yeni Soru Oluştur" butonuna tıklayın
2. Giriş yapmadıysanız giriş sayfasına yönlendirilirsiniz
3. Modal açılır:
   - **Konu seçimi**: Dropdown'dan uygun kategoriyi seçin
   - **Soru başlığı**: Sorunuzu özetleyin
   - **Detay**: Sorunuzu detaylı açıklayın
   - İsteğe bağlı: Fotoğraf veya anket ekleyin
4. "Sor" butonuna tıklayın
5. Başarılı mesajı sonrası soru listeye eklenir

### Soruya Cevap Vermek
1. Soru kartına tıklayarak detay sayfasına gidin
2. Sayfanın altındaki cevap yazma alanını kullanın
3. Giriş yapmadıysanız giriş yapmanız istenir
4. Cevabınızı yazıp "Cevabı Gönder" butonuna tıklayın
5. Cevabınız anında listeye eklenir

## 🔧 Özelleştirme

### Stil Değişiklikleri
Stil dosyaları her component içinde `StyleSheet.create()` ile tanımlanmıştır. Ana renk şemasını değiştirmek için:

```typescript
// Ana renkler
const primaryColor = '#AB75C2';
const secondaryColor = '#9B6BB0';
const textColor = '#1F2937';
const backgroundColor = '#F8F9FA';
```

### Konu Kategorilerini Düzenleme
`community.tsx` dosyasında `topicOptions` arrayini düzenleyerek kategorileri özelleştirebilirsiniz:

```typescript
const topicOptions = [
  { label: 'Yeni Kategori', value: 'yeni-kategori' },
  // ... diğer kategoriler
];
```

### API Customization
`communityService.ts` dosyasında API endpoint'leri ve veri yapıları özelleştirilebilir.

## 🐛 Sorun Giderme

### Yaygın Sorunlar
1. **AsyncStorage errors**: React Native AsyncStorage kurulu olduğundan emin olun
2. **Navigation errors**: Expo Router doğru kurulumunu kontrol edin
3. **API connection**: Backend sunucunuzun çalıştığından emin olun
4. **Dropdown rendering**: zIndex sorunları için modal overlay kontrol edin

### Debug İpuçları
```bash
# Metro bundler temizleme
npx expo start --clear

# iOS simulator sıfırlama
npx expo start --ios --clear

# Android cache temizleme
npx expo start --android --clear
```

## 📱 Ekran Görüntüleri

### Ana Sayfa
- Modern gradient header (#AB75C2 → #9B6BB0)
- Gradient "Yeni soru oluştur" butonu
- Modern soru kartları listesi
- Loading ve empty state'ler

### Yeni Soru Formu
- Breadcrumb navigasyon
- Konu seçimi dropdown
- Gelişmiş form alanları
- Fotoğraf/anket ekleme butonları

### Soru Detayı
- Soru bilgileri
- Cevap listesi
- Cevap verme formu
- Geri buton ile navigasyon

## 🎯 Öne Çıkan Özellikler

### Responsive Tasarım
- Tüm cihaz boyutlarında uyumlu
- Modern card-based layout
- Smooth animasyonlar

### Kullanıcı Deneyimi
- Intuitive navigation
- Smart form validation
- Real-time feedback
- Error handling

### Performance
- Optimized FlatList rendering
- Efficient API calls
- Memory management

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 