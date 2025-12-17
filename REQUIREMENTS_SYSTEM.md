# نظام جلب المتطلبات الشامل

## نظرة عامة

هذا النظام يجلب متطلبات النظام لجميع الألعاب في `games.json` تلقائياً من مصادر متعددة مع أولويات محددة.

## الأولويات حسب نوع اللعبة

### 1. الألعاب Online/Competitive
- **المصدر الأول**: RAWG API
- **المصدر الثاني**: Fallback File

**كيفية التصنيف:**
- إذا كانت الفئات تحتوي على: `shooter`, `competitive`, `online`, `battle-royale`, `multiplayer`

### 2. الألعاب Indie (حجم < 10 GB)
- **المصدر الأول**: RAWG API
- **المصدر الثاني**: Fallback File

**كيفية التصنيف:**
- إذا كان حجم اللعبة أقل من 10 GB

### 3. الألعاب Offline/Repack/Story
- **المصدر الأول**: Steam API (بالـ AppID أو البحث بالاسم)
- **المصدر الثاني**: RAWG API
- **المصدر الثالث**: Fallback File

**كيفية التصنيف:**
- جميع الألعاب الأخرى (افتراضي)

## الملفات

### `backend/utils/fetchRequirements.js`
- `getRequirementsForGame(gameMeta, forceFetch)` - جلب المتطلبات للعبة واحدة
- `classifyGameType(gameMeta)` - تصنيف نوع اللعبة
- `loadFallbackRequirements(gameName)` - تحميل من ملف Fallback
- `searchSteamAppId(gameName)` - البحث في Steam بالاسم
- `fetchFromSteamByAppId(appId)` - جلب من Steam بالـ AppID
- `fetchFromRawgByName(name)` - جلب من RAWG بالاسم

### `backend/server.js`
- `fetchRequirementsForAllGames()` - جلب المتطلبات لجميع الألعاب
- `POST /api/games/fetch-all-requirements` - Endpoint لتفعيل الجلب

### `backend/cache/fallbackRequirements.json`
- ملف Fallback يحتوي على متطلبات محددة مسبقاً

### `backend/cache/requirements/<gameId>.json`
- ملفات Cache للمتطلبات المجلوبة (TTL: 24 ساعة)

## كيفية الاستخدام

### 1. جلب المتطلبات لجميع الألعاب

```bash
# عبر API
curl -X POST http://localhost:3001/api/games/fetch-all-requirements

# أو برمجياً في server.js (uncomment السطر في app.listen)
```

### 2. جلب المتطلبات لعبة واحدة

```javascript
import { getRequirementsForGame } from './utils/fetchRequirements.js';

const gameMeta = {
  id: 1001,
  name: "Assassin's Creed Unity",
  categories: ["action", "adventure"],
  size: "40.3 GB"
};

const result = await getRequirementsForGame(gameMeta);
console.log(result);
// {
//   source: "steam" | "rawg" | "fallback" | "none",
//   requirements: {
//     minimum: { cpu, gpu, ram, storage, os },
//     recommended: { cpu, gpu, ram, storage, os }
//   },
//   fetchedAt: "2025-01-16T12:00:00.000Z"
// }
```

## تنسيق البيانات في games.json

بعد الجلب، كل لعبة ستحتوي على:

```json
{
  "id": 1001,
  "name": "Assassin's Creed Unity",
  "requirements": {
    "cpu": "Intel Core i5-2500K @ 3.3 GHz",
    "gpu": "NVIDIA GeForce GTX 680",
    "ram": "6 GB",
    "storage": "40 GB",
    "os": "Windows 7 SP1, Windows 8, Windows 8.1"
  },
  "requirementsSource": "steam",
  "systemRequirements": {
    "minimum": { ... },
    "recommended": { ... }
  }
}
```

## الإجبار على إعادة الجلب

إذا كانت اللعبة تحتوي على:
- `requirements: "unknown"`
- `requirements: "No requirements specified"`
- `systemRequirements.minimum.cpu: "غير محدد"` أو `"لا توجد متطلبات"`

سيتم إجبار إعادة الجلب تلقائياً.

## المعالجة على دفعات

- **حجم الدفعة**: 3 ألعاب
- **التأخير بين الألعاب**: 1 ثانية
- **التأخير بين الدفعات**: 2 ثانية

## التخزين المؤقت (Cache)

- **المدة**: 24 ساعة
- **الموقع**: `backend/cache/requirements/<gameId>.json`
- **التحديث**: تلقائي عند انتهاء المدة

## السجلات (Logging)

النظام يسجل:
- اسم اللعبة
- المصدر المستخدم (Steam/RAWG/Fallback)
- النتيجة (Success/Fallback/Failed)

## ملاحظات

- النظام يعمل بشكل تلقائي عند الطلب
- يمكن إيقافه وإعادة تشغيله (يحفظ التقدم)
- الألعاب التي لا يمكن العثور على متطلباتها تُ标记 كـ `"unknown"`

