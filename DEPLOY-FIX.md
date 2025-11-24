# 🔧 إصلاح خطأ Deployment - الملفات المفقودة

## المشكلة

الخطأ في Render:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/opt/render/project/src/db/games-db.js'
```

**السبب**: الملفات الجديدة غير موجودة في Git.

## الحل السريع

### الخطوة 1: إضافة الملفات إلى Git

افتح Terminal في مجلد المشروع واكتب:

```bash
# إضافة جميع الملفات الجديدة
git add backend/db/
git add backend/package.json
git add backend/server.js

# Commit
git commit -m "Add MongoDB support and database files"

# Push إلى GitHub
git push
```

### الخطوة 2: إعادة النشر على Render

بعد الـ push:
- Render سيعيد النشر تلقائياً
- أو اضغط **Manual Deploy** في Render Dashboard

## الملفات المطلوبة في Git

تأكد من أن هذه الملفات موجودة:
- ✅ `backend/db/mongodb.js`
- ✅ `backend/db/games-db.js`
- ✅ `backend/db/movies-db.js`
- ✅ `backend/package.json` (محدث مع mongodb dependency)
- ✅ `backend/server.js` (محدث)

## التحقق

بعد إعادة النشر، تحقق من Logs في Render:
- يجب أن ترى: `✅ Connected to MongoDB` (إذا كان MONGODB_URI موجود)
- أو: `⚠️  MONGODB_URI not set, using file-based storage` (إذا لم يكن موجود)

## ملاحظة

⚠️ **مهم**: لا تنس إضافة `MONGODB_URI` في Render Environment Variables!

