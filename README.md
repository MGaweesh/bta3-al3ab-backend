# Backend API - بتاع العاب

Backend API لإدارة الألعاب والأفلام باستخدام Express.js + JSON files + GitHub Auto-Commit

## 🚀 التشغيل

### تثبيت الحزم
```bash
npm install
```

### تشغيل السيرفر
```bash
# وضع التطوير (مع auto-reload)
npm run dev

# وضع الإنتاج
npm start
```

السيرفر سيعمل على `http://localhost:3001`

## 📁 التخزين

- **JSON Files**: البيانات محفوظة في `data/games.json` و `data/movies.json`
- **GitHub Auto-Commit**: كل عملية كتابة تلتزم تلقائياً إلى GitHub
- **Fallback**: إذا فشل GitHub commit، البيانات تبقى محفوظة محلياً

## 📡 API Endpoints

### الحصول على جميع الألعاب
```
GET /api/games
```

### الحصول على ألعاب فئة معينة
```
GET /api/games/:category
```
الفئات المتاحة: `readyToPlay`, `repack`, `online`

### إضافة لعبة جديدة
```
POST /api/games/:category
Body: {
  "name": "اسم اللعبة",
  "size": "الحجم",
  "image": "رابط الصورة"
}
```

### تحديث لعبة
```
PUT /api/games/:category/:id
Body: {
  "name": "اسم اللعبة المحدث",
  "size": "الحجم المحدث",
  "image": "رابط الصورة المحدث"
}
```

### حذف لعبة
```
DELETE /api/games/:category/:id
```

### Health Check
```
GET /api/health
```

## 📁 هيكل البيانات

البيانات محفوظة في `data/games.json`:

```json
{
  "readyToPlay": [
    {
      "id": 1,
      "name": "اسم اللعبة",
      "size": "الحجم",
      "image": "رابط الصورة",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "repack": [],
  "online": []
}
```

## 🔧 المتغيرات البيئية

- `PORT`: منفذ السيرفر (افتراضي: 3001)
- `GITHUB_TOKEN`: GitHub Personal Access Token (للـ auto-commit)
- `GITHUB_OWNER`: اسم مالك الـ Repository (مثال: MGaweesh)
- `GITHUB_REPO`: اسم الـ Repository (مثال: bta3-al3ab-backend)
- `GITHUB_BRANCH`: اسم الـ Branch (افتراضي: main)
- `DATA_DIR`: مسار ملفات البيانات (افتراضي: `data/` أو `/mnt/data` في production)

**ملاحظة:** GitHub variables اختيارية. النظام سيعمل مع الملفات المحلية حتى لو لم تكن موجودة.

