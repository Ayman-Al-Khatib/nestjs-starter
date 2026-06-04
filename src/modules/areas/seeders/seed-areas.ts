import { INestApplicationContext, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AreaEntity } from '../entities/area.entity';

/**
 * Comprehensive area seeder for Syrian governorates. Creates realistic
 * areas with proper geographic distribution. Areas are upserted on
 * (city_id, name_en) to avoid duplicates across reruns.
 */
const areaSeeds: Pick<AreaEntity, 'cityId' | 'nameEn' | 'nameAr'>[] = [
  // Damascus (id: 1) - 15 areas
  { cityId: 1, nameEn: 'Old Damascus', nameAr: 'دمشق القديمة' },
  { cityId: 1, nameEn: 'Mezzeh', nameAr: 'المزة' },
  { cityId: 1, nameEn: 'Malki', nameAr: 'المالكي' },
  { cityId: 1, nameEn: 'Kafr Sousa', nameAr: 'كفرسوسة' },
  { cityId: 1, nameEn: 'Bab Touma', nameAr: 'باب توما' },
  { cityId: 1, nameEn: 'Al-Midan', nameAr: 'الميدان' },
  { cityId: 1, nameEn: 'Al-Qanawat', nameAr: 'القنوات' },
  { cityId: 1, nameEn: 'Sarouja', nameAr: 'ساروجة' },
  { cityId: 1, nameEn: 'Muhajirin', nameAr: 'المهاجرين' },
  { cityId: 1, nameEn: 'Rukn al-Din', nameAr: 'ركن الدين' },
  { cityId: 1, nameEn: 'Al-Shaghour', nameAr: 'الشاغور' },
  { cityId: 1, nameEn: 'Barzeh', nameAr: 'برزة' },
  { cityId: 1, nameEn: 'Jobar', nameAr: 'جوبر' },
  { cityId: 1, nameEn: 'Qaboun', nameAr: 'القابون' },
  { cityId: 1, nameEn: 'Yarmouk', nameAr: 'اليرموك' },

  // Rural Damascus (id: 2) - 15 areas
  { cityId: 2, nameEn: 'Douma', nameAr: 'دوما' },
  { cityId: 2, nameEn: 'Harasta', nameAr: 'حرستا' },
  { cityId: 2, nameEn: 'Zabadani', nameAr: 'الزبداني' },
  { cityId: 2, nameEn: 'Qudsaya', nameAr: 'قدسيا' },
  { cityId: 2, nameEn: 'Jaramana', nameAr: 'جرمانا' },
  { cityId: 2, nameEn: 'Sayyida Zeinab', nameAr: 'السيدة زينب' },
  { cityId: 2, nameEn: 'Al-Tall', nameAr: 'التل' },
  { cityId: 2, nameEn: 'Al-Nabk', nameAr: 'النبك' },
  { cityId: 2, nameEn: 'Yabroud', nameAr: 'يبرود' },
  { cityId: 2, nameEn: 'Qatana', nameAr: 'قطنا' },
  { cityId: 2, nameEn: 'Darayya', nameAr: 'داريا' },
  { cityId: 2, nameEn: 'Moadamiyat al-Sham', nameAr: 'معضمية الشام' },
  { cityId: 2, nameEn: 'Al-Kiswah', nameAr: 'الكسوة' },
  { cityId: 2, nameEn: 'Sahnaya', nameAr: 'صحنايا' },
  { cityId: 2, nameEn: 'Ashrafiyat Sahnaya', nameAr: 'أشرفية صحنايا' },

  // Aleppo (id: 3) - 15 areas
  { cityId: 3, nameEn: 'Old Aleppo', nameAr: 'حلب القديمة' },
  { cityId: 3, nameEn: 'Aziziyeh', nameAr: 'العزيزية' },
  { cityId: 3, nameEn: 'Sulaymaniyah', nameAr: 'السليمانية' },
  { cityId: 3, nameEn: 'Hamdaniyah', nameAr: 'الحمدانية' },
  { cityId: 3, nameEn: 'Khalidiyah', nameAr: 'الخالدية' },
  { cityId: 3, nameEn: 'Al-Jamilia', nameAr: 'الجميلية' },
  { cityId: 3, nameEn: 'Al-Mogambo', nameAr: 'الموكامبو' },
  { cityId: 3, nameEn: 'Al-Shahbaa', nameAr: 'الشهباء' },
  { cityId: 3, nameEn: 'Al-Furqan', nameAr: 'الفرقان' },
  { cityId: 3, nameEn: 'Al-Ansari', nameAr: 'الأنصاري' },
  { cityId: 3, nameEn: 'Al-Sakhour', nameAr: 'الصاخور' },
  { cityId: 3, nameEn: 'Al-Shaar', nameAr: 'الشعار' },
  { cityId: 3, nameEn: 'Hanano', nameAr: 'هنانو' },
  { cityId: 3, nameEn: 'Al-Nayrab', nameAr: 'النيرب' },
  { cityId: 3, nameEn: 'Saif al-Dawla', nameAr: 'سيف الدولة' },

  // Homs (id: 4) - 15 areas
  { cityId: 4, nameEn: 'Old Homs', nameAr: 'حمص القديمة' },
  { cityId: 4, nameEn: 'Inshaat', nameAr: 'الإنشاءات' },
  { cityId: 4, nameEn: 'Khaldiyeh', nameAr: 'الخالدية' },
  { cityId: 4, nameEn: 'Bab Amr', nameAr: 'باب عمرو' },
  { cityId: 4, nameEn: 'Al-Waer', nameAr: 'الوعر' },
  { cityId: 4, nameEn: 'Al-Ghouta', nameAr: 'الغوطة' },
  { cityId: 4, nameEn: 'Al-Hamra', nameAr: 'الحمراء' },
  { cityId: 4, nameEn: 'Al-Qusour', nameAr: 'القصور' },
  { cityId: 4, nameEn: 'Al-Bayada', nameAr: 'البياضة' },
  { cityId: 4, nameEn: 'Al-Zahra', nameAr: 'الزهراء' },
  { cityId: 4, nameEn: 'Akrama', nameAr: 'عكرمة' },
  { cityId: 4, nameEn: 'Al-Nuzha', nameAr: 'النزهة' },
  { cityId: 4, nameEn: 'Wadi al-Dahab', nameAr: 'وادي الذهب' },
  { cityId: 4, nameEn: 'Al-Midan', nameAr: 'الميدان' },
  { cityId: 4, nameEn: 'Al-Arman', nameAr: 'الأرمن' },

  // Hama (id: 5) - 15 areas
  { cityId: 5, nameEn: 'Old Hama', nameAr: 'حماة القديمة' },
  { cityId: 5, nameEn: 'Aziziyeh', nameAr: 'العزيزية' },
  { cityId: 5, nameEn: 'Jarajemeh', nameAr: 'الجراجمة' },
  { cityId: 5, nameEn: 'Al-Hader', nameAr: 'الحاضر' },
  { cityId: 5, nameEn: 'Al-Sabounia', nameAr: 'الصابونية' },
  { cityId: 5, nameEn: 'Al-Qusour', nameAr: 'القصور' },
  { cityId: 5, nameEn: 'Al-Andalus', nameAr: 'الأندلس' },
  { cityId: 5, nameEn: 'Al-Sharia', nameAr: 'الشريعة' },
  { cityId: 5, nameEn: 'Al-Fayhaa', nameAr: 'الفيحاء' },
  { cityId: 5, nameEn: 'Al-Baath', nameAr: 'البعث' },
  { cityId: 5, nameEn: 'Al-Karama', nameAr: 'الكرامة' },
  { cityId: 5, nameEn: 'Al-Nasr', nameAr: 'النصر' },
  { cityId: 5, nameEn: 'Al-Jalaa', nameAr: 'الجلاء' },
  { cityId: 5, nameEn: 'Al-Mahatta', nameAr: 'المحطة' },
  { cityId: 5, nameEn: 'Al-Baroudia', nameAr: 'البارودية' },

  // Latakia (id: 6) - 15 areas
  { cityId: 6, nameEn: 'Corniche', nameAr: 'الكورنيش' },
  { cityId: 6, nameEn: 'Ramel', nameAr: 'الرمل' },
  { cityId: 6, nameEn: 'Slibeh', nameAr: 'الصليبة' },
  { cityId: 6, nameEn: 'Ziraa', nameAr: 'الزراعة' },
  { cityId: 6, nameEn: "Al-Mashrou' al-Sabe'", nameAr: 'المشروع السابع' },
  { cityId: 6, nameEn: 'Al-Awqaf', nameAr: 'الأوقاف' },
  { cityId: 6, nameEn: 'Al-Sheikh Daher', nameAr: 'الشيخ ضاهر' },
  { cityId: 6, nameEn: 'Al-Tabiyat', nameAr: 'الطابيات' },
  { cityId: 6, nameEn: 'Al-Qalaa', nameAr: 'القلعة' },
  { cityId: 6, nameEn: "Al-Shati' al-Azraq", nameAr: 'الشاطئ الأزرق' },
  { cityId: 6, nameEn: 'Jableh', nameAr: 'جبلة' },
  { cityId: 6, nameEn: 'Al-Haffah', nameAr: 'الحفة' },
  { cityId: 6, nameEn: 'Al-Qardaha', nameAr: 'القرداحة' },
  { cityId: 6, nameEn: "Qastal Ma'af", nameAr: 'قسطل معاف' },
  { cityId: 6, nameEn: 'Salma', nameAr: 'سلمى' },

  // Tartus (id: 7) - 15 areas
  { cityId: 7, nameEn: 'Baniyas', nameAr: 'بانياس' },
  { cityId: 7, nameEn: 'Safita', nameAr: 'صافيتا' },
  { cityId: 7, nameEn: 'Dreikish', nameAr: 'دريكيش' },
  { cityId: 7, nameEn: 'Al-Ghamqa', nameAr: 'الغمقة' },
  { cityId: 7, nameEn: 'Al-Inshaat', nameAr: 'الإنشاءات' },
  { cityId: 7, nameEn: 'Al-Karama', nameAr: 'الكرامة' },
  { cityId: 7, nameEn: 'Al-Rimal', nameAr: 'الرمال' },
  { cityId: 7, nameEn: 'Al-Mina', nameAr: 'المينا' },
  { cityId: 7, nameEn: 'Al-Sheikh Saad', nameAr: 'الشيخ سعد' },
  { cityId: 7, nameEn: 'Al-Qadmus', nameAr: 'القدموس' },
  { cityId: 7, nameEn: 'Al-Shaykh Badr', nameAr: 'الشيخ بدر' },
  { cityId: 7, nameEn: 'Masyaf road', nameAr: 'طريق مصياف' },
  { cityId: 7, nameEn: 'Al-Hamidiyah', nameAr: 'الحميدية' },
  { cityId: 7, nameEn: 'Amrit', nameAr: 'عمريت' },
  { cityId: 7, nameEn: 'Arwad', nameAr: 'أرواد' },

  // Idlib (id: 8) - 15 areas
  { cityId: 8, nameEn: 'Old Idlib', nameAr: 'إدلب القديمة' },
  { cityId: 8, nameEn: 'Binnish', nameAr: 'بنش' },
  { cityId: 8, nameEn: 'Maarat', nameAr: 'معرة النعمان' },
  { cityId: 8, nameEn: 'Al-Thawra', nameAr: 'الثورة' },
  { cityId: 8, nameEn: 'Al-Qusour', nameAr: 'القصور' },
  { cityId: 8, nameEn: 'Al-Dabit', nameAr: 'الضبيط' },
  { cityId: 8, nameEn: 'Al-Jalaa', nameAr: 'الجلاء' },
  { cityId: 8, nameEn: 'Jisr al-Shughur', nameAr: 'جسر الشغور' },
  { cityId: 8, nameEn: 'Ariha', nameAr: 'أريحا' },
  { cityId: 8, nameEn: 'Harem', nameAr: 'حارم' },
  { cityId: 8, nameEn: 'Salqin', nameAr: 'سلقين' },
  { cityId: 8, nameEn: 'Kafr Nabl', nameAr: 'كفر نبل' },
  { cityId: 8, nameEn: 'Khan Shaykhun', nameAr: 'خان شيخون' },
  { cityId: 8, nameEn: 'Sarmada', nameAr: 'سرمدا' },
  { cityId: 8, nameEn: 'Dana', nameAr: 'الدانا' },

  // Daraa (id: 9) - 15 areas
  { cityId: 9, nameEn: 'Daraa al-Balad', nameAr: 'درعا البلد' },
  { cityId: 9, nameEn: 'Daraa al-Mahatta', nameAr: 'درعا المحطة' },
  { cityId: 9, nameEn: 'Bosra', nameAr: 'بصرى' },
  { cityId: 9, nameEn: 'Al-Sabil', nameAr: 'السبيل' },
  { cityId: 9, nameEn: 'Al-Matar', nameAr: 'المطار' },
  { cityId: 9, nameEn: 'Al-Kashif', nameAr: 'الكاشف' },
  { cityId: 9, nameEn: 'Al-Sahari', nameAr: 'الصحاري' },
  { cityId: 9, nameEn: 'Nawa', nameAr: 'نوى' },
  { cityId: 9, nameEn: 'Izra', nameAr: 'إزرع' },
  { cityId: 9, nameEn: 'Jasim', nameAr: 'جاسم' },
  { cityId: 9, nameEn: 'Inkhil', nameAr: 'إنخل' },
  { cityId: 9, nameEn: 'Al-Sanamayn', nameAr: 'الصنمين' },
  { cityId: 9, nameEn: 'Busra al-Sham', nameAr: 'بصرى الشام' },
  { cityId: 9, nameEn: 'Tafas', nameAr: 'طفس' },
  { cityId: 9, nameEn: "Da'el", nameAr: 'داعل' },

  // As-Suwayda (id: 10) - 15 areas
  { cityId: 10, nameEn: 'Salkhad', nameAr: 'صلخد' },
  { cityId: 10, nameEn: 'Shahba', nameAr: 'شهبا' },
  { cityId: 10, nameEn: 'Qanawat', nameAr: 'قنوات' },
  { cityId: 10, nameEn: 'Al-Nahda', nameAr: 'النهضة' },
  { cityId: 10, nameEn: 'Al-Jalaa', nameAr: 'الجلاء' },
  { cityId: 10, nameEn: 'Al-Iskan', nameAr: 'الإسكان' },
  { cityId: 10, nameEn: 'Al-Qalaa', nameAr: 'القلعة' },
  { cityId: 10, nameEn: 'Al-Mazraa', nameAr: 'المزرعة' },
  { cityId: 10, nameEn: 'Al-Qurayya', nameAr: 'القريا' },
  { cityId: 10, nameEn: 'Al-Ghariya', nameAr: 'الغارية' },
  { cityId: 10, nameEn: 'Al-Kafr', nameAr: 'الكفر' },
  { cityId: 10, nameEn: 'Al-Suwayda al-Gharbiya', nameAr: 'السويداء الغربية' },
  { cityId: 10, nameEn: 'Al-Mashnaqa', nameAr: 'المشنقة' },
  { cityId: 10, nameEn: 'Al-Thala', nameAr: 'الثعلة' },
  { cityId: 10, nameEn: 'Al-Musaifra', nameAr: 'المسيفرة' },

  // Quneitra (id: 11) - 15 areas
  { cityId: 11, nameEn: 'Khan Arnabeh', nameAr: 'خان أرنبة' },
  { cityId: 11, nameEn: 'Baath City', nameAr: 'مدينة البعث' },
  { cityId: 11, nameEn: 'Fiq', nameAr: 'فيق' },
  { cityId: 11, nameEn: 'Jaba', nameAr: 'جبا' },
  { cityId: 11, nameEn: 'Al-Rafid', nameAr: 'الرفيد' },
  { cityId: 11, nameEn: 'Beer Ajam', nameAr: 'بئر عجم' },
  { cityId: 11, nameEn: 'Bariqa', nameAr: 'بريقة' },
  { cityId: 11, nameEn: 'Hader', nameAr: 'حضر' },
  { cityId: 11, nameEn: 'Majdal Shams', nameAr: 'مجيدل شمس' },
  { cityId: 11, nameEn: 'Al-Qusaybah', nameAr: 'القصيبة' },
  { cityId: 11, nameEn: 'Ghadir al-Bustan', nameAr: 'غدير البستان' },
  { cityId: 11, nameEn: 'Al-Khashniyah', nameAr: 'الخشنية' },
  { cityId: 11, nameEn: "Nab' al-Sakhr", nameAr: 'نبع الصخر' },
  { cityId: 11, nameEn: 'Kodana', nameAr: 'كودنة' },
  { cityId: 11, nameEn: 'Al-Hurriyah', nameAr: 'الحرية' },

  // Ar-Raqqah (id: 12) - 15 areas
  { cityId: 12, nameEn: 'Old Raqqa', nameAr: 'الرقة القديمة' },
  { cityId: 12, nameEn: 'Meshlab', nameAr: 'المشلب' },
  { cityId: 12, nameEn: 'Romaniyeh', nameAr: 'الرومانية' },
  { cityId: 12, nameEn: 'Al-Thawra', nameAr: 'الثورة' },
  { cityId: 12, nameEn: 'Al-Mansour', nameAr: 'المنصور' },
  { cityId: 12, nameEn: 'Al-Rashid', nameAr: 'الرشيد' },
  { cityId: 12, nameEn: 'Al-Firdaws', nameAr: 'الفردوس' },
  { cityId: 12, nameEn: "Al-Dar'iya", nameAr: 'الدرعية' },
  { cityId: 12, nameEn: 'Al-Intifada', nameAr: 'الانتفاضة' },
  { cityId: 12, nameEn: 'Al-Rumeila', nameAr: 'الرميلة' },
  { cityId: 12, nameEn: 'Al-Tabqa', nameAr: 'الطبقة' },
  { cityId: 12, nameEn: 'Tell Abyad', nameAr: 'تل أبيض' },
  { cityId: 12, nameEn: "Ma'adan", nameAr: 'معدان' },
  { cityId: 12, nameEn: 'Ein Issa', nameAr: 'عين عيسى' },
  { cityId: 12, nameEn: 'Al-Sabkha', nameAr: 'السبخة' },

  // Deir ez-Zor (id: 13) - 15 areas
  { cityId: 13, nameEn: 'Qusour', nameAr: 'القصور' },
  { cityId: 13, nameEn: 'Hamidiyeh', nameAr: 'الحميدية' },
  { cityId: 13, nameEn: 'Jubeileh', nameAr: 'الجبيلة' },
  { cityId: 13, nameEn: 'Al-Rushdiya', nameAr: 'الرشدية' },
  { cityId: 13, nameEn: 'Al-Muwazafin', nameAr: 'الموظفين' },
  { cityId: 13, nameEn: 'Al-Jura', nameAr: 'الجورة' },
  { cityId: 13, nameEn: 'Al-Sheikh Yassin', nameAr: 'الشيخ ياسين' },
  { cityId: 13, nameEn: 'Al-Ardi', nameAr: 'العرضي' },
  { cityId: 13, nameEn: "Al-Sina'a", nameAr: 'الصناعة' },
  { cityId: 13, nameEn: 'Al-Matar al-Qadim', nameAr: 'المطار القديم' },
  { cityId: 13, nameEn: 'Mayadin', nameAr: 'الميادين' },
  { cityId: 13, nameEn: 'Abu Kamal', nameAr: 'البوكمال' },
  { cityId: 13, nameEn: 'Al-Asharah', nameAr: 'العشارة' },
  { cityId: 13, nameEn: 'Al-Basira', nameAr: 'البصيرة' },
  { cityId: 13, nameEn: 'Al-Kishkiya', nameAr: 'الكشكية' },

  // Al-Hasakah (id: 14) - 15 areas
  { cityId: 14, nameEn: 'Malikiyah', nameAr: 'المالكية' },
  { cityId: 14, nameEn: 'Ras al-Ayn', nameAr: 'رأس العين' },
  { cityId: 14, nameEn: 'Tel Tamr', nameAr: 'تل تمر' },
  { cityId: 14, nameEn: 'Al-Aziziya', nameAr: 'العزيزية' },
  { cityId: 14, nameEn: 'Al-Salhiya', nameAr: 'الصلحية' },
  { cityId: 14, nameEn: 'Al-Mufti', nameAr: 'المفتي' },
  { cityId: 14, nameEn: 'Al-Nashwa', nameAr: 'النشوة' },
  { cityId: 14, nameEn: 'Ghuwayran', nameAr: 'غويران' },
  { cityId: 14, nameEn: 'Qamishli', nameAr: 'القامشلي' },
  { cityId: 14, nameEn: 'Amuda', nameAr: 'عامودا' },
  { cityId: 14, nameEn: 'Al-Darbasiyah', nameAr: 'الدرباسية' },
  { cityId: 14, nameEn: 'Al-Shaddadi', nameAr: 'الشدادي' },
  { cityId: 14, nameEn: 'Al-Yaarubiyah', nameAr: 'اليعربية' },
  { cityId: 14, nameEn: 'Al-Jawadiyah', nameAr: 'الجوادية' },
  { cityId: 14, nameEn: 'Al-Qahtaniyah', nameAr: 'القحطانية' },
];

export async function seedAreas(app: INestApplicationContext): Promise<void> {
  const logger = new Logger('seedAreas');
  const dataSource = app.get(DataSource);
  const schema = (dataSource.options as PostgresConnectionOptions).schema ?? 'public';

  const values = areaSeeds
    .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
    .join(', ');

  await dataSource.query(
    `
    INSERT INTO "${schema}".areas (city_id, name_en, name_ar)
    VALUES ${values}
    ON CONFLICT (city_id, name_en) DO UPDATE
    SET name_ar = EXCLUDED.name_ar
    `,
    areaSeeds.flatMap((a) => [a.cityId, a.nameEn, a.nameAr]),
  );

  logger.debug(`Seeded ${areaSeeds.length} areas successfully.`);
}
