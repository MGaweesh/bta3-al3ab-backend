# ⚠️ إعداد Render - حل مشكلة فقدان البيانات

## المشكلة

على Render، الملفات في filesystem **مؤقتة** وتُفقد عند:
- إعادة النشر (redeploy)
- إعادة التشغيل (restart)
- تحديث الكود من Git

## الحلول المتاحة

### الحل 1: استخدام قاعدة بيانات (موصى به) ✅

**الأفضل**: استخدام MongoDB أو PostgreSQL بدلاً من ملفات JSON

**المزايا**:
- البيانات دائمة
- لا تُفقد عند إعادة النشر
- أسرع وأكثر موثوقية

**الخدمات المجانية**:
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - مجاني حتى 512MB
- [Supabase](https://supabase.com) - PostgreSQL مجاني
- [Railway](https://railway.app) - PostgreSQL مجاني

### الحل 2: Render Disk (مدفوع) 💰

Render Disk يوفر مساحة تخزين دائمة، لكنه مدفوع.

### الحل 3: Auto-commit to Git (مؤقت) ⚠️

تم إضافة script تلقائي لحفظ الملفات في Git بعد كل تحديث.

**المشاكل**:
- يحتاج Git credentials على Render
- قد يكون بطيئاً
- ليس موثوقاً 100%

**كيفية التفعيل**:

1. **إضافة Git credentials في Render**:
   - اذهب إلى Render Dashboard
   - Settings → Environment Variables
   - أضف:
     ```
     AUTO_COMMIT_DATA=true
     GIT_USERNAME=your-username
     GIT_EMAIL=your-email
     ```

2. **إعداد Git credentials**:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your-email@example.com"
   ```

3. **إضافة SSH key أو Personal Access Token**:
   - GitHub: Settings → Developer settings → Personal access tokens
   - أنشئ token مع صلاحيات `repo`
   - أضفه في Render Environment Variables:
     ```
     GITHUB_TOKEN=your-token
     ```

**تعطيل Auto-commit**:
```
AUTO_COMMIT_DATA=false
```

### الحل 4: استخدام خدمة خارجية (مؤقت) 📦

استخدم خدمة مثل:
- [Supabase](https://supabase.com) - قاعدة بيانات + API
- [Firebase](https://firebase.google.com) - Realtime Database
- [Airtable](https://airtable.com) - جدول بيانات مع API

## التوصية النهائية

**استخدم MongoDB Atlas** - مجاني وسهل الإعداد:

1. سجل في [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. أنشئ cluster مجاني
3. احصل على connection string
4. أضف في Render Environment Variables:
   ```
   MONGODB_URI=your-connection-string
   ```
5. عدّل الكود لاستخدام MongoDB بدلاً من JSON files

## التحقق من المشكلة

افتح `/api/data/status` للتحقق من:
- تاريخ آخر تعديل للملفات
- إذا كانت الملفات موجودة
- حجم الملفات

إذا كان تاريخ التعديل قديم، يعني أن الملفات تُعاد من Git عند إعادة النشر.


