# 🗄️ إعداد MongoDB Atlas - خطوات سريعة

## ✅ الخطوات المطلوبة

### 1. إضافة Environment Variable في Render

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اختر خدمة `bta3-al3ab-backend`
3. اضغط على **Environment** في القائمة الجانبية
4. اضغط على **Add Environment Variable**
5. أضف:
   - **Key**: `MONGODB_URI`
   - **Value**: `mongodb+srv://gawesh1112_db_user:utolQ3ovK8XnludE@bta3al3ab.bbmscxa.mongodb.net/?appName=bta3Al3ab`
6. اضغط **Save Changes**

### 2. إعادة نشر الخدمة

بعد إضافة Environment Variable:
- Render سيعيد نشر الخدمة تلقائياً
- أو اضغط **Manual Deploy** → **Deploy latest commit**

### 3. التحقق من الاتصال

بعد إعادة النشر، تحقق من Logs في Render:
- يجب أن ترى: `✅ Connected to MongoDB`
- إذا رأيت: `⚠️  MONGODB_URI not set` → تأكد من إضافة Environment Variable

## 🔒 الأمان

⚠️ **مهم**: لا تضيف MongoDB URI مباشرة في الكود!
- ✅ استخدم Environment Variables في Render
- ❌ لا تضيفه في `server.js` أو أي ملف كود

## 📝 ملاحظات

- الكود جاهز - سيستخدم MongoDB تلقائياً إذا كان `MONGODB_URI` موجود
- إذا لم يكن موجود، سيستخدم ملفات JSON كـ fallback
- البيانات ستُحفظ في MongoDB ولن تُفقد عند إعادة النشر ✅

## 🧪 اختبار

بعد إعادة النشر:
1. افتح الداشبورد
2. أضف لعبة أو فيلم جديد
3. تحقق من Logs في Render - يجب أن ترى: `✅ Games data saved to MongoDB`

