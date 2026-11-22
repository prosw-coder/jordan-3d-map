# اكتشف الأردن 3D

منصة تفاعلية لاستكشاف محافظات الأردن على خريطة ثلاثية الأبعاد.

## التقنية
- Vite + React
- Three.js / React Three Fiber
- حدود المحافظات الإدارية من geoBoundaries / Wikimedia
- جاهز للنشر على Cloudflare Workers Static Assets

## التشغيل
```bash
npm install
npm run dev
```

## بيانات الحدود والترخيص
تُحمّل حدود المحافظات الـ12 من geoBoundaries ADM1 عبر واجهته العامة. بيانات الحدود المعروضة في هذه النسخة تحمل ترخيص Creative Commons Attribution 2.5 Generic وفق بيانات geoBoundaries؛ يجب إبقاء النسبة إلى geoBoundaries وWikimedia عند إعادة الاستخدام. قد تتغير بيانات المصدر أو رابط التنزيل، لذا يجب التحقق منهما قبل الإطلاق التجاري النهائي.

المصدر: https://www.geoboundaries.org/api/current/gbOpen/JOR/ADM1/
