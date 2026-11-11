// Educational nutrition library — general, well-established information only.
// Rules for adding foods: no precise nutrient values without a verified source,
// no medical claims, no fabricated references or hadith text/numbering.
// Religious notes stay in `sunnah`, separate from scientific `sources`.

import type { Lang } from "./i18n";

export type CategoryId = "sunnah" | "iron" | "bones" | "heart" | "digestion" | "saudi";

export type LText = { ar: string; en: string };

export type Food = {
  id: string;
  emoji: string;
  name: LText;
  categories: CategoryId[];
  about: LText;
  nutrients: LText[];
  benefits: LText[];
  tip: LText;
  /** Religious context only — kept separate from scientific sources. */
  sunnah?: LText;
  sources: LText[];
  /** Matching interaction item key in the imported Juraa database (exact link, never inferred). */
  dbItem?: string;
};

export const CATEGORIES: { id: CategoryId; emoji: string }[] = [
  { id: "sunnah", emoji: "🌴" },
  { id: "iron", emoji: "🫘" },
  { id: "bones", emoji: "🥛" },
  { id: "heart", emoji: "❤️" },
  { id: "digestion", emoji: "🥣" },
  { id: "saudi", emoji: "🍲" },
];

const WHO: LText = { ar: "المبادئ العامة للغذاء الصحي — منظمة الصحة العالمية", en: "General healthy-diet guidance — World Health Organization" };
const MOH: LText = { ar: "الإرشادات الغذائية العامة — وزارة الصحة السعودية", en: "General dietary guidance — Saudi Ministry of Health" };

export const FOODS: Food[] = [
  {
    id: "dates",
    emoji: "🌴",
    name: { ar: "التمر", en: "Dates" },
    categories: ["sunnah"],
    about: {
      ar: "ثمرة نخيل التمر، غذاء أصيل في الجزيرة العربية منذ آلاف السنين، يؤكل رطباً أو تمراً مجففاً ويدخل في أطباق وحلويات كثيرة.",
      en: "The fruit of the date palm, a staple food in the Arabian Peninsula for thousands of years, eaten fresh or dried and used in many dishes.",
    },
    nutrients: [
      { ar: "كربوهيدرات وسكريات طبيعية تمنح طاقة سريعة", en: "Carbohydrates and natural sugars for quick energy" },
      { ar: "ألياف غذائية", en: "Dietary fiber" },
      { ar: "بوتاسيوم ومغنيسيوم ومعادن أخرى بكميات متفاوتة", en: "Potassium, magnesium and other minerals in varying amounts" },
    ],
    benefits: [
      { ar: "مصدر طاقة سريع مناسب قبل النشاط البدني أو بعده", en: "A quick energy source around physical activity" },
      { ar: "الألياف تدعم انتظام الهضم ضمن غذاء متوازن", en: "Fiber supports regular digestion as part of a balanced diet" },
    ],
    tip: {
      ar: "التمر غني بالسكريات الطبيعية؛ الاعتدال في الكمية مناسب خاصة لمن يتابع سكر الدم.",
      en: "Dates are rich in natural sugars; moderation matters, especially if you monitor blood sugar.",
    },
    sunnah: {
      ar: "التمر من الأطعمة المعروفة في السيرة والسنة النبوية، وورد ذكره في أحاديث كثيرة، ومن عادة كثير من المسلمين الإفطار عليه في رمضان.",
      en: "Dates are well known in the Prophetic tradition and mentioned in many hadiths; many Muslims customarily break their fast with them in Ramadan.",
    },
    sources: [WHO, MOH],
  },
  {
    id: "honey",
    emoji: "🍯",
    name: { ar: "العسل", en: "Honey" },
    categories: ["sunnah"],
    about: {
      ar: "غذاء طبيعي ينتجه النحل من رحيق الأزهار، استُخدم منذ القدم مُحلّياً وغذاءً في ثقافات كثيرة.",
      en: "A natural food made by bees from flower nectar, long used as a sweetener and food in many cultures.",
    },
    nutrients: [
      { ar: "سكريات طبيعية (فركتوز وجلوكوز بشكل رئيسي)", en: "Natural sugars (mainly fructose and glucose)" },
      { ar: "مركبات نباتية ومضادات أكسدة تختلف حسب مصدر الرحيق", en: "Plant compounds and antioxidants that vary with the nectar source" },
    ],
    benefits: [
      { ar: "بديل مُحلّي طبيعي ضمن كميات معتدلة", en: "A natural sweetener in moderate amounts" },
      { ar: "يُستخدم تقليدياً لتهدئة الحلق ضمن العناية العامة", en: "Traditionally used to soothe the throat as part of general care" },
    ],
    tip: {
      ar: "لا يُعطى العسل للأطفال دون عمر سنة. وهو سكريات مركّزة، فيُستهلك باعتدال.",
      en: "Never give honey to infants under one year. It is concentrated sugar, so enjoy in moderation.",
    },
    sunnah: {
      ar: "ورد ذكر العسل في القرآن الكريم وفي السنة النبوية بوصفه غذاءً نافعاً.",
      en: "Honey is mentioned in the Quran and the Prophetic tradition as a beneficial food.",
    },
    sources: [WHO, MOH],
  },
  {
    id: "olive-oil",
    emoji: "🫒",
    name: { ar: "زيت الزيتون", en: "Olive oil" },
    categories: ["sunnah", "heart"],
    about: {
      ar: "زيت يُعصر من ثمار الزيتون، ركن أساسي في مطبخ حوض البحر المتوسط ويُستخدم في الطبخ والسلطات.",
      en: "Oil pressed from olives, a cornerstone of Mediterranean cooking, used in cooking and salads.",
    },
    nutrients: [
      { ar: "دهون أحادية غير مشبعة", en: "Monounsaturated fats" },
      { ar: "مركبات فينولية ومضادات أكسدة، وأعلى تركيز لها في البكر الممتاز", en: "Phenolic compounds and antioxidants, highest in extra-virgin grades" },
      { ar: "فيتامين هـ", en: "Vitamin E" },
    ],
    benefits: [
      { ar: "استبدال الدهون المشبعة بدهون غير مشبعة ضمن نمط غذائي متوازن يدعم صحة القلب", en: "Replacing saturated fats with unsaturated fats in a balanced diet supports heart health" },
    ],
    tip: {
      ar: "الزيت غني بالسعرات؛ ملعقة أو ملعقتان ضمن اليوم تكفي غالباً ضمن غذاء متوازن.",
      en: "Oils are calorie-dense; a spoonful or two a day is usually enough within a balanced diet.",
    },
    sunnah: {
      ar: "شجرة الزيتون شجرة مباركة ورد ذكرها في القرآن الكريم، واشتهر استخدام زيتها في التراث.",
      en: "The olive tree is described as blessed in the Quran, and its oil has long been used in the tradition.",
    },
    sources: [WHO, MOH],
  },
  {
    id: "lentils",
    emoji: "🫘",
    name: { ar: "العدس", en: "Lentils" },
    categories: ["iron"],
    about: {
      ar: "بقوليات صغيرة سريعة الطهي، شائعة في الشوربات والأطباق الشعبية، ومن أقدم المحاصيل التي زرعها الإنسان.",
      en: "Small, quick-cooking legumes common in soups and traditional dishes, among the oldest crops cultivated by humans.",
    },
    nutrients: [
      { ar: "بروتين نباتي", en: "Plant protein" },
      { ar: "حديد وفولات", en: "Iron and folate" },
      { ar: "ألياف غذائية وكربوهيدرات معقدة", en: "Dietary fiber and complex carbohydrates" },
    ],
    benefits: [
      { ar: "مصدر نباتي جيد للحديد ضمن غذاء متنوع", en: "A good plant source of iron within a varied diet" },
      { ar: "الألياف والبروتين يساعدان على الشعور بالشبع", en: "Fiber and protein help you feel full" },
    ],
    tip: {
      ar: "فيتامين ج (مثل الليمون أو الفلفل مع الوجبة) يساعد الجسم على الاستفادة من الحديد النباتي بشكل أفضل.",
      en: "Vitamin C (like lemon or peppers with the meal) helps the body absorb plant-based iron better.",
    },
    sources: [WHO, MOH],
  },
  {
    id: "oats",
    emoji: "🌾",
    name: { ar: "الشوفان", en: "Oats" },
    categories: ["heart", "digestion"],
    about: {
      ar: "حبوب كاملة تؤكل رقائق أو دقيقاً، تشتهر بوجبة الفطور وتدخل في المخبوزات والشوربات.",
      en: "A whole grain eaten as flakes or flour, famous at breakfast and used in baking and soups.",
    },
    nutrients: [
      { ar: "ألياف ذائبة (بيتا جلوكان)", en: "Soluble fiber (beta-glucan)" },
      { ar: "كربوهيدرات معقدة وبروتين نباتي", en: "Complex carbohydrates and plant protein" },
      { ar: "منغنيز وفوسفور وفيتامينات ب", en: "Manganese, phosphorus and B vitamins" },
    ],
    benefits: [
      { ar: "الحبوب الكاملة والألياف ضمن الغذاء اليومي تدعم صحة القلب والهضم", en: "Whole grains and fiber in the daily diet support heart and digestive health" },
      { ar: "وجبة مشبعة تساعد على تنظيم الشهية", en: "A filling meal that helps regulate appetite" },
    ],
    tip: {
      ar: "اختر الشوفان الطبيعي غير المحلّى؛ الأنواع الجاهزة المنكّهة قد تحوي سكراً مضافاً كثيراً.",
      en: "Choose plain, unsweetened oats; flavored instant varieties can carry a lot of added sugar.",
    },
    sources: [WHO, MOH],
  },
  {
    id: "milk",
    dbItem: "dairy",
    emoji: "🥛",
    name: { ar: "الحليب", en: "Milk" },
    categories: ["bones"],
    about: {
      ar: "مشروب أساسي في الغذاء اليومي حول العالم، ومصدر رئيسي للكالسيوم في كثير من الأنماط الغذائية.",
      en: "A daily dietary staple worldwide and a main source of calcium in many eating patterns.",
    },
    nutrients: [
      { ar: "كالسيوم وفوسفور", en: "Calcium and phosphorus" },
      { ar: "بروتين عالي الجودة", en: "High-quality protein" },
      { ar: "فيتامين ب12، وكثير من الأنواع مدعّمة بفيتامين د", en: "Vitamin B12; many varieties are fortified with vitamin D" },
    ],
    benefits: [
      { ar: "الكالسيوم وفيتامين د والبروتين عناصر مهمة لصحة العظام ضمن غذاء متوازن", en: "Calcium, vitamin D and protein are important for bone health within a balanced diet" },
    ],
    tip: {
      ar: "من لا يتحمل اللاكتوز تتوفر له بدائل قليلة اللاكتوز أو نباتية مدعّمة بالكالسيوم.",
      en: "Those who don't tolerate lactose can choose lactose-free or calcium-fortified plant alternatives.",
    },
    sources: [WHO, MOH],
  },
  {
    id: "yogurt",
    dbItem: "dairy",
    emoji: "🥛",
    name: { ar: "الزبادي", en: "Yogurt" },
    categories: ["bones", "digestion"],
    about: {
      ar: "حليب مخمّر ببكتيريا نافعة، قوامه كثيف وطعمه لاذع، يؤكل وحده أو يدخل في أطباق كثيرة.",
      en: "Milk fermented with beneficial bacteria, thick and tangy, eaten on its own or used in many dishes.",
    },
    nutrients: [
      { ar: "كالسيوم وبروتين", en: "Calcium and protein" },
      { ar: "بكتيريا تخمير حية في الأنواع غير المبسترة بعد التخمير", en: "Live cultures in varieties not heat-treated after fermentation" },
      { ar: "فيتامين ب12 وريبوفلافين", en: "Vitamin B12 and riboflavin" },
    ],
    benefits: [
      { ar: "يدعم صحة العظام ضمن غذاء متوازن", en: "Supports bone health within a balanced diet" },
      { ar: "الألبان المخمّرة جزء شائع من الأنماط الغذائية المرتبطة بصحة الهضم", en: "Fermented dairy is a common part of eating patterns associated with digestive health" },
    ],
    tip: {
      ar: "الزبادي السادة خيار أفضل من المنكّه المحلّى؛ أضف فواكه طازجة بدلاً من السكر.",
      en: "Plain yogurt is a better choice than sweetened flavored kinds; add fresh fruit instead of sugar.",
    },
    sources: [WHO, MOH],
  },
  {
    id: "jareesh",
    emoji: "🍲",
    name: { ar: "الجريش", en: "Jareesh" },
    categories: ["saudi"],
    about: {
      ar: "طبق سعودي أصيل من القمح المجروش المطبوخ مع اللبن أو المرق، مشهور في نجد ويُقدَّم في المناسبات وشهر رمضان.",
      en: "A traditional Saudi dish of crushed wheat cooked with laban or broth, famous in Najd and served on occasions and in Ramadan.",
    },
    nutrients: [
      { ar: "قمح مجروش: كربوهيدرات معقدة وألياف", en: "Crushed wheat: complex carbohydrates and fiber" },
      { ar: "اللبن يضيف بروتيناً وكالسيوم", en: "Laban adds protein and calcium" },
    ],
    benefits: [
      { ar: "وجبة دافئة مشبعة تجمع الحبوب الكاملة مع الألبان", en: "A warm, filling meal combining whole grains with dairy" },
      { ar: "الألياف تدعم الهضم ضمن غذاء متوازن", en: "Fiber supports digestion within a balanced diet" },
    ],
    tip: {
      ar: "يُطهى الجريش أحياناً بسمن كثير؛ تخفيف الدهون المضافة يجعله أخف ضمن الوجبة اليومية.",
      en: "Jareesh is sometimes cooked with plenty of ghee; going lighter on added fat keeps it gentler within the day's meals.",
    },
    sources: [WHO, MOH],
  },
];

export const foodsByCategory = (c: CategoryId) => FOODS.filter((f) => f.categories.includes(c));

export function searchFoods(q: string, lang: Lang): Food[] {
  const s = q.trim().toLowerCase();
  if (!s) return FOODS;
  return FOODS.filter((f) => f.name.ar.includes(s) || f.name.en.toLowerCase().includes(s));
}
