# جلب المتطلبات لجميع الألعاب

## الطريقة 1: استخدام السكربت (مباشر)

```bash
# من مجلد backend
node scripts/fetch-all-requirements-now.js

# أو من المجلد الرئيسي
node backend/scripts/fetch-all-requirements-now.js
```

## الطريقة 2: استخدام Batch File (Windows)

```bash
# انقر نقراً مزدوجاً على الملف
backend/fetch-requirements.bat
```

## الطريقة 3: استخدام API Endpoint (إذا كان السيرفر يعمل)

```bash
# شغّل السيرفر أولاً
cd backend
npm start

# ثم في terminal آخر
curl -X POST http://localhost:3001/api/games/fetch-all-requirements
```

## ما يفعله السكربت

1. يقرأ `games.json`
2. يحدد الألعاب التي لا تحتوي على متطلبات
3. يجلب المتطلبات من:
   - Steam API (للألعاب Offline/Repack)
   - RAWG API (للألعاب Online/Competitive)
   - Fallback File (إذا فشلت المصادر الأخرى)
4. يحفظ التقدم بعد كل دفعة (3 ألعاب)
5. يعرض ملخص نهائي

## الوقت المتوقع

- **حجم الدفعة**: 3 ألعاب
- **التأخير بين الألعاب**: 1 ثانية
- **التأخير بين الدفعات**: 2 ثانية
- **الوقت التقريبي**: ~1 دقيقة لكل 3 ألعاب

إذا كان لديك 100 لعبة تحتاج متطلبات:
- الوقت التقريبي: ~35 دقيقة

## النتيجة

بعد اكتمال السكربت، ستجد:
- جميع الألعاب في `games.json` تحتوي على `systemRequirements`
- `requirementsSource` يحدد المصدر (steam/rawg/fallback)
- الألعاب التي لا يمكن العثور على متطلباتها تُعلّم كـ `"unknown"`

## ملاحظات

- السكربت يحفظ التقدم بعد كل دفعة، لذا يمكن إيقافه وإعادة تشغيله
- إذا فشل جلب متطلبات لعبة، سيتم تخطيها والمتابعة
- النتائج تُحفظ في `backend/data/games.json`

