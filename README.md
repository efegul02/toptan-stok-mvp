# Toptan Stok — MVP başlangıç projesi

Bu, bağımsız toptan satış stok yazılımının **ilk geliştirme iskeletidir**:
- React + TypeScript + Vite arayüzü
- Python + FastAPI API
- PostgreSQL veritabanı
- Ürün kartları ve stok hareketleri
- Docker Compose ile tek komutla çalıştırma

> **Önemli:** Bu sürüm geliştirme amaçlıdır. Kullanıcı girişi/yetkilendirme, depo yönetimi, satış-alış belgeleri, e-fatura entegrasyonu, AI asistanı, veritabanı migration'ları ve üretim güvenliği henüz yoktur. Gerçek şirket verisiyle veya canlı ortamda kullanmayın.

## 1. Gerekenler

- Docker Desktop (Docker Compose ile)
- Claude Code
- Bir terminal

Docker Desktop'ı kurup açın. Terminalde `docker --version` ve `docker compose version` komutları çalışmalı.

## 2. Projeyi çalıştırma

Bu klasörde terminal açın ve çalıştırın:

```bash
docker compose up --build
```

İlk kurulumda imajlar ve Python/Node paketleri indirilir; birkaç dakika sürebilir.

- Arayüz: http://localhost:5173
- API belgeleri: http://localhost:8000/docs
- API sağlık kontrolü: http://localhost:8000/health

Kapatmak için `Ctrl+C`, ardından isterseniz:

```bash
docker compose down
```

Veritabanı verisini de silerek tamamen sıfırlamak için (DİKKAT: verileri siler):

```bash
docker compose down -v
```

## 3. İlk test

1. Arayüzü açın.
2. SKU, ürün adı ve birim girerek ürün ekleyin.
3. Ürünün yanındaki stok alanından pozitif veya negatif miktar girip hareket ekleyin.
4. Sayfayı yenileyin; ürün ve stok bakiyesi PostgreSQL'de kalmalıdır.
5. API belgelerinde `GET /api/v1/products`, `GET /api/v1/stock/balances` uçlarını deneyin.

## 4. Claude Code ile çalışma

Bu klasörde terminal açın ve `claude` komutunu çalıştırın. Claude Code'a önce şu talimatı verin:

> README.md ve mevcut kodu incele. Bu proje başlangıç seviyesindeki bir geliştirici tarafından öğrenilerek geliştirilecek. Önce mevcut mimariyi kısa ve sade biçimde açıkla. Sonra küçük adımlarla ilerle; her dosya değişikliğinin nedenini anlat. Bu aşamada kullanıcı girişi, e-fatura veya AI ekleme. Önce ürün ve stok hareketleri için otomatik testler yaz; negatif stok engelini eklemeden önce davranışı testlerle tanımla. Komutları çalıştırmadan önce ne yapacaklarını açıkla ve benden onay bekle.

**Güvenli çalışma alışkanlığı:** Claude Code'un önerdiği değişiklikleri incele. Veritabanını sıfırlayan, dosya silen veya gerçek hizmetlere bağlanan komutları anlamadan çalıştırma.

## 5. Mevcut API uçları

- `GET /health`
- `GET /api/v1/products`
- `POST /api/v1/products`
- `GET /api/v1/stock/balances`
- `GET /api/v1/stock/movements`
- `POST /api/v1/stock/movements`

Stok hareketleri artı/eksi miktarlarla kaydedilir; bakiye hareketlerin toplamından hesaplanır. Bu, başlangıç iskeletidir; gerçek kullanım öncesi eşzamanlı işlemler, negatif stok politikası, audit kayıtları, kullanıcı yetkileri ve migration'lar eklenmelidir.

## 6. Planlanan geliştirme sırası

1. **Bu MVP:** ürün kartları + stok hareketleri + PostgreSQL.
2. Testler, veri doğrulama, negatif stok kuralı, veritabanı migration'ları.
3. Kullanıcı girişi, roller ve işlem kayıtları.
4. Depolar, müşteriler, tedarikçiler.
5. Alış ve satış belgeleri; belge onayında stok hareketini tek veritabanı işlemi içinde oluşturma.
6. Raporlar, arama, filtreleme, CSV/Excel dışa aktarma.
7. E-fatura entegrasyonu: önce sağlayıcı arayüzü ve test ortamı, sonra seçilen yetkili entegratörün API'si.
8. AI asistanı: ilk aşamada yalnızca raporları okuyup açıklama; stok değiştirme işlemleri kullanıcı onayıyla.
9. Güvenlik, yedekleme/geri yükleme denemeleri, izleme ve canlıya geçiş kontrol listesi.

Her aşamada önce test, sonra kod, sonra gözden geçirme yaklaşımını kullanın.
