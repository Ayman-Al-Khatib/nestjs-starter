# تقرير التدقيق التقني الشامل — nestjs-starter

> مراجعة معمارية وأمنية على مستوى Tech Lead قبل الدخول إلى الإنتاج.
> تاريخ المراجعة: 2026-06-01 — الفرع: `fix/deploy-and-security-hardening`
> النطاق: قراءة كاملة للكود، تتبّع الـ Flow لكل Endpoint، تحليل الأمن وقاعدة البيانات والـ Migrations والأداء.

## ملخّص تنفيذي

هذا مشروع **عالي الجودة بشكل استثنائي** مقارنةً بمتوسط مشاريع NestJS. البنية المعمارية نظيفة ومنضبطة، فصل المسؤوليات ممتاز، ونمط المصادقة (fail-closed global guard، registry لحل المستخدم، تدوير refresh tokens مع كشف إعادة الاستخدام، تثبيت خوارزمية JWT مع iss/aud، تحقّق ملفات برفع Magic Bytes، حماية Path Traversal، توقيع HMAC للروابط) مبنيٌّ بوعي أمني حقيقي.

**لم أعثر على ثغرة Authorization أو Privilege Escalation أو SQL Injection فعلية** — وهذا نادر. الاستعلامات كلها مُعاملة (parameterized)، والـ guards مُطبّقة بشكل صحيح، والوصول الأفقي مضبوط عبر `@CurrentUser()`.

المشاكل الحقيقية تتركّز في **جاهزية النشر (Deployment)** — وهي تحديداً سبب فشل الـ Migrations لديك على الاستضافة — وفي **حدّ غير مضبوط لرفع الملفات** قد يُسقط العملية بنفاد الذاكرة. هذه أمور تشغيلية قابلة للإصلاح بسرعة، لكنها مانعة للإطلاق.

| المحور | التقييم |
|---|---|
| Architecture | 9.0 / 10 |
| Security | 8.5 / 10 |
| Database Design | 8.0 / 10 |
| Performance | 7.5 / 10 |
| Code Quality | 8.5 / 10 |
| **Production Readiness** | **6.5 / 10** |

---

# Critical Issues (حرجة)

## C1 — فشل/عدم تشغيل الـ Migrations على الاستضافة (سبب المشكلة المُبلّغ عنها)

**الوصف:**
السبب الجذري لظاهرة «تعمل محلياً وتفشل على الاستضافة» ليس خطأً في SQL داخل الـ Migrations (الـ Migrations سليمة داخلياً ومُترجمة بشكل صحيح إلى `dist`)، بل **اختلاف مسار بناء المخطّط بين البيئتين**:

- في التطوير: `synchronize: true` — المخطّط يُبنى مباشرةً من الـ Entities.
  المرجع: [app-database.options.ts:67](src/infrastructure/database/app-database.options.ts#L67)
- في الإنتاج: `synchronize: false` + `migrationsRun: true` — المخطّط يُبنى **حصراً** عبر الـ Migrations عند الإقلاع.
  المرجع: [app-database.options.ts:67-68](src/infrastructure/database/app-database.options.ts#L67-L68)

النتيجة: **مسار الـ Migration لا يُختبَر فعلياً قبل الإنتاج إطلاقاً.** محلياً يبني `synchronize` المخطّط؛ والاختبارات الموجودة كلها Unit Tests بـ Mocks (`otp.service.spec.ts`، `refresh-token.service.spec.ts`، `local-signing.service.spec.ts`) ولا يوجد أي اختبار e2e يُقلع على قاعدة بيانات حقيقية. فأوّل مرة تُنفَّذ فيها الـ Migrations على قاعدة حقيقية هي **في الإنتاج**.

**مكانها:** [app-database.options.ts:54-74](src/infrastructure/database/app-database.options.ts#L54-L74)، [app-database.module.ts:20-36](src/infrastructure/database/app-database.module.ts#L20-L36)

**تأثيرها:** أي فشل في الإقلاع داخل `TypeOrmModule.forRootAsync` (Migration، أو schema، أو env) يمنع الـ App من بدء الاستماع → **تعطّل كامل** (لا يصل أي Request). هذا هو العَرَض الذي تراه.

**كيفية الوصول إلى السبب:** انظر قسم **Migration Failure Analysis** في الأسفل — فيه الأسباب مرتّبة حسب الاحتمالية مع خطوات الإصلاح.

**الإصلاح المختصر:**
1. افصل تشغيل الـ Migrations عن إقلاع التطبيق (راجع H2).
2. اجعل بيئة `test` (أو خطوة CI) تُقلع فعلاً على قاعدة Postgres حقيقية لتُختبَر الـ Migrations قبل الإنتاج.
3. تأكّد من حقن جميع متغيّرات البيئة في الاستضافة (راجع H3) — فملف `env/.env.production` غير موجود داخل صورة Docker.

---

## C2 — رفع الملفات بلا حدّ حجم على مستوى Multer → نفاد ذاكرة (DoS / تعطّل)

**الوصف:**
`UploadSingle` يضبط `limits: { files: 1 }` فقط، **دون `limits.fileSize`**. وبما أن `FileInterceptor` يستخدم تخزين الذاكرة الافتراضي (memoryStorage)، فإن الملف **يُحمَّل بالكامل في الذاكرة (RAM)** قبل أن يصل إلى Pipe التحقق الذي يفحص `maxSize`.

```ts
// src/infrastructure/storage/http/decorators/upload-single.decorator.ts:5-9
export function UploadSingle(fieldName: string = 'file', options?: MulterOptions) {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, { limits: { files: 1 }, ...options })),
    //                                            ^ لا يوجد fileSize هنا
  );
}
```

حدّ الـ Body (`BODY_LIMIT=1mb`) **لا يطبَّق على multipart** — هو لـ `json()` و`urlencoded()` فقط:
[configure-body-limits.ts:11-12](src/bootstrap/configure-body-limits.ts#L11-L12)

**مكانها:** [upload-single.decorator.ts:5-9](src/infrastructure/storage/http/decorators/upload-single.decorator.ts#L5-L9)، وكذلك `upload-many.decorator.ts` و`upload-fields.decorator.ts`.

**تأثيرها:** مستخدم مُصادَق واحد (admin أو user) يستطيع إرسال ملف ضخم (مثلاً 2GB) إلى `POST /v1/user/me/photo`؛ يُخزَّن كاملاً في الذاكرة قبل الرفض → **OOM وإسقاط العملية**. حدّ الـ throttle للرفع في الإنتاج 10/دقيقة — أي عدة ملفات ضخمة متزامنة تكفي لإسقاط النسخة.

**كيفية استغلالها:**
```
POST /api/v1/user/me/photo
Authorization: Bearer <user_token>
Content-Type: multipart/form-data
--> ملف بحجم 1.5GB في الحقل photo
```
يُبتلع كلّه في الذاكرة → التحقّق يرفضه بعد فوات الأوان.

**طريقة إصلاحها:** افرض حدّاً صلباً على مستوى Multer حتى يُقطع التدفّق قبل تجاوز السقف:
```ts
const MAX_UPLOAD_BYTES = 11 * 1024 * 1024; // أكبر قليلاً من maxSize في السياسة
FileInterceptor(fieldName, { limits: { files: 1, fileSize: MAX_UPLOAD_BYTES }, ...options })
```
وعالِج خطأ `LIMIT_FILE_SIZE` في `multer-error.handler.ts` لإرجاع 413/422 واضح. طبّق نفس الشيء على `UploadMany`/`UploadFields`.

---

# High Priority Issues

## H1 — `migrationsRun: true` عند الإقلاع + تعدّد النسخ (Replicas) = سباق Migrations

**الوصف:** عند التوسّع الأفقي (PaaS/k8s)، تُقلع عدة نسخ في آنٍ واحد، وكلٌّ منها ينفّذ `runMigrations()` لحظة الإقلاع. TypeORM 0.3 يلفّ الـ Migrations بـ Transaction لكنه **لا يأخذ Advisory Lock افتراضياً**، فتتسابق النسخ على نفس الـ DDL → `relation already exists` / deadlock / فشل جزئي.

**مكانها:** [app-database.options.ts:68](src/infrastructure/database/app-database.options.ts#L68)

**تأثيرها:** فشل إقلاع متقطّع يصعب تشخيصه، يظهر فقط عند أكثر من نسخة — وهو سيناريو إنتاج شائع.

**الإصلاح:** انقل الـ Migrations إلى خطوة نشر مستقلة (release phase / init container / job) تعمل مرّة واحدة قبل تشغيل النسخ، واضبط `migrationsRun: false` في التطبيق. بديل أبسط لنسخة واحدة فقط: لفّ التشغيل بـ Postgres advisory lock.

## H2 — لا توجد طريقة موثوقة لتشغيل الـ Migrations يدوياً في الإنتاج

**الوصف:** سكربتات `migration:run` تعتمد `typeorm-ts-node-commonjs` (ts-node + TypeORM CLI) وهي **devDependencies**، وصورة الإنتاج تُثبَّت بـ `npm ci --omit=dev` ([Dockerfile:42](deploy/docker/Dockerfile#L42)). كما أن `data-source.ts` يقرأ ملف `env/.env.production` عبر dotenv ([data-source.ts:16](src/infrastructure/database/data-source.ts#L16)) — وهو ملف **غير موجود داخل الصورة** (مستبعَد في `.dockerignore` و`.gitignore`).

**التأثير:** إن كانت خطوة النشر لديك «شغّل `migration:run` ثم ابدأ» فهي تفشل في الإنتاج (لا CLI، ولا ملف env). وإن اعتمدت على `migrationsRun` عند الإقلاع فأنت في سيناريو H1.

**الإصلاح:** أضف هدفاً للـ Migration يعمل على JS المُترجَم بلا ts-node، مثلاً:
```
node ./node_modules/typeorm/cli.js migration:run -d dist/infrastructure/database/data-source.js
```
مع جعل `data-source` يقرأ من `process.env` مباشرةً في الإنتاج بدل ملف dotenv، واجعلها خطوة نشر صريحة.

## H3 — التطبيق يعتمد كلياً على حقن متغيّرات البيئة، وملف الإنتاج مستبعَد من الصورة

**الوصف:** `app-config.module.ts` يمرّر `envFilePath: ['env/.env.production']` ([app-config.module.ts:19](src/infrastructure/config/app-config.module.ts#L19))، لكن:
- `.gitignore` يستبعد `env/.env.production`.
- `.dockerignore` يستبعد كامل مجلّد `env/` ([.dockerignore:36](deploy/docker/.dockerignore#L36)).

فداخل صورة الإنتاج **لا يوجد ملف env**، و`@nestjs/config` يتجاهل الملف المفقود بصمت ويعتمد على `process.env`. إذا لم تحقن المنصّة كل المتغيّرات → فشل تحقّق zod عند الإقلاع → **انهيار قبل تشغيل الـ Migrations**. هذا أحد أكثر الأسباب ترجيحاً لمشكلتك.

**مكانها:** [app-config.module.ts:6-20](src/infrastructure/config/app-config.module.ts#L6-L20)

**الإصلاح:** وثّق بوضوح أن الإنتاج يتطلّب حقن المتغيّرات من المنصّة (وليس ملفاً)، وأضف رسالة فشل واضحة عند نقص متغيّر حرج. تحقّق أن كل المفاتيح في `env/.env.production.example` مضبوطة فعلاً في لوحة الاستضافة.

## H4 — `strictNullChecks: false` رغم اعتماد الكود الواسع على `| null`

**الوصف:** `tsconfig.json` يضبط `strict: true` ثم يُلغي صراحةً `strictNullChecks: false` و`noImplicitAny: false` و`strictBindCallApply: false` ([tsconfig.json:16-21](tsconfig.json#L16-L21)). الإلغاء الصريح يتغلّب على مظلّة `strict`، فالتحقّق من الـ null **مُعطَّل** بينما الكود يستخدم أنواعاً مثل `Date | null` و`string | null` في كل مكان (Entities، DTOs).

**التأثير:** أخطاء null/undefined لا يلتقطها المترجم — تتسرّب إلى وقت التشغيل بدل وقت البناء. هذه فجوة جودة/استقرار حقيقية في مشروع يُفترض أنه «production-ready».

**الإصلاح:** فعّل `strictNullChecks: true` (والأفضل `noImplicitAny: true`) وعالِج ما يظهر تدريجياً. هذا أعلى استثمار جودة/مخاطرة في المشروع.

---

# Medium Priority Issues

## M1 — `ensureSchemaExists` يتطلّب صلاحية CREATE وقد يفشل على Postgres مُدار
عند الإقلاع في الإنتاج يُفتح اتصال `pg` مباشر وينفّذ `CREATE SCHEMA IF NOT EXISTS` بمستخدم التطبيق ([app-database.bootstrap.ts:56-76](src/infrastructure/database/app-database.bootstrap.ts#L56-L76)، [app-database.module.ts:32](src/infrastructure/database/app-database.module.ts#L32)). كثير من مزوّدي Postgres المُدار يمنحون دوراً لا يملك CREATE على قاعدة البيانات أو يفرضون مخطّطاً مُهيّأً مسبقاً → **انهيار إقلاع**. الإصلاح: اجعل إنشاء المخطّط خطوة توفير (provisioning) خارجية، أو اجعل الفشل هنا غير قاتل عندما يكون المخطّط موجوداً.

## M2 — تعذّر إنشاء أوّل Admin في إنتاج Docker
`seed:prod` = `npm run build && node dist/...` ([package.json:34](package.json#L34))، و`npm run build` يحتاج devDependencies غير الموجودة في صورة الإنتاج. لا يوجد مسار موثّق لإنشاء أوّل admin بعد النشر. الإصلاح: شغّل `node dist/scripts/seed/seed.script.js` مباشرةً (الـ dist مبنيّ مسبقاً في مرحلة الـ builder) كخطوة منفصلة، أو أنشئ هدف seed لا يعيد البناء. (ملاحظة إيجابية: `DatabaseCleaner` يتخطّى الإنتاج بأمان — [database-cleaner.ts:15-18](src/scripts/seed/database-cleaner.ts#L15-L18) — فلا خطر فقدان بيانات من الـ seed.)

## M3 — بحث الـ Admin بـ `ILIKE '%term%'` يُجبر Full Table Scan
[user.repository.ts:44-49](src/modules/users/repositories/user.repository.ts#L44-L49) يستخدم نمطاً ببادئة `%` فلا يستفيد من أي فهرس B-Tree. مقبول على جداول صغيرة، لكنه يتدهور خطّياً مع نموّ جدول المستخدمين. الإصلاح عند الحاجة: فهرس `pg_trgm` GIN على الأعمدة المبحوثة. (إيجابي: الاستعلام **مُعامَل بالكامل** — لا حقن SQL.)

## M4 — استرجاع رابط الصورة لكل صفّ في قوائم الـ Admin (شبه N+1)
[admin-user.controller.ts:31-33](src/modules/users/controllers/admin-user.controller.ts#L31-L33) → `buildResponseDto` لكل مستخدم → `resolvePhotoUrl` → `storageService.getAccessUrl`. للصور العامة (avatars تُرفع بـ `Visibility.PUBLIC`) لا يوجد نداء شبكي، لكنه ما يزال `await` لكل صفّ. لو تحوّل أي مسار مستقبلاً إلى روابط موقّعة من Supabase لكل صفّ، تتحوّل إلى N نداءات. راقِب ذلك عند توسعة القوائم.

## M5 — عدّاد إصدار OTP يزداد حتى عند فشل التسليم → قفل ذاتي محتمل
في [otp.service.ts:68-113](src/modules/otps/services/otp.service.ts#L68-L113) يُحفظ الكود ويُحتسب ضمن `countRequestsSince` حتى لو فشل تسليم WhatsApp (يُعاد `dispatchWarning`). أثناء انقطاع WhatsApp، يُحتسب المستخدم سقف الإصدار (3/ساعة في الإنتاج) دون أن يصله أي كود → قفل ذاتي. مقايضة توافر مقبولة لكنها تستحق التوثيق/المراقبة.

## M6 — مدّة Access Token في التطوير 30 يوماً
[.env.development:44](env/.env.development#L44) تضبط `JWT_ACCESS_EXPIRES_IN_SECONDS=2592000`. قيمة الإنتاج في القالب سليمة (900ث). تأكّد ألّا تتسرّب قيمة التطوير إلى أي بيئة مكشوفة؛ التوكنات المسروقة تبقى صالحة 30 يوماً لأن الـ access token عديم الحالة (راجع التوصيات الأمنية).

---

# Low Priority Issues

- **L1 — كود ميّت:** `RefreshTokenRepository.markRotated` غير مُستخدَم (التدوير يتم inline داخل Transaction الخدمة). [refresh-token.repository.ts:35-37](src/modules/refresh-tokens/repositories/refresh-token.repository.ts#L35-L37)
- **L2 — تضارب طول الهاتف:** `users.phone` بطول 20، و`otps.phone` بطول 32. توحيدها أنظف. [user.entity.ts:10](src/modules/users/entities/user.entity.ts#L10) مقابل migration `otps`.
- **L3 — `AccessTokenPayload.role?` اختياري** رغم أنه يُضبط دائماً ([access-token-payload.interface.ts:9](src/infrastructure/jwt/interfaces/access-token-payload.interface.ts#L9)). اجعله إلزامياً لتقوية النوع.
- **L4 — Readiness عام:** `/healthz/ready` يكشف حالة قاعدة البيانات (up/down) للعامة ([health.controller.ts:38-42](src/infrastructure/health/health.controller.ts#L38-L42)). لا تسريب أسرار، لكن فكّر في تقييده خلف الشبكة الداخلية.
- **L5 — ضغط الاستجابات (BREACH نظري):** `compression()` مفعّل عالمياً، واستجابات تسجيل الدخول/التحديث تحتوي توكنات. الخطر منخفض جداً (لا CSRF token، Bearer-only)، لكن يمكن استثناء مسارات المصادقة من الضغط احترازياً. [configure-security.ts:31](src/bootstrap/configure-security.ts#L31)
- **L6 — Refresh tokens بلا FK:** الجدول متعدّد الأدوار (`user_id` + `role`) فلا FK ممكن؛ التوكنات اليتيمة تُقلَّم بالانتهاء. تصميم مقصود — للتوثيق فقط.

---

# Architecture Recommendations

البنية ممتازة؛ التوصيات تحسينية لا إصلاحية:

1. **حافِظ على نمط الـ Registry للـ Auth** ([user-resolver.registry.ts](src/core/auth/user-resolver.registry.ts)) — يفصل الـ Guard عن مستودعات الأدوار بأناقة. نموذج يُحتذى عند إضافة أدوار جديدة.
2. **اجعل اختلاف dev/prod في بناء المخطّط مرئياً:** الاعتماد على `synchronize` في التطوير و`migrations` في الإنتاج هو مصدر «الانحراف الصامت» (schema drift). أضف خطوة CI تُقلع على Postgres حقيقي بـ `synchronize:false` وتُشغّل الـ Migrations فعلاً، لتلتقط الانحراف قبل الإنتاج.
3. **فصل المسؤوليات في الخدمات** مُطبَّق جيداً (auth/query/...). استمر بقاعدة «split at ~200 LOC» الواردة في `CLAUDE.md`.
4. **Coupling منخفض / Cohesion عالٍ:** ملكية الوحدات (كل Entity في وحدته، عبور بين الوحدات عبر الـ Service لا الـ Repository) مُحترمة باتّساق. ممتاز.

---

# Security Recommendations

نقاط القوة (للحفاظ عليها): تثبيت خوارزمية JWT على HS256 مع iss/aud ([app-jwt.service.ts:20-57](src/infrastructure/jwt/app-jwt.service.ts#L20-L57))؛ مصادقة fail-closed عالمية ([common-auth.module.ts:11-23](src/core/auth/common-auth.module.ts#L11-L23))؛ تدوير refresh tokens مع كشف إعادة الاستخدام وإلغاء شامل ([refresh-token.service.ts:62-113](src/modules/refresh-tokens/services/refresh-token.service.ts#L62-L113))؛ مقارنة كلمات مرور ثابتة الزمن ضد تعداد المستخدمين ([admin-auth.service.ts:59-62](src/modules/admins/services/admin-auth.service.ts#L59-L62))؛ تحقّق Magic Bytes للملفات ([mime-type.validator.ts](src/infrastructure/storage/validation/validators/mime-type.validator.ts))؛ حماية Path Traversal ([local-storage.controller.ts:48-53](src/infrastructure/storage/providers/local/local-storage.controller.ts#L48-L53)، [path.util.ts:3-16](src/infrastructure/storage/utils/path.util.ts#L3-L16))؛ توقيع HMAC ثابت الزمن للروابط ([local-signing.service.ts](src/infrastructure/storage/providers/local/local-signing.service.ts)).

التحسينات:

1. **أصلِح C2 (حدّ رفع الملفات) فوراً** — أوضح خطر أمني/توافري في المشروع.
2. **إبطال Access Token عند تغيير الصلاحيات:** الـ access token عديم الحالة وصالح حتى انتهائه (900ث) حتى بعد التعطيل/تغيير كلمة المرور. التعطيل يُلغي الـ refresh tokens ويُفرغ الـ cache ([user.service.ts:155-161](src/modules/users/services/user.service.ts#L155-L161)، [admin.service.ts:116-121](src/modules/admins/services/admin.service.ts#L116-L121)) — جيد. لتشديد أعلى: اربط `passwordChangedAt`/token-version داخل التوكن وتحقّق منه في الـ Guard لإبطال فوري.
3. **نافذة Cache للمصادقة (300ث):** كل مسارات التطبيق تُفرغ المفتاح عند التعطيل/تغيير الاعتماد، لكن أي تعديل مباشر على `is_active` في قاعدة البيانات يبقى مخدوماً من الـ cache حتى 300ث ([cache.constants.ts:24](src/infrastructure/cache/cache.constants.ts#L24)). مقبول، مع الانتباه.
4. **فعّل Redis في الإنتاج:** الافتراضي `CACHE_DRIVER=noop`، ما يعني أن عدّادات الـ throttle في الذاكرة لكل نسخة — مع عدّة نسخ يتضاعف السقف الفعلي N مرّة ويضعف الحماية من القوة الغاشمة ([app-throttle.module.ts:68-80](src/infrastructure/throttle/app-throttle.module.ts#L68-L80)). شغّل Redis لمشاركة العدّادات.

---

# Database Recommendations

1. **الفهارس جيّدة التغطية:** فهارس فريدة على `username`/`phone`، ومركّبة على `(user_id, role)` و`(phone, purpose, expires_at)`، وفهارس التنظيف على `expires_at`/`created_at`. ممتاز.
2. **قواعد الحذف صحيحة:** `RESTRICT` على `users.city_id` (يحفظ السجلّات)، و`CASCADE` على `areas.city_id` (تابع). متوافقة مع سياسة `CLAUDE.md`.
3. **انحراف المخطّط (Drift):** بسبب `synchronize:true` في التطوير، قد تحوي قاعدة التطوير أعمدة/فهارس لم تُنشئها الـ Migrations فلا تظهر في الإنتاج. أضف فحص parity (راجع توصية المعمارية رقم 2).
4. **البحث النصّي:** أضف `pg_trgm` عند الحاجة لبحث الـ Admin (راجع M3).
5. **اتّساق الأنواع:** وحّد طول عمود الهاتف عبر الجداول (راجع L2).

---

# Performance Recommendations

1. **Pagination حاضر** في القوائم القابلة للنموّ (users، areas) مع سقف `MAX_LIMIT` ([pagination-query.dto.ts:29](src/core/pagination/dto/pagination-query.dto.ts#L29)). قائمة المدن غير مُصفّحة لكنها جدول بحث محدود — مقبول.
2. **بحث ILIKE:** راجع M3 (فهرس trigram عند التوسّع).
3. **استرجاع روابط الصور لكل صفّ:** راجع M4 (تجميع/تخزين مؤقّت للروابط الموقّعة إن لزم).
4. **تفعيل التخزين المؤقّت:** الـ read-through cache للمصادقة يوفّر استعلام DB لكل Request مُصادَق عند تشغيل Redis ([jwt-auth.guard.ts:67-71](src/core/guards/jwt-auth.guard.ts#L67-L71)). الافتراضي noop يُلغي هذه الفائدة — فعّل Redis في الإنتاج.
5. **مهلة تسليم OTP غير حاجبة** ومضبوطة بـ `Promise.race` ([otp.service.ts:96-110](src/modules/otps/services/otp.service.ts#L96-L110)). جيد.

---

# Migration Failure Analysis

**الخلاصة:** الـ Migrations نفسها **سليمة** — تُترجَم إلى `dist/database/migrations/*.js`، و`tsc-alias` يحوّل مسارات الـ alias إلى مسارات نسبية صحيحة (تحقّقت: `require("../../infrastructure/database/migration-utils")` في [dist/.../1747600000001-Init.js:4](dist/database/migrations/1747600000001-Init.js#L4))، وTypeORM يتخطّى ملفات `.d.ts` (تحقّقت من `node_modules/typeorm/util/DirectoryExportedClassesLoader.js:44`). إذاً المشكلة **تشغيلية**، لا في كود الـ Migration.

الأسباب مرتّبة من الأرجح إلى الأقلّ:

### 1) متغيّرات البيئة غير مُحقَنة على الاستضافة (الأرجح)
ملف `env/.env.production` مستبعَد من Git ومن صورة Docker، والتطبيق يعتمد كلياً على `process.env` المُحقَن من المنصّة. نقص أي متغيّر حرج → فشل تحقّق zod عند الإقلاع → انهيار **قبل** تشغيل الـ Migrations، فيبدو وكأن «الـ Migrations لم تعمل».
**الإصلاح:** اضبط كل مفاتيح `env/.env.production.example` في لوحة الاستضافة. تحقّق من السجلّات بحثاً عن `Environment validation failed`.

### 2) اختلاف مسار بناء المخطّط dev↔prod (السبب البنيوي)
التطوير يبني المخطّط بـ `synchronize`؛ الإنتاج بالـ Migrations فقط. مسار الـ Migration لا يُختبَر قبل الإنتاج (لا e2e على DB). أي انحراف/افتراض مسبق ينكشف أوّل مرّة في الإنتاج.
**الإصلاح:** خطوة CI تُقلع على Postgres حقيقي بـ `synchronize:false` + تشغيل Migrations.

### 3) سباق Migrations عند تعدّد النسخ (راجع H1)
عدّة نسخ تُقلع معاً وتنفّذ `migrationsRun` بالتوازي بلا قفل → فشل DDL متقطّع.
**الإصلاح:** انقل الـ Migrations لخطوة نشر واحدة قبل التشغيل، واضبط `migrationsRun:false`.

### 4) محاولة تشغيل `migration:run` بالـ CLI في الإنتاج (راجع H2)
يفشل لغياب devDependencies (ts-node/TypeORM CLI) وغياب ملف env داخل الصورة.
**الإصلاح:** شغّل CLI على JS المُترجَم مع `-d dist/.../data-source.js` وقراءة env من `process.env`.

### 5) نقص صلاحية CREATE SCHEMA (راجع M1)
دور Postgres المُدار قد لا يملك CREATE → فشل `ensureSchemaExists` عند الإقلاع.
**الإصلاح:** هيّئ المخطّط خارجياً، أو اجعل الفشل غير قاتل عند وجود المخطّط.

### ماذا سيحدث في الإنتاج؟
مع `migrationsRun:true`، تُنفَّذ الـ Migrations داخل `TypeOrmModule.forRootAsync` **قبل** `app.listen`. أي فشل (Migration أو schema أو env) يمنع الإقلاع كلياً → لا يصل أي Request. لذلك تظهر الأعراض كـ«تعطّل كامل»/«الـ Migrations لا تعمل» وليست كخطأ Request مفرد.

---

# Final Production Score

| المحور | التقييم | الأساس |
|---|---|---|
| **Architecture** | **9.0 / 10** | بنية معيارية نظيفة، فصل مسؤوليات ممتاز، DI ونمط Registry أنيق، Coupling منخفض. خصم بسيط لاختلاف dev/prod في بناء المخطّط. |
| **Security** | **8.5 / 10** | مصادقة/ترخيص قويّان فعلاً، لا ثغرات حقن أو تصعيد صلاحيات. خصم لـ C2 (رفع الملفات) ومقايضة إبطال الـ access token ونافذة الـ cache. |
| **Database Design** | **8.0 / 10** | فهارس وقيود وقواعد حذف صحيحة. خصم لانحراف synchronize وبحث ILIKE وتضارب الأنواع. |
| **Performance** | **7.5 / 10** | Pagination ومهلات وread-through cache جيّدة. خصم لـ ILIKE وروابط الصور لكل صفّ وتعطيل الـ cache افتراضياً. |
| **Code Quality** | **8.5 / 10** | تسمية ومعايير وتعليقات منضبطة، اختبارات للمسارات الأمنية الحرجة. خصم لـ `strictNullChecks:false` وكود ميّت طفيف. |
| **Production Readiness** | **6.5 / 10** | التطبيق ناضج، لكن قصّة النشر فيها فجوات حقيقية (حقن env، حدّ الرفع، سباق Migrations، seeding أوّل admin). هذه هي ما تؤذيك فعلاً الآن. |

## التقييم النهائي: **8.0 / 10** — «جودة عالية، ليس جاهزاً للإطلاق بعد»

**التبرير المفصّل:**
الكود التطبيقي من بين الأفضل التي تُراجَع: قرارات أمنية واعية، معمارية نظيفة، التزام صارم بالاتّفاقيات، وغياب الأنماط السيّئة المعتادة (لا `console.log`، لا `try/catch` دفاعي عشوائي، لا تسريب أخطاء داخلية في الإنتاج — `context` يُجرَّد خارج وضع التطوير عبر [global-exception.filter.ts:35-37](src/core/filters/global-exception.filter.ts#L35-L37)).

لكن **الجاهزية للإنتاج محكومة بأضعف حلقاتها التشغيلية**، وهنا مكمن المشكلة التي تواجهها. لا تُطلِق قبل:

1. **إصلاح C2** — أضف `limits.fileSize` لكل ديكوريترات الرفع.
2. **حسم قصّة الـ Migrations/النشر** — افصلها عن إقلاع التطبيق، واضمن حقن env، واختبر المسار على Postgres حقيقي في CI (يحلّ C1 وH1–H3 وM1).
3. **توثيق إنشاء أوّل Admin** في الإنتاج (M2).
4. **تفعيل Redis** للـ cache والـ throttle عند تعدّد النسخ.
5. **تفعيل `strictNullChecks`** (H4) — أعلى عائد جودة/مخاطرة.

بعد هذه النقاط (كلها أيام عمل قليلة، لا إعادة تصميم)، يرتفع المشروع بثقة فوق عتبة الإطلاق.

---
*انتهى التقرير.*
