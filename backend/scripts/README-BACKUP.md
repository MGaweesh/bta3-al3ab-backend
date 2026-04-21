# MongoDB Backup System

## نظام النسخ الاحتياطي التلقائي

### الملفات:
- `auto-backup-mongodb.js` - Script النسخ الاحتياطي
- `setup-daily-backup.bat` - إعداد المهمة اليومية (Windows)

### كيفية الاستخدام:

#### 1. نسخ احتياطي يدوي (في أي وقت):
```bash
cd backend
node scripts/auto-backup-mongodb.js
```

#### 2. نسخ احتياطي تلقائي يومي (Windows):
```bash
# شغل كـ Administrator
cd backend/scripts
setup-daily-backup.bat
```

سيتم إنشاء مهمة تشتغل كل يوم الساعة 2 صباحاً

#### 3. نسخ احتياطي تلقائي يومي (Linux/Mac):
أضف للـ crontab:
```bash
crontab -e
# أضف السطر التالي:
0 2 * * * cd /path/to/project/backend && node scripts/auto-backup-mongodb.js
```

### ماذا يفعل الـ Script:

1. **يسحب البيانات من MongoDB**:
   - Games (جميع الفئات)
   - Movies/TV Shows/Anime
   - Bundles

2. **يحفظ نسخة احتياطية مؤرخة**:
   - `backend/backups/games-backup-YYYY-MM-DD.json`
   - `backend/backups/movies-backup-YYYY-MM-DD.json`
   - `backend/backups/bundles-backup-YYYY-MM-DD.json`

3. **يحدث الملفات الرئيسية**:
   - `backend/data/games.json`
   - `backend/data/movies.json`
   - `backend/data/bundles.json`

4. **يحفظ في Git** (اختياري):
   - Auto-commit للتغييرات

### استرجاع من Backup:

إذا حصلت مشكلة، استخدم أي backup من مجلد `backend/backups/`:

```bash
# انسخ الـ backup للملف الرئيسي
cp backend/backups/games-backup-2025-01-15.json backend/data/games.json

# ثم ارفعه على MongoDB
node scripts/migrate_to_mongo.js
```

### ملاحظات مهمة:

⚠️ **لا تمسح مجلد `backend/backups/`** - فيه جميع النسخ الاحتياطية

✅ **شغل الـ backup يدوياً** بعد أي تعديل مهم:
```bash
node scripts/auto-backup-mongodb.js
```

✅ **احفظ الـ backups على Git** عشان تكون آمنة:
```bash
git add backend/backups/*.json
git commit -m "Backup: $(date)"
git push
```

### إدارة المهمة اليومية (Windows):

```bash
# عرض المهمة
schtasks /query /tn "MongoDB_Daily_Backup"

# حذف المهمة
schtasks /delete /tn "MongoDB_Daily_Backup" /f

# تشغيل المهمة الآن
schtasks /run /tn "MongoDB_Daily_Backup"
```
