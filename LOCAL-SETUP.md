# 🚀 إعداد المشروع محلياً (Localhost)

## 📋 المتطلبات

1. Node.js 18.x أو أحدث
2. MongoDB Atlas URI (أو MongoDB محلي)

## 🔧 خطوات الإعداد

### 1. إنشاء ملف `.env`

في مجلد `backend`، أنشئ ملف `.env` وأضف:

```env
# Server Port
PORT=3001

# MongoDB Atlas Connection String
# احصل على هذا الرابط من MongoDB Atlas Dashboard
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bta3al3ab?retryWrites=true&w=majority
```

**مثال:**
```env
PORT=3001
MONGODB_URI=mongodb+srv://gawesh1112_db_user:utolQ3ovK8XnludE@bta3al3ab.bbmscxa.mongodb.net/bta3al3ab?retryWrites=true&w=majority
```

### 2. تثبيت Dependencies

```bash
cd backend
npm install
```

### 3. تشغيل الباك إند

```bash
npm start
```

أو للتطوير مع auto-reload:

```bash
npm run dev
```

### 4. تشغيل الفرونت إند

في نافذة terminal جديدة:

```bash
cd frontend
npm install
npm run dev
```

## 🌐 الروابط

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health
- **Dashboard**: http://localhost:5173/dashboard

## ⚠️ ملاحظات مهمة

1. **MONGODB_URI**: تأكد من أن الرابط صحيح ولا يحتوي على `example.mongodb.net`
2. **PORT**: تأكد من أن PORT=3001 (وليس 5000)
3. **المنافذ**: تأكد من أن المنافذ 3001 و 5173 غير مستخدمة

## 🔍 التحقق من الإعداد

بعد تشغيل الباك إند، يجب أن ترى:

```
✅ Connected to MongoDB - Database: bta3al3ab
🚀 Server is running on http://localhost:3001
```

إذا رأيت خطأ:

```
❌ MongoDB connection error: querySrv ENOTFOUND _mongodb._tcp.cluster0.example.mongodb.net
```

هذا يعني أن `MONGODB_URI` غير صحيح. تحقق من:
1. الرابط في ملف `.env`
2. أن الرابط لا يحتوي على `example.mongodb.net`
3. أن اسم المستخدم وكلمة المرور صحيحة

## 🛠️ استكشاف الأخطاء

### المشكلة: الباك إند يعمل على منفذ مختلف (مثل 5000)

**الحل**: تحقق من ملف `.env` وتأكد من:
```env
PORT=3001
```

### المشكلة: فشل اتصال MongoDB

**الحل**:
1. تحقق من `MONGODB_URI` في `.env`
2. تأكد من أن MongoDB Atlas يعمل
3. تحقق من أن IP Address مسموح في MongoDB Atlas Network Access

### المشكلة: Frontend لا يتصل بالBackend

**الحل**:
1. تأكد من أن Backend يعمل على http://localhost:3001
2. افتح Console (F12) في المتصفح للتحقق من الأخطاء
3. تحقق من أن `VITE_API_URL` في `frontend/.env` (إن وجد) يشير إلى `http://localhost:3001/api`

