# Topluluk Soru-Cevap Sistemi

Bu proje React Native  kullanılarak geliştirilmiş bir hayvan sahipleri topluluk uygulamasıdır. Topluluk modülü ile kullanıcılar soru sorabilir ve cevap verebilir.

## 📱 Özellikler

### 1. Ana Topluluk Sayfası (`/community`)
- **Yeni Soru Oluştur** butonu
- Tüm soruların listelenmesi
- Her soru kartında:
  - Soru başlığı
  - Soru sahibinin adı
  - Soru önizlemesi
  - Cevap sayısı
  - "Soruyu Gör" butonu

### 2. Soru Detay Sayfası (`/question-detail`)
- Soru başlığı ve detayı
- Soru sahibi bilgisi
- Tüm cevapların listelenmesi
- Cevap verme formu (giriş yapmış kullanıcılar için)
- Giriş yapmamış kullanıcılar için giriş yönlendirmesi

### 3. Kimlik Doğrulama
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

## 🎨 Tasarım Anlayışı

### Renk Paleti
- **Ana Renk**: `#667eea` (Mor-mavi gradient)
- **İkincil Renk**: `#764ba2` (Koyu mor)
- **Metin Renkleri**: `#1F2937`, `#6B7280`, `#9CA3AF`
- **Arka Plan**: `#FFFFFF`, `#F9FAFB`

### UI Bileşenleri
- **Kartlar**: Gölgeli, yuvarlak köşeli beyaz kartlar
- **Butonlar**: Gradient arka planlı, yuvarlak köşeli
- **Modal**: Alt taraftan açılan, şeffaf overlay
- **Form**: Açık kenarlıklı input alanları

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
1. Topluluk sayfasında "Yeni Soru Oluştur" butonuna tıklayın
2. Giriş yapmadıysanız giriş sayfasına yönlendirilirsiniz
3. Modal açılır, soru başlığı ve detayını yazın
4. "Soruyu Gönder" butonuna tıklayın
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
const primaryColor = '#667eea';
const secondaryColor = '#764ba2';
const textColor = '#1F2937';
```

### API Customization
`communityService.ts` dosyasında API endpoint'leri ve veri yapıları özelleştirilebilir.

## 🐛 Sorun Giderme

### Yaygın Sorunlar
1. **AsyncStorage errors**: React Native AsyncStorage kurulu olduğundan emin olun
2. **Navigation errors**: Expo Router doğru kurulumunu kontrol edin
3. **API connection**: Backend sunucunuzun çalıştığından emin olun

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
- Modern gradient header
- Yeni soru oluştur butonu
- Soru kartları listesi
- Loading ve empty state'ler

### Soru Detayı
- Soru bilgileri
- Cevap listesi
- Cevap verme formu
- Geri buton ile navigasyon

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 