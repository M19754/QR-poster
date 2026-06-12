# QR-poster

Opgaveposter til SKS-løb — lederredigering, gruppeindhold og deltager-QR-links.

## Fase 1 (MVP)

- Admin: grupper, opgaver, lejr-indstillinger, nulstil koder/deltagere
- Leder: gruppe-login, kodeskift ved første login, tekst + billeder, synlig/skjul opgave
- Deltager: vælg gruppe én gang, se indhold, skift gruppe
- Tidsstyring: tekstblokke og filer med åben/lukket-periode

## Fase 2

- Leder: upload af PDF, MP3 og MP4 (op til 25 MB for video)
- Deltager: indlejret PDF, lyd- og videoafspiller på mobil
- Admin: QR-kode per opgave (vis og download)
- Nulstil kode per gruppe i admin

## Kom i gang

### 1. Miljøvariabler

Kopiér `.env.example` til `.env` og tilpas værdierne:

```powershell
Copy-Item .env.example .env
```

### 2. Database (lokal)

Enten Supabase (gratis) eller Docker:

```powershell
docker compose up -d
$env:DATABASE_URL="postgresql://qrposter:qrposter@localhost:5432/qrposter"
npm run db:setup
```

### 3. Installér og start

```powershell
npm install
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000)

### 4. Standard-login

| Rolle | Brugernavn | Kode |
|-------|------------|------|
| Admin | `1234` | `1234` (skiftes ved første login) |
| Leder | `Grp. 1` | `E26` (skal skiftes ved første login) |

**Produktion kræver PostgreSQL** (Supabase). Se [DEPLOY.md](./DEPLOY.md).

## URL-struktur

| Sti | Beskrivelse |
|-----|-------------|
| `/` | Forside |
| `/login` | Leder-login |
| `/dashboard` | Leder-dashboard |
| `/o/[id]` | Deltager-side (QR-link) |
| `/admin` | Admin-panel |

## Fase 3

- Start ny lejr (arkivér gammel, kopiér struktur)
- Eksportér lejr som JSON
- Print alle QR-plakater (`/admin/qr-print`)
- Fil-lager klar til Vercel Blob i produktion

## Produktion (SKS-løb.dk)

Se **[DEPLOY.md](./DEPLOY.md)** for trin-for-trin guide (Vercel + Supabase + DNS).

## Scripts

- `npm run dev` — udviklingsserver
- `npm run build` — produktionsbuild
- `npm run db:setup` — opret database og seed data
