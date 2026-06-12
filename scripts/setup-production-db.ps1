# Opret tabeller og seed-data i produktionsdatabasen.
# Kræver DATABASE_URL (og evt. DIRECT_DATABASE_URL til Supabase).

param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$DirectUrl = $env:DIRECT_DATABASE_URL
)

if (-not $DatabaseUrl) {
    Write-Error "Sæt DATABASE_URL først. Eksempel:`n`$env:DATABASE_URL='postgresql://...'"
    exit 1
}

$env:DATABASE_URL = $DatabaseUrl
if ($DirectUrl) {
    $env:DIRECT_DATABASE_URL = $DirectUrl
}

Write-Host "Kører migrering..."
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Seeder database..."
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Database klar. Admin-login: 1234 / 1234"
