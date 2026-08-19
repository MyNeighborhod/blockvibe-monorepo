/**
 * Unsplash photo IDs for demo business logos (square crop via images.unsplash.com).
 * Two listings intentionally omit logos so monogram fallback stays visible in the UI.
 */
export const SKIP_LOGO_EMAILS = new Set([
  "demo-seed-44@example.com", // Typewriter Repair & Oddments
  "demo-seed-50@example.com", // Open Door Community Kitchen
])

/** email → Unsplash photo id (the part after `photo-`) */
export const UNSPLASH_LOGO_BY_EMAIL: Record<string, string> = {
  "demo-seed-01@example.com": "1565193566173-7a0ee3dbe261", // pottery
  "demo-seed-02@example.com": "1571068316344-75bc76f77890", // bike
  "demo-seed-03@example.com": "1471943311424-646960669fbc", // honey / bees
  "demo-seed-04@example.com": "1416879595882-3373a0480b5b", // garden plants
  "demo-seed-05@example.com": "1414235077428-338989a2e8c0", // restaurant food
  "demo-seed-06@example.com": "1514525253161-7a46d19cd819", // music / vinyl vibe
  "demo-seed-07@example.com": "1558618666-fcd25c85cd64", // sewing / fabric
  "demo-seed-08@example.com": "1516035069371-29a1b244cc32", // camera
  "demo-seed-09@example.com": "1548199973-03cce0bbc87b", // dog
  "demo-seed-10@example.com": "1455390582262-044cdead277a", // paper / books craft
  "demo-seed-11@example.com": "1513694203232-719a280e022f", // fireplace / warm interior
  "demo-seed-12@example.com": "1555507036-ab1f4038808a", // bagel / bakery
  "demo-seed-13@example.com": "1450101499163-c8848c66ca85", // legal / documents
  "demo-seed-14@example.com": "1503454537195-1dcabb73ffb9", // kids / pediatrics
  "demo-seed-15@example.com": "1530124566582-a618bc2615dc", // hardware tools
  "demo-seed-16@example.com": "1499209974431-9dddcece7f88", // calm / counseling
  "demo-seed-17@example.com": "1460661419201-fd4cecdf8a8b", // art gallery
  "demo-seed-18@example.com": "1495474472287-4d71bcdd2085", // coffee cafe
  "demo-seed-19@example.com": "1484100356142-db6ab6244067", // clothes / soft goods
  "demo-seed-20@example.com": "1572635196237-14b3f281503f", // glasses / eyewear
  "demo-seed-21@example.com": "1513104890138-7c749659a591", // pizza
  "demo-seed-22@example.com": "1497366216548-37526070297c", // design desk / office
  "demo-seed-23@example.com": "1546069901-ba9599a7e63c", // food / spices plate
  "demo-seed-24@example.com": "1513364776144-60967b0f800f", // youth art / paint
  "demo-seed-25@example.com": "1606811841689-23dfddce3e95", // dental
  "demo-seed-26@example.com": "1558618666-fcd25c85cd64", // sewing
  "demo-seed-27@example.com": "1563805042-7684c019e1cb", // ice cream
  "demo-seed-28@example.com": "1504148455328-c376907d081c", // home repair tools
  "demo-seed-29@example.com": "1542838132-92c53300491e", // grocery / produce
  "demo-seed-30@example.com": "1515488042361-ee00e0ddd4e4", // newborn soft
  "demo-seed-31@example.com": "1470229722913-7c0e2dbbafd3", // theatre / stage lights
  "demo-seed-32@example.com": "1554224155-6726b3ff858f", // accounting / desk
  "demo-seed-33@example.com": "1565299624946-b28f40a0ae38", // playful food / toys vibe
  "demo-seed-34@example.com": "1495474472287-4d71bcdd2085", // coffee roast / cafe
  "demo-seed-35@example.com": "1587300003388-59208cc962cb", // shelter pets
  "demo-seed-36@example.com": "1571019614242-c5c5dee9f50b", // physical therapy / stretch
  "demo-seed-37@example.com": "1611162617474-5b21e879e113", // ink / creative mark
  "demo-seed-38@example.com": "1621905252507-b35492cc74b4", // electrical work
  "demo-seed-39@example.com": "1455390582262-044cdead277a", // kids books
  "demo-seed-40@example.com": "1555507036-ab1f4038808a", // bread / bakery
  "demo-seed-41@example.com": "1522202176988-66273c2fd55f", // community / people
  "demo-seed-42@example.com": "1497366754035-f200968a6e72", // flowers / soft interior
  "demo-seed-43@example.com": "1571019613454-1cb2f99b2d8b", // climbing / athletic
  "demo-seed-45@example.com": "1517677208171-0bc6725a3e60", // laundry
  "demo-seed-46@example.com": "1510812431401-41d2bd2722f3", // wine
  "demo-seed-47@example.com": "1503676260728-1c00da094a0b", // tutoring / learning
  "demo-seed-48@example.com": "1416879595882-3373a0480b5b", // landscape / plants
  "demo-seed-49@example.com": "1556909114-f6e7ad7d3136", // home goods
}

export function unsplashLogoUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&q=80`
}

export function logoFilenameForEmail(email: string) {
  const n = email.match(/demo-seed-(\d+)/)?.[1]
  if (!n) return null
  return `demo-seed-${n}-logo.jpg`
}
