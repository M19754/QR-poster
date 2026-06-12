# Deploy til SKS-løb.dk (Vercel)

## Oversigt

| Komponent | Tjeneste |
|-----------|----------|
| App | [Vercel](https://vercel.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Filer | Vercel Blob (aktiveres i Vercel-dashboard) |
| Domæne | SKS-løb.dk → Vercel DNS |

---

## 1. Push til GitHub

```powershell
cd C:\Users\cvn24\Documents\QR-poster
git add .
git commit -m "Klar til produktion"
git push -u origin main
```

---

## 2. Supabase (database)

1. Opret projekt på [supabase.com](https://supabase.com)
2. Gå til **Settings → Database** og kopiér connection string (URI)
3. Skift `prisma/schema.prisma` datasource til PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

4. Kør migrering mod Supabase:

```powershell
$env:DATABASE_URL="postgresql://..."
npx prisma db push
npx tsx prisma/seed.ts
```

---

## 3. Vercel

1. [vercel.com/new](https://vercel.com/new) → Importér GitHub-repoet
2. Tilføj miljøvariabler:

| Variabel | Værdi |
|----------|-------|
| `DATABASE_URL` | Supabase PostgreSQL URI |
| `DEFAULT_GROUP_PASSWORD` | `E26` |
| `NEXT_PUBLIC_BASE_URL` | `https://sks-løb.dk` |

3. **Storage:** I Vercel-projektet → **Storage** → Opret **Blob Store**
   - `BLOB_READ_WRITE_TOKEN` sættes automatisk

4. Deploy

---

## 4. DNS (SKS-løb.dk)

I dit webhotels DNS-panel (eller hvor domænet styres):

1. Tilføj **A-record** eller **CNAME** som Vercel viser under **Domains**
2. Typisk: `CNAME www` → `cname.vercel-dns.com`
3. Apex-domæne (`sks-løb.dk`): brug Vercels A-records eller ANAME hvis webhotellet understøtter det

Vent op til 24 timer på DNS-propagation.

---

## 5. Efter deploy — tjekliste

- [ ] Admin-login virker (`/admin/login`)
- [ ] Leder-login virker (`/login`)
- [ ] Deltager-link (`/o/[id]`) åbner på mobil
- [ ] Fil-upload (billede/PDF) virker (kræver Blob)
- [ ] QR-koder peger på `https://sks-løb.dk/o/...`

---

## Lokal udvikling vs. produktion

| | Lokal | Produktion |
|---|-------|------------|
| Database | SQLite (`file:./dev.db`) | PostgreSQL (Supabase) |
| Filer | `public/uploads/` | Vercel Blob |
| URL | `localhost:3000` | `sks-løb.dk` |

SQLite virker **ikke** på Vercel — du skal bruge PostgreSQL i produktion.
