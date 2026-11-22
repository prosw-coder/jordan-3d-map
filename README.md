# اكتشف الأردن 3D

منصة عربية تفاعلية لاستكشاف المحافظات الأردنية عبر خريطة ثلاثية الأبعاد.

## التقنية
- React 19 + Vite
- Three.js عبر React Three Fiber وDrei
- حدود المحافظات بصيغة GeoJSON من geoBoundaries (Jordan ADM1)
- Cloudflare Workers Static Assets

## التشغيل محلياً
```bash
npm install
npm run dev
```

## البناء والنشر
```bash
npm run build
npx wrangler deploy
```

## مصدر البيانات والترخيص
تُحمّل حدود المحافظات من geoBoundaries، مستوى ADM1 للأردن:
https://www.geoboundaries.org/api/current/gbOpen/JOR/ADM1/

توضح بيانات المصدر أن حدود ADM1 تعود إلى سنة 2006، وأن مصدرها geoBoundaries وWikimedia بترخيص Creative Commons Attribution 2.5 Generic (CC BY 2.5). يجب إبقاء الإسناد إلى geoBoundaries وWikimedia والالتزام بشروط الترخيص عند إعادة الاستخدام.

## حالة النسخة الأولية
تتضمن الواجهة العربية، خريطة المحافظات ثلاثية الأبعاد، التدوير والتقريب، اختيار المحافظة مع انتقال كاميرا سلس، البحث وقائمة المحافظات وصفحة تعريفية أولية.

لا تتضمن هذه النسخة بعد حسابات المستخدمين، لوحة أصحاب الأعمال، الدفع، الحجوزات أو لوحة الإدارة. هذه مراحل تطوير لاحقة وليست وظائف مفعّلة حالياً.
