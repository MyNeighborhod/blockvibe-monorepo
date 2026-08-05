# North of Grand - Resident Signups & Membership Report
*Report Generated on 8/5/2026*

---

## 💳 Table 1: Registered Paying Members

| Name | Email | Phone Number | Full Address | Membership Tier | Amount Paid | Method | Status | Date |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Gina Schlesselman-Tarango** | `g.schlesselmantarango@gmail.com` | (909) 735-0900 | 740, 33rd Street, Des Moines, IA, 50312 | Individual ($10) | $10 | PAYPAL | Active | 8/4/2026 |
| **Steve & Jean Jones** | `jmjones@lbc-dsm.com` | 515-7787428 | 751 33rd, Des Moines, IA, 50312 | Household ($20) | $20 | PAYPAL | Active | 8/4/2026 |
| **Rebecca Tollefson** | `beckytolly@yahoo.com` | (952) 693-6925 | 723 37th St, Des Moines, IA, 50312 | Individual ($10) | $10 | CASH | Active | 8/4/2026 |
| **Barb Niccum** | `barbaran515@gmail.com` | 5153608786 | 623 36th Street, des moines, IA, 50312 | Household ($20) | $20 | PAYPAL | Active | 8/4/2026 |
| **Sam Hoyle** | `sam@newtri.be` | N/A | 635 41st St, Des Moines, IA, 50312 | Household ($20) | $20 | PAYPAL | Active | 8/4/2026 |
| **Eugen Burianov** | `eugenburianov@gmail.com` | 5156501840 | 672 40th Street, Des Moines, IA, 50312-3312 | Individual ($10) | $2 | PAYPAL | Active | 8/4/2026 |
| **Janee Harvey** | `janeecharvey@gmail.com` | 3474516072 | 634 40th street, Des Moines, IA, 50312 | Household ($20) | $20 | Cash/Check | Pending | 8/4/2026 |
| **Holly Klotz** | `datamaven651@gmail.com` | 7084150684 | 505 36th St #302, DES MOINES, IA, 50312 | Individual ($10) | $10 | Cash/Check | Pending | 8/4/2026 |

### 🔍 SQL Query for Table 1 (Paying Members)
```sql
SELECT 
  u.name AS "Name",
  u.email AS "Email",
  COALESCE(m.phone, u.phone, 'N/A') AS "Phone Number",
  COALESCE(m.address, u.address, 'N/A') AS "Full Address",
  CASE 
    WHEN m.tier = 'household' THEN 'Household ($20)'
    ELSE 'Individual ($10)'
  END AS "Membership Tier",
  COALESCE(m.total_paid_current_year, 0) AS "Amount Paid ($)",
  COALESCE(UPPER(p.provider), 'CASH/CHECK') AS "Payment Method",
  m.status AS "Status",
  m.created_at::date AS "Registration Date"
FROM memberships m
JOIN users u ON m.user_id = u.id
LEFT JOIN payments p ON p.user_id = u.id OR p.account_id = m.account_id
WHERE u.email NOT LIKE '%blockvibe.org' 
  AND u.email NOT LIKE '%example.com'
ORDER BY m.created_at DESC;
```

---

## 📧 Table 2: Email List & Contact Form Signups

| Name | Email | Phone Number | Full Address | Signup Date |
| :--- | :--- | :--- | :--- | :--- |
| **Ryan Kessens** | `ryankessens@gmail.com` | (812) 608-0911 | 732 38th Street, Des Moines, IA 50312 | 8/4/2026 |
| **Gabriela Cazares** | `gpizarro24@gmail.com` | (773) 726-9607 | 648 31st Street, Des Moines IA 50312 | 8/4/2026 |
| **Angel Crow** | `angeliacrow4924@gmail.com` | (402) 676-5697 | 637 40th street | 8/4/2026 |
| **Mary Whisenand** | `maryewhisenand@gmail.com` | N/A | N/A | 8/4/2026 |
| **Miranda Keech** | `mirandajburke@gmail.com` | N/A | 705 38th St | 8/4/2026 |
| **Morgan Miller** | `christensenmorgan5@gmail.com` | (712) 952-9395 | 3715 Center St | 8/4/2026 |
| **Rebecca Tollefson** | `beckytolly@yahoo.com` | (952) 693-6925 | 723 37th St Des Moines, IA 50312 | 8/4/2026 |
| **Holly Klotz** | `datamaven651@gmail.com` | (708) 415-0684 | 505 36th St Unit 302 | 8/4/2026 |
| **Jean Jones** | `jmjones@lbc-dsm.com` | (515) 778-7428 | 751 33rd | 8/4/2026 |
| **Ellen Burrell** | `ellenburrell31@gmail.com` | (515) 360-1552 | 4021 Woodland Ave | 8/4/2026 |
| **Madison Bender** | `benderlynn.madi@gmail.com` | (515) 865-7354 | 725 40th St | 8/4/2026 |

### 🔍 SQL Query for Table 2 (Email List / Contact Form Submissions)
```sql
SELECT DISTINCT ON (
  LOWER(
    COALESCE(
      (SELECT (elem->>'value') FROM jsonb_array_elements(fs.submission_data) AS elem WHERE elem->>'field' = 'email'),
      ''
    )
  )
)
  COALESCE(
    NULLIF(TRIM(
      COALESCE((SELECT (elem->>'value') FROM jsonb_array_elements(fs.submission_data) AS elem WHERE elem->>'field' = 'firstName'), '') || ' ' ||
      COALESCE((SELECT (elem->>'value') FROM jsonb_array_elements(fs.submission_data) AS elem WHERE elem->>'field' = 'lastName'), '')
    ), ''),
    'N/A'
  ) AS "Name",
  (SELECT (elem->>'value') FROM jsonb_array_elements(fs.submission_data) AS elem WHERE elem->>'field' = 'email') AS "Email",
  COALESCE(NULLIF((SELECT (elem->>'value') FROM jsonb_array_elements(fs.submission_data) AS elem WHERE elem->>'field' = 'phone'), ''), 'N/A') AS "Phone Number",
  COALESCE(NULLIF((SELECT (elem->>'value') FROM jsonb_array_elements(fs.submission_data) AS elem WHERE elem->>'field' = 'address'), ''), 'N/A') AS "Full Address",
  fs.created_at::date AS "Signup Date"
FROM form_submissions fs
ORDER BY 
  LOWER((SELECT (elem->>'value') FROM jsonb_array_elements(fs.submission_data) AS elem WHERE elem->>'field' = 'email')),
  fs.created_at DESC;
```
