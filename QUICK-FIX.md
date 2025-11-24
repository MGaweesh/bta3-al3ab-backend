# ⚡ حل سريع لمشكلة فقدان البيانات على Render

## المشكلة
على Render، ملفات JSON مؤقتة وتُفقد عند إعادة النشر من Git.

## الحل السريع (بدون قاعدة بيانات)

### الخطوة 1: إضافة ملفات JSON إلى Git

```bash
# تأكد من أن الملفات موجودة
cd backend/data
ls -la games.json movies.json

# أضفها إلى Git
git add backend/data/games.json backend/data/movies.json
git commit -m "Add data files to Git"
git push
```

### الخطوة 2: بعد كل تعديل في الداشبورد

```bash
# بعد التعديلات، أضف الملفات إلى Git
git add backend/data/*.json
git commit -m "Update data files"
git push
```

## الحل الدائم: MongoDB Atlas (موصى به)

1. سجل في [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (مجاني)
2. أنشئ cluster مجاني
3. احصل على Connection String
4. أضفه في Render Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bta3al3ab
   ```
5. الكود جاهز - سيستخدم MongoDB تلقائياً إذا كان `MONGODB_URI` موجود

## ملاحظة

- بدون MongoDB: البيانات تُحفظ في ملفات JSON (مؤقتة على Render)
- مع MongoDB: البيانات دائمة ولن تُفقد أبداً ✅

