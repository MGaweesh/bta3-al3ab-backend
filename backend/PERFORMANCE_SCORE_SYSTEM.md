# نظام تقييم الأداء (Performance Score System)

## نظرة عامة

نظام شامل لحساب وتقييم أداء الجهاز مقابل متطلبات الألعاب باستخدام خوارزمية مرجحة.

## الخوارزمية

### الأوزان الافتراضية

```
CPU:     30% (0.30)
GPU:     30% (0.30)
RAM:     15% (0.15)
Storage: 15% (0.15)
OS:      10% (0.10)
─────────────────
Total:  100% (1.00)
```

### حساب النقاط لكل محور

#### CPU & GPU (0..1)
- **1.0**: تطابق كامل أو يحتوي على النموذج المطلوب
- **0.7**: مشاركة token (مثل i5, i7, 1060, GTX, RTX)
- **0.4**: تطابق العلامة التجارية فقط (Intel, AMD, NVIDIA)
- **0.0**: لا يوجد تطابق

#### RAM (0..1)
```
ramScore = min(userRAM / requiredRAM, 1.0)
```

#### Storage (0..1)
```
storageScore = min(userStorage / requiredStorage, 1.0)
```

#### OS (0 أو 1)
- **1**: متوافق (يحتوي على نفس نظام التشغيل)
- **0**: غير متوافق

### حساب النتيجة النهائية

```
score = (cpuWeight × cpuScore) + 
        (gpuWeight × gpuScore) + 
        (ramWeight × ramScore) + 
        (storageWeight × storageScore) + 
        (osWeight × osScore)
```

### التصنيف (Tiers)

- **Strong**: score >= 0.85
- **Medium**: 0.6 <= score < 0.85
- **Weak**: 0.35 <= score < 0.6
- **Cannot Run**: score < 0.35

## مثال حسابي

### المدخلات:
- User CPU: "Intel Core i5-8400"
- User GPU: "NVIDIA GTX 1060"
- User RAM: 16 GB
- User Storage: 500 GB
- User OS: "Windows 10"

- Required CPU: "Intel Core i5-2500K"
- Required GPU: "NVIDIA GTX 660"
- Required RAM: 8 GB
- Required Storage: 57.2 GB
- Required OS: "Windows 10"

### الحساب:

1. **CPU Score**: 1.0 (i5-8400 يحتوي على i5)
2. **GPU Score**: 1.0 (GTX 1060 يحتوي على GTX)
3. **RAM Score**: min(16 / 8, 1.0) = 1.0
4. **Storage Score**: min(500 / 57.2, 1.0) = 1.0
5. **OS Score**: 1.0 (Windows 10 متوافق)

### النتيجة:
```
score = (0.30 × 1.0) + (0.30 × 1.0) + (0.15 × 1.0) + (0.15 × 1.0) + (0.10 × 1.0)
      = 0.30 + 0.30 + 0.15 + 0.15 + 0.10
      = 1.00
```

**Tier**: Strong (score >= 0.85)

## الملفات

### Backend
- `backend/utils/computeScore.js` - خوارزمية حساب النتيجة
- `backend/server.js` - استخدام `computePerformanceScore` في `/api/compatibility/check`

### Frontend
- `frontend/src/components/GameResultBadge/GameResultBadge.jsx` - عرض التقييم
- `frontend/src/pages/CanIRunIt/CanIRunIt.jsx` - استخدام `GameResultBadge`

## API Response Format

```json
{
  "gameId": 1001,
  "gameName": "Assassin's Creed Unity",
  "status": "can_run",
  "perf": {
    "score": 0.95,
    "tier": "Strong",
    "breakdown": {
      "cpuScore": 1.0,
      "gpuScore": 1.0,
      "ramScore": 1.0,
      "storageScore": 1.0,
      "osScore": 1.0,
      "cpuComp": 0.30,
      "gpuComp": 0.30,
      "ramComp": 0.15,
      "storageComp": 0.15,
      "osComp": 0.10,
      "s1": 0.30,
      "s2": 0.60,
      "s3": 0.75,
      "s4": 0.90
    }
  },
  "requirements": { ... },
  "notes": [ ... ]
}
```

## التخصيص

يمكن تعديل الأوزان في `backend/utils/computeScore.js`:

```javascript
const W = {
  cpu: 0.30,      // قابل للتعديل
  gpu: 0.30,      // قابل للتعديل
  ram: 0.15,      // قابل للتعديل
  storage: 0.15,  // قابل للتعديل
  os: 0.10        // قابل للتعديل
};
```

يمكن تعديل عتبات التصنيف:

```javascript
if (score >= 0.85) tier = 'Strong';
else if (score >= 0.6) tier = 'Medium';
else if (score >= 0.35) tier = 'Weak';
else tier = 'Cannot Run';
```

## الاختبار

### حالات الاختبار:

1. **Strong** (score ≈ 1.0):
   - User RAM: 16 GB, Required: 8 GB
   - User Storage: 500 GB, Required: 57.2 GB
   - CPU/GPU match

2. **Medium** (score ≈ 0.65):
   - User RAM: 8 GB, Required: 8 GB
   - User Storage: 60 GB, Required: 57.2 GB
   - GPU fuzzy match (0.7)

3. **Weak** (score ≈ 0.45):
   - User RAM: 4 GB, Required: 8 GB
   - User Storage: 30 GB, Required: 57.2 GB
   - GPU unmatched (0.0)

4. **Cannot Run** (score < 0.35):
   - User Storage < Required Storage
   - CPU/GPU unmatched
   - RAM insufficient

## الاستخدام

النظام يعمل تلقائياً عند استدعاء `/api/compatibility/check`. النتيجة تحتوي على `perf` object مع `score` و `tier` و `breakdown`.

