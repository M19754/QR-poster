# Deploy til SKS-løb.dk (Vercel)

## Oversigt

| Komponent | Tjeneste |
|-----------|----------|
| App | [Vercel](https://vercel.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Filer | Vercel Blob |
| Domæne | SKS-løb.dk → Vercel DNS |

---

## 1. Database (Supabase) — gør dette først

1. Gå til [supabase.com](https://supabase.com) og opret et **gratis projekt**
2. Vælg region tæt på dig (fx Frankfurt)
3. Gå til **Project Settings → Database**
4. Kopiér **Connection string → URI** (vælg **Direct connection**, ikke pooler)
5. Erstat `[YOUR-PASSWORD]` med dit database-password fra projektet

Eksempel:
```
postgresql://postgres.xxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

6. Kør setup fra din PC:

```powershell
cd C:\Users\cvn24\Documents\QR-poster
$env:DATABASE_URL="postgresql://..."
.\scripts\setup-production-db.ps1
```

Det opretter alle tabeller og seed-data (admin: **1234 / 1234**).

---

## 2. Vercel

1. [vercel.com](https://vercel.com) → dit **QR-poster**-projekt
2. **Settings → Environment Variables** — tilføj:

| Variabel | Værdi |
|----------|-------|
| `DATABASE_URL` | Supabase connection string (samme som ovenfor) |
| `DEFAULT_GROUP_PASSWORD` | `E26` |
| `NEXT_PUBLIC_BASE_URL` | `https://qr-poster-sks.vercel.app` |

3. **Storage → Blob Store** (til fil-upload)
4. **Deployments → Redeploy** (så ny database bruges)

Ved build kører `prisma migrate deploy` automatisk.

---

## 3. Lokal udvikling (valgfrit)

Med Docker:

```powershell
docker compose up -d
$env:DATABASE_URL="postgresql://qrposter:qrposter@localhost:5432/qrposter"
npm run db:setup
npm run dev
```

---

## 4. DNS (SKS-løb.dk)

I webhotellets DNS-panel:

- `CNAME app` → `cname.vercel-dns.com`
- Tilføj domænet i Vercel under **Domains**

---

## Tjekliste efter deploy

- [ ] Admin-login: `1234` / `1234` på `/admin/login`
- [ ] Skift login ved første gang
- [ ] Leder-login: `Grp. 1` / `E26` på `/login`
- [ ] Deltager-link `/o/[id]` virker på mobil
