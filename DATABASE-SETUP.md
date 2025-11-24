# 🗄️ إعداد قاعدة البيانات - حل مشكلة فقدان البيانات على Render

## المشكلة الحالية

على Render، ملفات JSON مؤقتة وتُفقد عند إعادة النشر. الحل هو استخدام قاعدة بيانات دائمة.

## الحل: MongoDB Atlas (مجاني)

### الخطوة 1: إنشاء حساب MongoDB Atlas

1. اذهب إلى [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. سجل حساب مجاني
3. أنشئ cluster جديد (اختر FREE tier)

### الخطوة 2: الحصول على Connection String

1. في MongoDB Atlas Dashboard:
   - اضغط على "Connect"
   - اختر "Connect your application"
   - انسخ Connection String (سيبدو مثل: `mongodb+srv://username:password@cluster.mongodb.net/`)

### الخطوة 3: إضافة Environment Variables في Render

1. اذهب إلى Render Dashboard → Your Service → Environment
2. أضف:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bta3al3ab?retryWrites=true&w=majority
   ```
   (استبدل username و password و cluster بالبيانات الخاصة بك)

### الخطوة 4: تثبيت MongoDB في المشروع

```bash
cd backend
npm install mongodb
```

### الخطوة 5: تحديث الكود

سيتم تحديث `server.js` لاستخدام MongoDB بدلاً من ملفات JSON.

## بديل: Supabase (PostgreSQL مجاني)

إذا كنت تفضل PostgreSQL:

1. اذهب إلى [Supabase](https://supabase.com)
2. أنشئ مشروع جديد
3. احصل على Connection String
4. أضفه في Render Environment Variables

## بعد الإعداد

- البيانات ستُحفظ في قاعدة بيانات دائمة
- لن تُفقد البيانات عند إعادة النشر
- أسرع وأكثر موثوقية من ملفات JSON

