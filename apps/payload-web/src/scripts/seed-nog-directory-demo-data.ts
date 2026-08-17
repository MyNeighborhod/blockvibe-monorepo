/**
 * Demo business listings for NOG directory visual / layout testing.
 * Emails are stable keys so re-running the seed updates in place.
 */

export type DemoBusiness = {
  name: string
  address: string
  about: string
  hours: string
  website: string
  email: string
  phone: string
  categorySlug: string
  logoFilename?: string
  alt?: string
}

export const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    name: "Grand Avenue Cafe",
    address: "3100 Grand Ave, Des Moines, IA",
    about: `Grand Avenue Cafe began as a pop-up in a borrowed storefront during a bitter February, when neighbors kept asking where to get a serious pour-over without driving across town. Founders Mira Chen and Jordan Hale — a pastry cook and a former librarian — decided the answer was a bright corner on Grand with enough windows for winter light and a patio for summer mornings.

They source beans from Iowa and Midwest roasters, bake cinnamon rolls and savory hand pies before dawn, and keep a kids’ corner stocked with board books. The cafe hosts monthly “neighbor hours” where local makers sell small goods, and the tip jar funds classroom supplies for nearby schools.

Today the cafe is a morning staple for walkers, remote workers, and anyone who needs a familiar face with their latte. Mira still writes the chalkboard specials; Jordan still remembers most regulars’ orders by heart.`,
    hours: "Mon–Fri 7am–4pm · Sat–Sun 8am–3pm",
    website: "https://example.com/grand-ave-cafe",
    email: "demo-cafe@example.com",
    phone: "(515) 555-0101",
    categorySlug: "food-drink",
    logoFilename: "grand-avenue-cafe-logo.png",
    alt: "Grand Avenue Cafe Logo",
  },
  {
    name: "Ingersoll Book Nook",
    address: "2800 Ingersoll Ave, Des Moines, IA",
    about: `Ingersoll Book Nook grew out of a living-room lending library that spilled into hallways and then into a leased bay on Ingersoll. Co-founders Priya Nair and Sam Ortega wanted a place where kids could sprawl on rugs, teens could find queer and BIPOC authors without hunting the back shelf, and adults could linger without buying a coffee to justify the stay.

The shop prioritizes independent presses, Iowa writers, and gently used favorites. Weekend story hours fill the front window with parents and grandparents; Thursday evenings bring a quiet writing circle. Staff hand-sell recommendations the way good booksellers always have — by asking what you loved last, not what sold most this week.

Priya still opens boxes of new arrivals at the counter; Sam still writes the handwritten shelf-talkers that send strangers home with the right book.`,
    hours: "Tue–Sun 10am–6pm",
    website: "https://example.com/book-nook",
    email: "demo-books@example.com",
    phone: "(515) 555-0102",
    categorySlug: "shopping",
    logoFilename: "ingersoll-book-nook-logo.png",
    alt: "Ingersoll Book Nook Logo",
  },
  {
    name: "Studio North Wellness",
    address: "3500 Grand Ave, Des Moines, IA",
    about: `Studio North Wellness started when physical therapist Elena Vargas and yoga teacher Devon Brooks realized their clients kept asking for the same thing: a neighborhood space that treated recovery, strength, and stillness as one continuum. They renovated a long Grand Avenue room with soft light, accessible mats, and a small treatment suite in back.

Classes range from gentle morning mobility to strength-focused evenings; massage and bodywork sit alongside community workshops on sleep, stress, and aging well. Sliding-scale spots are held each week so cost is never the only gate.

Elena and Devon still teach most weeks, still greet newcomers at the door, and still believe wellness should feel like belonging — not a performance.`,
    hours: "Daily 6am–8pm",
    website: "https://example.com/studio-north",
    email: "demo-wellness@example.com",
    phone: "(515) 555-0103",
    categorySlug: "health-wellness",
    logoFilename: "studio-north-wellness-logo.png",
    alt: "Studio North Wellness Logo",
  },
  {
    name: "35th Street Pottery",
    address: "1421 35th St, Des Moines, IA",
    about: `35th Street Pottery began in a basement kiln that shook the floorboards every firing. Founder Leah Okonkwo, a ceramics MFA who returned to Des Moines to be closer to family, opened a street-level studio so neighbors could watch pots take shape and try a wheel without a formal class commitment.

The shop sells functional ware — mugs, bowls, planters — alongside experimental glaze work. Drop-in nights fill quickly; kids’ clay camps sell out each summer. Leah’s origin story is simple: she wanted making to feel ordinary again, not gated behind expensive workshops.

Walk in and you’ll smell wet clay and hear the wheel hum. Leah still throws most mornings before the gallery opens.`,
    hours: "Wed–Sat 11am–6pm · Sun 12–4pm",
    website: "https://example.com/35th-pottery",
    email: "demo-seed-01@example.com",
    phone: "(515) 555-0201",
    categorySlug: "arts-culture",
  },
  {
    name: "Northside Bike Co-op",
    address: "2901 Ingersoll Ave, Des Moines, IA",
    about: `Northside Bike Co-op started when three friends — Marcus Webb, Nina Soto, and Alex Kim — got tired of watching good bikes rust in alleys while neighbors priced out of new ones. They pooled tools, leased a narrow shop, and built a membership model: pay what you can for bench time, learn to wrench, leave with wheels that work.

Used bikes are refurbished and sold sliding-scale. Earn-a-bike programs for teens run each spring. The co-op’s founding belief hasn’t changed: mobility is a neighborhood asset, not a luxury brand.

Marcus still tunes brakes most Saturdays; Nina runs the parts counter; Alex teaches the Intro to Flat Repair class that somehow always fills.`,
    hours: "Tue–Fri 12–7pm · Sat 10am–4pm",
    website: "https://example.com/northside-bike",
    email: "demo-seed-02@example.com",
    phone: "(515) 555-0202",
    categorySlug: "services",
  },
  {
    name: "Honeycomb Honey Shop",
    address: "3205 Grand Ave, Des Moines, IA",
    about: `Honeycomb Honey Shop grew from backyard hives behind a bungalow near 31st. Beekeeper twins Rosa and Elena Duarte began selling jars at the farmers market, then opened a tiny storefront for honey, beeswax candles, and pollinator workshops.

Their origin story is sticky in the best way: a swarm landed in the wrong yard, they learned to keep bees to save it, and the neighborhood kept asking for more jars. Today they partner with local growers and teach kids why clover matters.

Rosa still bottles midweek; Elena still leads the spring “meet the hive” walks that sell out in an hour.`,
    hours: "Thu–Sun 10am–5pm",
    website: "https://example.com/honeycomb",
    email: "demo-seed-03@example.com",
    phone: "(515) 555-0203",
    categorySlug: "shopping",
  },
  {
    name: "Corner Lot Garden Center",
    address: "3800 Grand Ave, Des Moines, IA",
    about: `Corner Lot Garden Center occupies a former gas station lot that founders Theo and Aisha Rahman turned into raised beds, shade houses, and a potting shed cafe. They wanted plant advice without the big-box shuffle — someone who knows Des Moines clay and NOG microclimates.

Starter veggies, native perennials, and soil amendments share space with Saturday pruning demos. The origin story includes a failed first winter, a community mulch day that saved the season, and a chalkboard that still lists “what to plant this week.”

Theo still opens the gates at seven; Aisha still remembers which customers swore they couldn’t keep a fern alive — and now do.`,
    hours: "Mon–Sat 8am–6pm · Sun 10am–4pm",
    website: "https://example.com/corner-lot",
    email: "demo-seed-04@example.com",
    phone: "(515) 555-0204",
    categorySlug: "shopping",
  },
  {
    name: "Maple & Main Kitchen",
    address: "2715 Ingersoll Ave, Des Moines, IA",
    about: `Maple & Main Kitchen is chef Dani Morales’s answer to “where can we eat well without a reservation and a babysitter?” After years in hotel kitchens, Dani and partner Chris Park opened a counter-service spot focused on seasonal plates, kid-friendly sides, and a late-afternoon happy hour that actually welcomes strollers.

The origin story starts with a supper club in their garage that outgrew the driveway. Neighbors funded the build-out with small loans and sweat equity. Dani still writes the weekly menu on Sunday nights; Chris still runs the line when tickets stack up.`,
    hours: "Wed–Sun 11am–9pm",
    website: "https://example.com/maple-main",
    email: "demo-seed-05@example.com",
    phone: "(515) 555-0205",
    categorySlug: "food-drink",
  },
  {
    name: "Quiet Hour Records",
    address: "3012 Grand Ave, Des Moines, IA",
    about: `Quiet Hour Records began as a crate-digging obsession that filled an apartment until roommates staged an intervention. Owner Jules Benton opened a listening-room shop where you can audition vinyl before you buy, trade used LPs, and catch tiny acoustic sets on Friday nights.

Jules’s founding pitch was simple: music should be tactile again. The shop stocks jazz, indie, and a deep local section. Staff write reviews like love letters. Jules still flips the “open” sign, still prices the dollar bin, and still remembers who bought their first pressing here.`,
    hours: "Tue–Sat 11am–7pm · Sun 12–5pm",
    website: "https://example.com/quiet-hour",
    email: "demo-seed-06@example.com",
    phone: "(515) 555-0206",
    categorySlug: "shopping",
  },
  {
    name: "Harbor Street Tailoring",
    address: "3340 Ingersoll Ave, Des Moines, IA",
    about: `Harbor Street Tailoring is the second act of master tailor Yoon Park, who spent decades in a downtown shop before moving closer to home. The studio handles alterations, custom hems, and careful repairs that keep clothes in circulation instead of landfill.

Yoon’s origin story includes teaching apprentices who now run their own benches, and a soft policy: if a garment can be saved, they’ll try. Walk-ins are welcome for simple fixes; appointments for suits and formalwear. Yoon still sews most evenings while the radio plays quietly in the back.`,
    hours: "Mon–Fri 10am–6pm · Sat 10am–2pm",
    website: "https://example.com/harbor-tailor",
    email: "demo-seed-07@example.com",
    phone: "(515) 555-0207",
    categorySlug: "services",
  },
  {
    name: "Linden Lens Photography",
    address: "2918 Grand Ave, Des Moines, IA",
    about: `Linden Lens Photography grew from founder Maya Brooks’s habit of photographing porch concerts and block parties for free until neighbors insisted she charge something. She opened a small studio for portraits, family sessions, and documentation of neighborhood milestones.

Maya’s work favors natural light and unforced moments. Packages include digital galleries and print nights where families pick favorites together. She still shoots most weekends and still keeps a wall of neighborhood faces that makes first-time clients feel less like strangers.`,
    hours: "By appointment · Tue–Sat",
    website: "https://example.com/linden-lens",
    email: "demo-seed-08@example.com",
    phone: "(515) 555-0208",
    categorySlug: "services",
  },
  {
    name: "Westwood Veterinary Care",
    address: "3601 Grand Ave, Des Moines, IA",
    about: `Westwood Veterinary Care was founded by Dr. Hannah Lee and Dr. Omar Saleh after years in emergency clinics left them craving continuity — knowing patients across a lifetime, not just a crisis. Their clinic emphasizes calm exam rooms, transparent pricing, and house-call options for anxious pets.

The origin story includes a crowdfunding campaign for dental equipment and a mural painted by a local high-school art class. They host low-cost vaccine days twice a year. Hannah still does most feline exams; Omar still does the Saturday surgery list with the same careful checklist.`,
    hours: "Mon–Fri 8am–6pm · Sat 9am–1pm",
    website: "https://example.com/westwood-vet",
    email: "demo-seed-09@example.com",
    phone: "(515) 555-0209",
    categorySlug: "health-wellness",
  },
  {
    name: "Paper Crane Studio",
    address: "2750 Ingersoll Ave, Des Moines, IA",
    about: `Paper Crane Studio is printmaker Sofia Alvarez’s storefront for letterpress cards, custom invitations, and community print nights. Sofia learned the trade from her uncle in Mexico City and wanted a Des Moines shop where people could feel type under their fingers.

Workshops teach monoprints and simple binding. The gallery wall rotates local illustrators. Sofia’s founding belief: paper still matters in a swipe-heavy world. She still inks the presses before open and still packages every order with a tiny origami crane.`,
    hours: "Wed–Sat 11am–6pm",
    website: "https://example.com/paper-crane",
    email: "demo-seed-10@example.com",
    phone: "(515) 555-0210",
    categorySlug: "arts-culture",
  },
  {
    name: "Oak & Ember Fireplace Shop",
    address: "4020 Grand Ave, Des Moines, IA",
    about: `Oak & Ember began when mason brothers Will and Nate Keller realized half their chimney-repair calls ended with the same question: where do we get a screen that doesn’t look like a hardware-store afterthought? They opened a shop for hearths, tools, and honest advice about wood heat.

Seasonal workshops cover safe burning and stove maintenance. The origin story includes a winter when they delivered free screens to seniors after a neighborhood fundraiser. Will still does on-site installs; Nate still runs the counter with a mug that never empties.`,
    hours: "Mon–Sat 9am–5pm",
    website: "https://example.com/oak-ember",
    email: "demo-seed-11@example.com",
    phone: "(515) 555-0211",
    categorySlug: "shopping",
  },
  {
    name: "Sunrise Bagel Lab",
    address: "3155 Ingersoll Ave, Des Moines, IA",
    about: `Sunrise Bagel Lab is the project of baker twin siblings Kai and Rowan Ellis, who spent a year testing dough hydration in a rented church kitchen before signing a lease. They boil and bake overnight so the first tray hits the case at seven sharp.

Flavors rotate — everything, sesame, jalapeño cheddar, seasonal sweets — and schmear is made in-house. The founding story is pure stubbornness: they wanted New York-style chew without the flight. Kai still shapes dough; Rowan still argues about salt percentages on the whiteboard.`,
    hours: "Tue–Sun 7am–2pm",
    website: "https://example.com/sunrise-bagel",
    email: "demo-seed-12@example.com",
    phone: "(515) 555-0212",
    categorySlug: "food-drink",
  },
  {
    name: "Neighborhood Legal Aid Desk",
    address: "3400 Grand Ave, Des Moines, IA",
    about: `Neighborhood Legal Aid Desk is a nonprofit clinic founded by attorneys Carla Nguyen and Ben Ortiz after seeing too many eviction and consumer cases tip the wrong way for lack of early advice. They staff walk-in hours, notary help, and referral nights with volunteer lawyers.

The origin story starts in a church basement and moved to a bright storefront so clients wouldn’t feel hidden. Sliding-scale document prep and know-your-rights workshops are core. Carla still takes Monday intake; Ben still runs the Thursday housing clinic.`,
    hours: "Mon–Thu 10am–4pm · walk-ins welcome",
    website: "https://example.com/nlad",
    email: "demo-seed-13@example.com",
    phone: "(515) 555-0213",
    categorySlug: "organizations",
  },
  {
    name: "Bloom Pediatrics Group",
    address: "3702 Ingersoll Ave, Des Moines, IA",
    about: `Bloom Pediatrics Group was founded by Dr. Amira Hassan and Dr. Luke Brennan to bring unhurried well-child visits back to the neighborhood. Exam rooms have books and floor space; the waiting area feels more like a living room than a clinic.

They partner with local schools on asthma and vision screenings. The origin story includes a soft opening delayed by a blizzard — and families who showed up anyway with homemade muffins. Amira still does newborn rounds; Luke still leads the teen mental-health evenings.`,
    hours: "Mon–Fri 8am–5pm",
    website: "https://example.com/bloom-peds",
    email: "demo-seed-14@example.com",
    phone: "(515) 555-0214",
    categorySlug: "health-wellness",
  },
  {
    name: "Copper Nail Hardware",
    address: "2888 Grand Ave, Des Moines, IA",
    about: `Copper Nail Hardware is what happens when a third-generation hardware clerk, Rita Kowalski, inherits a building and refuses to let it become another empty storefront. She restocked fasteners, paint, and garden tools, then added a loaner tool library for neighbors who only need a tile saw once.

Rita’s origin story is practical: she knows which screws fail in Iowa humidity. Saturday clinics teach basic repairs. Rita still cuts keys herself and still walks customers to the exact bin instead of pointing vaguely down an aisle.`,
    hours: "Mon–Sat 8am–6pm · Sun 10am–3pm",
    website: "https://example.com/copper-nail",
    email: "demo-seed-15@example.com",
    phone: "(515) 555-0215",
    categorySlug: "shopping",
  },
  {
    name: "Riverbend Counseling Collective",
    address: "3520 Ingersoll Ave, Des Moines, IA",
    about: `Riverbend Counseling Collective is a group practice founded by therapists Jordan Miles and Priya Kapoor to offer sliding-scale therapy without the downtown parking tax. The collective includes clinicians who specialize in trauma, couples work, and LGBTQ+ affirming care.

They host free mental-health first-aid nights for parents and caregivers. The founding vision: care should be walkable. Jordan still carries a full caseload; Priya still trains interns who often stay in the neighborhood after licensure.`,
    hours: "Mon–Thu 9am–7pm · Fri 9am–3pm",
    website: "https://example.com/riverbend-counsel",
    email: "demo-seed-16@example.com",
    phone: "(515) 555-0216",
    categorySlug: "health-wellness",
  },
  {
    name: "Gallery 31",
    address: "3101 Grand Ave, Des Moines, IA",
    about: `Gallery 31 occupies a long, narrow room that curator Elise Fontaine transformed into rotating exhibitions of Iowa artists. Openings spill onto the sidewalk; First Fridays bring music and cheap wine in paper cups.

Elise founded the gallery after years of watching local talent leave for bigger cities. She keeps a flat commission for emerging artists and a mentorship circle for teens. Elise still hangs shows late at night and still writes wall text that sounds like a conversation, not a catalog.`,
    hours: "Thu–Sat 12–6pm · First Fridays until 9pm",
    website: "https://example.com/gallery-31",
    email: "demo-seed-17@example.com",
    phone: "(515) 555-0217",
    categorySlug: "arts-culture",
  },
  {
    name: "Transit Table Cafe",
    address: "2650 Ingersoll Ave, Des Moines, IA",
    about: `Transit Table Cafe sits near a busy bus stop on purpose. Founders Mei Lin and Omar Haddad wanted a place where transfer waits feel like a pause instead of a penalty — wifi, outlets, good soup, and staff who don’t rush you out.

The menu is compact: grain bowls, toast, and rotating soups. Profits fund bus-pass scholarships for neighborhood teens. Mei still bakes the focaccia; Omar still remembers which regulars need the quiet corner table.`,
    hours: "Mon–Fri 6:30am–6pm · Sat 8am–3pm",
    website: "https://example.com/transit-table",
    email: "demo-seed-18@example.com",
    phone: "(515) 555-0218",
    categorySlug: "food-drink",
  },
  {
    name: "North End Cleaners",
    address: "3455 Grand Ave, Des Moines, IA",
    about: `North End Cleaners is a family business run by the Ramos siblings — Ana, Luis, and Carmen — who modernized their parents’ dry-cleaning shop with eco solvents and a same-day route for elders who can’t carry bags.

Their origin story is loyalty: three generations of wedding dresses and work uniforms. They still press shirts with care and still keep a lost-and-found of buttons that somehow reunites with the right coat.`,
    hours: "Mon–Fri 7am–6pm · Sat 8am–2pm",
    website: "https://example.com/north-end-cleaners",
    email: "demo-seed-19@example.com",
    phone: "(515) 555-0219",
    categorySlug: "services",
  },
  {
    name: "Cedar Frame Optometry",
    address: "3290 Ingersoll Ave, Des Moines, IA",
    about: `Cedar Frame Optometry was founded by Dr. Noah Kim after noticing how many neighbors delayed eye exams for lack of nearby appointments. The clinic pairs thorough exams with a curated frame wall that includes budget and boutique options.

Noah hosts annual “kids see free screening” days with school partners. The founding ethos: clear vision shouldn’t require a long drive. Noah still does most fittings himself and still remembers who needs the extra-patient explanation.`,
    hours: "Tue–Fri 9am–5:30pm · Sat 9am–1pm",
    website: "https://example.com/cedar-frame",
    email: "demo-seed-20@example.com",
    phone: "(515) 555-0220",
    categorySlug: "health-wellness",
  },
  {
    name: "Brick Oven Pie Co.",
    address: "2980 Grand Ave, Des Moines, IA",
    about: `Brick Oven Pie Co. is chef Gina Torretti’s love letter to Neapolitan crust and Iowa tomatoes. She built a wood oven with friends over a long summer, then opened with a short menu that refuses to chase trends.

Tuesday is community pie night — buy one, donate one to a shelter partner. Gina’s origin story includes a failed food truck and a stubborn belief that dough needs time. She still opens the oven door herself and still argues that less cheese is more.`,
    hours: "Wed–Sun 4–9:30pm",
    website: "https://example.com/brick-oven-pie",
    email: "demo-seed-21@example.com",
    phone: "(515) 555-0221",
    categorySlug: "food-drink",
  },
  {
    name: "Folio Design Workshop",
    address: "3120 Ingersoll Ave, Des Moines, IA",
    about: `Folio Design Workshop is a co-working and client studio founded by graphic designers Tomas Reyes and Hannah Cole. They offer desk memberships, brand intensives for small businesses, and free monthly portfolio reviews for students.

The origin story: they met freelancing in coffee shops and wanted a room with better chairs and better critique. Tomas still leads type workshops; Hannah still takes on nonprofit pro-bono projects that keep the lights feeling purposeful.`,
    hours: "Mon–Fri 9am–6pm · membership access evenings",
    website: "https://example.com/folio-design",
    email: "demo-seed-22@example.com",
    phone: "(515) 555-0222",
    categorySlug: "services",
  },
  {
    name: "Saffron Spice Market",
    address: "3555 Grand Ave, Des Moines, IA",
    about: `Saffron Spice Market began when Farah and Amir Qureshi tired of driving across metro for spices that tasted like they remembered from home. Their shop stocks lentils, teas, flatbreads, and a wall of spices sold by the ounce.

Cooking demos on Sundays fill the aisle with cumin and chatter. The founding story is hospitality: strangers leave with recipes scribbled on brown paper. Farah still measures spices; Amir still insists you smell the cardamom before you buy.`,
    hours: "Mon–Sat 10am–7pm · Sun 11am–5pm",
    website: "https://example.com/saffron-spice",
    email: "demo-seed-23@example.com",
    phone: "(515) 555-0223",
    categorySlug: "shopping",
  },
  {
    name: "NOG Youth Arts Collective",
    address: "2805 Grand Ave, Des Moines, IA",
    about: `NOG Youth Arts Collective is a nonprofit founded by teaching artists Dee Morales and Samir Patel to give teens studio time, mentorship, and public walls for murals. Programs run after school and all summer.

The origin story includes a first mural that took three tries and a neighborhood vote that chose the final design. Dee still runs open-studio Fridays; Samir still writes the grants that keep kiln and paint budgets alive.`,
    hours: "Mon–Thu 3–7pm · Sat workshops by signup",
    website: "https://example.com/nog-youth-arts",
    email: "demo-seed-24@example.com",
    phone: "(515) 555-0224",
    categorySlug: "organizations",
  },
  {
    name: "Lantern Dental Studio",
    address: "3680 Ingersoll Ave, Des Moines, IA",
    about: `Lantern Dental Studio was opened by Dr. Elise Cho to replace a retired practice that left a gap on Ingersoll. She designed rooms with soft light and clear explanations — no surprise bills, no rushed hygiene lectures.

Elise partners with schools for sealant days. The founding promise: dentistry can feel humane. Elise still does the first consult for every new patient and still keeps evening slots for people who can’t leave work at noon.`,
    hours: "Mon–Thu 8am–5pm · Fri 8am–2pm",
    website: "https://example.com/lantern-dental",
    email: "demo-seed-25@example.com",
    phone: "(515) 555-0225",
    categorySlug: "health-wellness",
  },
  {
    name: "Thistle & Thread Sewing Bar",
    address: "3033 Grand Ave, Des Moines, IA",
    about: `Thistle & Thread is a sewing bar where you rent machine time, buy fabric by the yard, and learn from founder Clara Nguyen’s calm demos. Clara left a corporate job to teach people to mend and make again.

Beginner nights and kids’ camps keep the shop buzzing. Clara’s origin story: a grandmother’s Singer and a neighborhood that needed somewhere to sew without owning a machine. She still cuts patterns at the front table and still celebrates every first zipper.`,
    hours: "Tue–Sat 10am–6pm",
    website: "https://example.com/thistle-thread",
    email: "demo-seed-26@example.com",
    phone: "(515) 555-0226",
    categorySlug: "shopping",
  },
  {
    name: "Blue Porch Ice Cream",
    address: "3222 Ingersoll Ave, Des Moines, IA",
    about: `Blue Porch Ice Cream started as a backyard churn that became a line down the sidewalk. Founders Tess and Miles Harper turned a vacant bay into a scoop shop with rotating flavors named after local streets.

Dairy comes from regional farms; vegan options rotate weekly. The founding story is summer: sticky hands, porch swings, and a refusal to open year-round until they could do it right. Tess still invents flavors; Miles still runs the evening scoop rush.`,
    hours: "Daily 12–9pm (seasonal hours may vary)",
    website: "https://example.com/blue-porch",
    email: "demo-seed-27@example.com",
    phone: "(515) 555-0227",
    categorySlug: "food-drink",
  },
  {
    name: "Anchor Home Services",
    address: "3910 Grand Ave, Des Moines, IA",
    about: `Anchor Home Services is a handypeople collective founded by retired teacher Marlene Scott and electrician Ray Okada. They handle small jobs — grab bars, leaky faucets, porch lights — with transparent quotes and a senior discount that isn’t buried in fine print.

The origin story: Marlene kept getting calls from neighbors who didn’t know who to trust. Ray joined after fixing her porch for free. They still schedule carefully, still show up when they say they will, and still leave the workspace cleaner than they found it.`,
    hours: "Mon–Fri 8am–4pm · estimates by appointment",
    website: "https://example.com/anchor-home",
    email: "demo-seed-28@example.com",
    phone: "(515) 555-0228",
    categorySlug: "services",
  },
  {
    name: "Woven Basket Market",
    address: "2744 Grand Ave, Des Moines, IA",
    about: `Woven Basket Market is a zero-waste grocery experiment founded by siblings Lena and Theo Brooks. Bulk bins, package-free produce, and a refill wall for soap and detergent sit under string lights that make shopping feel less clinical.

They host “bring your jars” evenings with live music. The founding ethos: convenience shouldn’t cost the planet by default. Lena still stocks shelves before dawn; Theo still teaches kids how to weigh lentils without spilling half the bin.`,
    hours: "Mon–Sat 9am–7pm · Sun 10am–4pm",
    website: "https://example.com/woven-basket",
    email: "demo-seed-29@example.com",
    phone: "(515) 555-0229",
    categorySlug: "shopping",
  },
  {
    name: "Kindred Midwifery",
    address: "3412 Ingersoll Ave, Des Moines, IA",
    about: `Kindred Midwifery is a birth and postpartum practice founded by CNMs Sofia Reyes and Jordan Blake. They offer prenatal visits, home and birth-center support, and lactation help that continues long after the baby book photo.

Community classes cover partner support and newborn care. The founding story is advocacy: too many families felt rushed through hospital corridors. Sofia and Jordan still take night calls and still bring lasagna to new parents when the freezer runs empty.`,
    hours: "Clinic hours Mon–Thu · on-call for clients",
    website: "https://example.com/kindred-midwifery",
    email: "demo-seed-30@example.com",
    phone: "(515) 555-0230",
    categorySlug: "health-wellness",
  },
  {
    name: "Stage Door Community Theatre",
    address: "2855 Ingersoll Ave, Des Moines, IA",
    about: `Stage Door Community Theatre lives in a renovated storefront where founder director Amara Wells stages intimate plays with neighborhood casts. Tickets stay affordable; ushers are often the same kids who helped paint sets.

Amara founded Stage Door after years of commuting to larger houses and missing the faces next door. Workshops for teens run between seasons. Amara still blocks rehearsals with a pencil behind her ear and still cries (quietly) on opening night.`,
    hours: "Box office Wed–Sat 12–6pm · show nights vary",
    website: "https://example.com/stage-door",
    email: "demo-seed-31@example.com",
    phone: "(515) 555-0231",
    categorySlug: "arts-culture",
  },
  {
    name: "Pines Accounting Co-op",
    address: "3505 Grand Ave, Des Moines, IA",
    about: `Pines Accounting Co-op helps freelancers and micro-businesses stay solvent without corporate jargon. Founded by CPA twin sisters Naomi and Ruth Adler, the co-op offers bookkeeping memberships, tax prep, and quarterly “money nights” in plain English.

Their origin story: watching creative friends undercharge and overstress. Naomi still does payroll clinics; Ruth still demystifies quarterly estimates with coffee and whiteboard sketches.`,
    hours: "Mon–Fri 9am–5pm · evenings by appointment",
    website: "https://example.com/pines-accounting",
    email: "demo-seed-32@example.com",
    phone: "(515) 555-0232",
    categorySlug: "services",
  },
  {
    name: "Red Wagon Toy Exchange",
    address: "3066 Ingersoll Ave, Des Moines, IA",
    about: `Red Wagon Toy Exchange is a buy-sell-trade shop for kids’ gear founded by parents Jess and Cameron Holt. Strollers, puzzles, and gently used bikes cycle through so families aren’t buying everything brand-new.

Saturday swap events fill the sidewalk. The founding spark: a garage that overflowed after their kids outgrew everything at once. Jess still prices the dollar bin; Cameron still tests bikes in the alley before they hit the floor.`,
    hours: "Wed–Sat 10am–5pm · Sun 12–4pm",
    website: "https://example.com/red-wagon",
    email: "demo-seed-33@example.com",
    phone: "(515) 555-0233",
    categorySlug: "shopping",
  },
  {
    name: "Ember Coffee Roasters",
    address: "3188 Grand Ave, Des Moines, IA",
    about: `Ember Coffee Roasters is a micro-roastery and tasting bar founded by former chemist Priya Desai. She roasted in a garage until the HOA complained, then found a storefront with enough ventilation and personality for cupping tables.

Priya sources transparent lots and teaches home brewing without snobbery. The origin story is curiosity: she wanted to know why coffee tasted different every week. Priya still roasts midweek and still hosts free cuppings that somehow always run long.`,
    hours: "Mon–Fri 7am–4pm · Sat 8am–3pm",
    website: "https://example.com/ember-roasters",
    email: "demo-seed-34@example.com",
    phone: "(515) 555-0234",
    categorySlug: "food-drink",
  },
  {
    name: "Shelter Pet Partners",
    address: "3990 Ingersoll Ave, Des Moines, IA",
    about: `Shelter Pet Partners is a foster-and-adopt nonprofit founded by volunteers Keisha Brown and Dan Morales after a hard winter of overcrowded shelters. They run adoption weekends, foster training, and a small thrift corner that funds vet bills.

The origin story is one foster dog that became a movement. Keisha still coordinates transports; Dan still writes the adoption bios that somehow always make people cry in a good way.`,
    hours: "Adoption events Sat–Sun · office Tue–Thu 11am–4pm",
    website: "https://example.com/shelter-pet-partners",
    email: "demo-seed-35@example.com",
    phone: "(515) 555-0235",
    categorySlug: "organizations",
  },
  {
    name: "Northside Physical Therapy",
    address: "3625 Grand Ave, Des Moines, IA",
    about: `Northside Physical Therapy was founded by DPT Claire Nguyen to keep rehab close to home. The clinic emphasizes outdoor-progress walks when weather allows and home programs that fit real schedules.

Claire’s origin story includes recovering from her own injury and noticing how transport barriers delayed care. She still treats a full caseload and still schedules early slots for people who work second shift.`,
    hours: "Mon–Thu 7am–6pm · Fri 7am–2pm",
    website: "https://example.com/northside-pt",
    email: "demo-seed-36@example.com",
    phone: "(515) 555-0236",
    categorySlug: "health-wellness",
  },
  {
    name: "Ink & Iron Tattoo",
    address: "2922 Grand Ave, Des Moines, IA",
    about: `Ink & Iron Tattoo is a custom studio founded by artists Marco Silva and Riley Quinn. They specialize in fine-line and traditional work, with a strict consent-and-aftercare culture that makes first-timers feel less terrified.

Apprenticeships are rare and rigorous. The founding story: two friends who refused to open a shop that felt like a frat party. Marco still draws freehand; Riley still does the consults that turn vague ideas into something wearable for decades.`,
    hours: "Tue–Sat 12–8pm · by appointment",
    website: "https://example.com/ink-iron",
    email: "demo-seed-37@example.com",
    phone: "(515) 555-0237",
    categorySlug: "arts-culture",
  },
  {
    name: "Greenline Electric Co.",
    address: "3844 Ingersoll Ave, Des Moines, IA",
    about: `Greenline Electric Co. is a woman-owned electrical shop founded by licensed electrician Dana Ortiz. She focuses on panel upgrades, EV charger installs, and honest assessments when a house’s wiring is older than the maple out front.

Dana’s origin story: apprenticeships where she was the only woman on the jobsite — and a vow to train differently. She still does estimates herself and still leaves labeled breakers so the next person isn’t guessing.`,
    hours: "Mon–Fri 8am–4:30pm",
    website: "https://example.com/greenline-electric",
    email: "demo-seed-38@example.com",
    phone: "(515) 555-0238",
    categorySlug: "services",
  },
  {
    name: "Harbor Light Books for Kids",
    address: "2677 Grand Ave, Des Moines, IA",
    about: `Harbor Light Books for Kids is a children’s bookstore founded by former teacher Miriam Ellis. The shop is sorted by age and curiosity, not just bestsellers, with a reading loft that invites sprawling.

Miriam hosts author visits and bilingual story times. The founding belief: kids who see themselves in books become adults who read the room. Miriam still wraps gifts at the counter and still remembers which dinosaur book cured last week’s bedtime wars.`,
    hours: "Tue–Sat 10am–6pm · Sun 11am–4pm",
    website: "https://example.com/harbor-light-kids",
    email: "demo-seed-39@example.com",
    phone: "(515) 555-0239",
    categorySlug: "shopping",
  },
  {
    name: "Crescent Bakery & Bread Club",
    address: "3311 Ingersoll Ave, Des Moines, IA",
    about: `Crescent Bakery & Bread Club is baker Leo Santos’s sourdough temple. Memberships reserve weekly loaves; the walk-up case sells sticky buns and focaccia that disappear by noon.

Leo learned bread from his grandmother and a stubborn starter named Hector. The founding story includes a pandemic bake-sale that funded the oven. Leo still shapes dough before sunrise and still teaches the Saturday bread club like a gentle science class.`,
    hours: "Wed–Sun 7am–1pm",
    website: "https://example.com/crescent-bakery",
    email: "demo-seed-40@example.com",
    phone: "(515) 555-0240",
    categorySlug: "food-drink",
  },
  {
    name: "Alliance for Aging Neighbors",
    address: "3750 Grand Ave, Des Moines, IA",
    about: `Alliance for Aging Neighbors is a mutual-aid nonprofit founded by social worker Patrice Coleman and retired nurse Bill Nguyen. They coordinate rides, grocery help, tech tutoring, and friendly check-ins for older residents who want to age in place.

The origin story is a winter ice storm and a phone tree that worked too well to shut down. Patrice still runs volunteer training; Bill still does blood-pressure clinics in the front room on Thursdays.`,
    hours: "Mon–Fri 9am–4pm · helpline evenings",
    website: "https://example.com/alliance-aging",
    email: "demo-seed-41@example.com",
    phone: "(515) 555-0241",
    categorySlug: "organizations",
  },
  {
    name: "North Grove Florist",
    address: "3099 Grand Ave, Des Moines, IA",
    about: `North Grove Florist is florist Ava Kim’s studio for weekly subscriptions, event work, and walk-in bouquets that don’t look like grocery-store afterthoughts. Ava sources seasonally and composts trimmings with a partner garden.

Workshops teach simple arranging for non-experts. Ava’s origin story: a funeral arrangement that made a stranger cry in relief — beauty as care. She still builds most arrangements herself and still delivers on a bicycle when traffic cooperates.`,
    hours: "Tue–Fri 9am–6pm · Sat 9am–3pm",
    website: "https://example.com/north-grove-florist",
    email: "demo-seed-42@example.com",
    phone: "(515) 555-0242",
    categorySlug: "shopping",
  },
  {
    name: "Summit Climbing Gym",
    address: "4100 Ingersoll Ave, Des Moines, IA",
    about: `Summit Climbing Gym was founded by athletes Reese Dalton and Mia Park to bring affordable climbing indoors without a corporate membership maze. Walls include beginner routes and a kids’ zone that feels more playground than pressure cooker.

Community nights and adaptive climbing sessions are baked into the calendar. The founding story: a warehouse lease nobody else wanted and a lot of volunteer painting. Reese still sets routes; Mia still teaches the intro class that converts skeptics.`,
    hours: "Mon–Fri 6am–10pm · Sat–Sun 8am–8pm",
    website: "https://example.com/summit-climb",
    email: "demo-seed-43@example.com",
    phone: "(515) 555-0243",
    categorySlug: "health-wellness",
  },
  {
    name: "Typewriter Repair & Oddments",
    address: "2810 Grand Ave, Des Moines, IA",
    about: `Typewriter Repair & Oddments is mechanic and collector Harvey Lin’s shop for resurrecting old machines and selling odd stationery. Harvey learned from his grandfather and refuses to call anything “obsolete” if it still clicks.

Workshops teach ribbon changes and basic cleaning. Harvey’s origin story is a thrift-store Underwood that still types love letters. He still oils machines on the back bench and still lets kids type their names for free.`,
    hours: "Thu–Sat 11am–5pm",
    website: "https://example.com/typewriter-oddments",
    email: "demo-seed-44@example.com",
    phone: "(515) 555-0244",
    categorySlug: "arts-culture",
  },
  {
    name: "Lakeview Laundry & Lounge",
    address: "3488 Ingersoll Ave, Des Moines, IA",
    about: `Lakeview Laundry & Lounge turned a grimy laundromat into a place with good lighting, a reading nook, and coffee while you wait. Founders Nina and Carl Vega wanted chores to feel less like punishment.

They offer fold-and-drop service for busy neighbors and free detergent packets for anyone who asks without paperwork. Nina still restocks the magazine pile; Carl still unjams machines with the patience of a saint.`,
    hours: "Daily 7am–10pm",
    website: "https://example.com/lakeview-laundry",
    email: "demo-seed-45@example.com",
    phone: "(515) 555-0245",
    categorySlug: "services",
  },
  {
    name: "Patio Tomato Wine Bar",
    address: "3199 Grand Ave, Des Moines, IA",
    about: `Patio Tomato Wine Bar is sommelier-turned-neighbor Isabel Ruiz’s small natural-wine room with a tomato-forward snack menu. She wanted a place where you can learn about wine without a performance of expertise.

Isabel’s origin story includes a failed downtown concept and a vow to keep it walkable. She still pours most flights herself and still hosts Sunday “ask me anything” tastings that run on curiosity, not pretense.`,
    hours: "Wed–Thu 4–10pm · Fri–Sat 4–11pm · Sun 2–8pm",
    website: "https://example.com/patio-tomato",
    email: "demo-seed-46@example.com",
    phone: "(515) 555-0246",
    categorySlug: "food-drink",
  },
  {
    name: "Brightside Tutoring Hub",
    address: "3666 Grand Ave, Des Moines, IA",
    about: `Brightside Tutoring Hub is an education nonprofit founded by teachers Malik Johnson and Sara Okonkwo. They offer sliding-scale tutoring, homework clubs, and SAT/ACT prep without predatory pricing.

The origin story: pandemic learning gaps that didn’t close on their own. Malik still tutors algebra; Sara still trains volunteer tutors who often become mentors for years.`,
    hours: "Mon–Thu 3–7pm · Sat 10am–2pm",
    website: "https://example.com/brightside-tutoring",
    email: "demo-seed-47@example.com",
    phone: "(515) 555-0247",
    categorySlug: "organizations",
  },
  {
    name: "Moss & Stone Landscape",
    address: "4055 Grand Ave, Des Moines, IA",
    about: `Moss & Stone Landscape is a design-build studio founded by horticulturist Lila Chen and mason Drew Patel. They specialize in native plantings, rain gardens, and small hardscape projects that suit older neighborhood lots.

Consults start with soil and sun, not Pinterest boards. Lila’s founding belief: landscapes should feed birds and people. Drew still sets stone by hand; Lila still sketches beds on graph paper at the kitchen table.`,
    hours: "Mon–Fri 8am–4pm · estimates by appointment",
    website: "https://example.com/moss-stone",
    email: "demo-seed-48@example.com",
    phone: "(515) 555-0248",
    categorySlug: "services",
  },
  {
    name: "Candlewick Home Goods",
    address: "2944 Ingersoll Ave, Des Moines, IA",
    about: `Candlewick Home Goods is a carefully edited home shop founded by interior stylist Zoe Martin. Think linens, ceramics, and gifts that don’t scream “seasonal aisle.” Zoe sources from Midwest makers whenever she can.

Workshops cover table styling and simple mending. Zoe’s origin story: styling houses that felt impersonal until neighbors brought their own stories in. She still unwraps shipments herself and still writes the gift notes that make returns rare.`,
    hours: "Tue–Sat 10am–6pm",
    website: "https://example.com/candlewick",
    email: "demo-seed-49@example.com",
    phone: "(515) 555-0249",
    categorySlug: "shopping",
  },
  {
    name: "Open Door Community Kitchen",
    address: "2770 Grand Ave, Des Moines, IA",
    about: `Open Door Community Kitchen is a pay-what-you-can cafe and meal nonprofit founded by chef Andre Williams and organizer Fatima Noor. Lunch is served daily; leftovers become evening grocery bags for families who need them.

Volunteers chop, serve, and clean alongside paid staff. The founding story is a church kitchen that outgrew Sundays. Andre still plans menus around donations and dignity; Fatima still greets every guest like a neighbor — because they are.`,
    hours: "Lunch Mon–Fri 11:30am–1:30pm · volunteer shifts vary",
    website: "https://example.com/open-door-kitchen",
    email: "demo-seed-50@example.com",
    phone: "(515) 555-0250",
    categorySlug: "organizations",
  },
]
