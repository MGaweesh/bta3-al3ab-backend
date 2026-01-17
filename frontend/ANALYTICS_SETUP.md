# إعداد Google Analytics لتتبع الزوار

تم إضافة نظام Google Analytics 4 (GA4) لتتبع زوار الموقع.

## الخطوات المطلوبة:

### 1. إنشاء حساب Google Analytics
1. اذهب إلى [Google Analytics](https://analytics.google.com/)
2. سجل الدخول بحساب Google الخاص بك
3. أنشئ حساب جديد (Account) إذا لم يكن لديك واحد
4. أنشئ خاصية (Property) جديدة من نوع "GA4"
5. أنشئ تدفق بيانات (Data Stream) من نوع "Web"
6. انسخ **Measurement ID** (يبدأ بـ `G-`)

### 2. إضافة Measurement ID إلى المشروع

#### الطريقة الأولى: استخدام ملف `.env` (مُوصى به)
1. أنشئ ملف `.env` في مجلد `frontend/`
2. أضف السطر التالي:
```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ENABLE_ANALYTICS=true
```
3. استبدل `G-XXXXXXXXXX` بـ Measurement ID الخاص بك

#### الطريقة الثانية: تعديل الملف مباشرة
افتح `frontend/src/config/analytics.js` وغير:
```javascript
export const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // ضع Measurement ID هنا
```

### 3. إعادة تشغيل الخادم
بعد إضافة Measurement ID، أعد تشغيل خادم التطوير:
```bash
npm run dev
```

## ما يتم تتبعه تلقائياً:

✅ **زيارات الصفحات**: كل صفحة يتم فتحها  
✅ **نقرات الألعاب**: عند النقر على أي لعبة  
✅ **نقرات الأفلام/المسلسلات**: عند النقر على أي فيلم أو مسلسل  
✅ **نقرات الواتساب**: عند الضغط على أزرار الواتساب من:
   - Selection Bar
   - صفحة Can I Run It

## الأحداث المخصصة المتاحة:

يمكنك استخدام الدوال التالية في أي مكان في الكود:

```javascript
import { trackEvent, trackGameClick, trackMovieClick, trackWhatsAppClick, trackCompatibilityCheck } from '../utils/analytics'

// تتبع حدث مخصص
trackEvent('custom_event', { param1: 'value1' })

// تتبع نقر على لعبة
trackGameClick('Game Name')

// تتبع نقر على فيلم
trackMovieClick('Movie Name')

// تتبع نقر على واتساب
trackWhatsAppClick('source_name')

// تتبع فحص التوافق
trackCompatibilityCheck('Game Name', 'can_run')
```

## تعطيل Analytics:

إذا أردت تعطيل Analytics مؤقتاً:
1. في ملف `.env`:
```env
VITE_ENABLE_ANALYTICS=false
```

أو في `frontend/src/config/analytics.js`:
```javascript
export const ENABLE_ANALYTICS = false
```

## التحقق من عمل Analytics:

1. افتح الموقع في المتصفح
2. افتح Developer Tools (F12)
3. اذهب إلى تبويب Network
4. ابحث عن طلبات إلى `google-analytics.com` أو `googletagmanager.com`
5. أو استخدم [Google Analytics DebugView](https://support.google.com/analytics/answer/7201382)

## ملاحظات:

- Analytics يعمل فقط في Production أو عند إضافة Measurement ID
- البيانات تظهر في Google Analytics بعد 24-48 ساعة تقريباً
- يمكنك رؤية البيانات الفورية في Real-time reports في Google Analytics

