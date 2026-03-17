param(
  [string]$AdminEmail,
  [string]$AdminPassword,
  [string]$PublicAppOrigin = "http://localhost:5173",
  [string]$AdminAppOrigin = "http://localhost:5174",
  [string]$ApiBaseUrl = "http://127.0.0.1:8787"
)

$ErrorActionPreference = "Stop"

if (-not $AdminEmail) {
  do {
    $AdminEmail = Read-Host "Admin email (example: admin@example.com)"
  } while ([string]::IsNullOrWhiteSpace($AdminEmail))
}

if ([string]::IsNullOrWhiteSpace($AdminEmail)) {
  throw "Admin email is required."
}

$plainPassword = $AdminPassword

if ([string]::IsNullOrWhiteSpace($plainPassword)) {
  $securePassword = Read-Host "Admin password" -AsSecureString
  $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

  try {
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

if ([string]::IsNullOrEmpty($plainPassword)) {
  throw "Admin password is required."
}

$sha256 = [System.Security.Cryptography.SHA256]::Create()

try {
  $passwordHashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($plainPassword))
} finally {
  $sha256.Dispose()
}

$passwordHash = -join ($passwordHashBytes | ForEach-Object { $_.ToString("x2") })

$jwtBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

try {
  $rng.GetBytes($jwtBytes)
} finally {
  $rng.Dispose()
}

$jwtSecret = -join ($jwtBytes | ForEach-Object { $_.ToString("x2") })
$assetBaseUrl = "$($ApiBaseUrl.TrimEnd('/'))/assets"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$apiDevVarsPath = Join-Path $repoRoot "apps/api/.dev.vars"
$webEnvPath = Join-Path $repoRoot "apps/web/.env"
$adminEnvPath = Join-Path $repoRoot "apps/admin/.env"

$apiDevVars = @"
PUBLIC_APP_ORIGIN=$PublicAppOrigin
ADMIN_APP_ORIGIN=$AdminAppOrigin
R2_PUBLIC_BASE_URL=$assetBaseUrl
ADMIN_EMAIL=$AdminEmail
ADMIN_PASSWORD_HASH=sha256:$passwordHash
JWT_SECRET=$jwtSecret
"@

$webEnv = @"
VITE_API_BASE_URL=$ApiBaseUrl
VITE_ADMIN_APP_URL=$AdminAppOrigin
"@

$adminEnv = @"
VITE_API_BASE_URL=$ApiBaseUrl
VITE_PUBLIC_APP_URL=$PublicAppOrigin
"@

Set-Content -Path $apiDevVarsPath -Value $apiDevVars -Encoding utf8
Set-Content -Path $webEnvPath -Value $webEnv -Encoding utf8
Set-Content -Path $adminEnvPath -Value $adminEnv -Encoding utf8

Write-Host ""
Write-Host "Local development files updated:"
Write-Host " - apps/api/.dev.vars"
Write-Host " - apps/web/.env"
Write-Host " - apps/admin/.env"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. corepack pnpm --filter @donggeuri/api exec wrangler d1 migrations apply donggeuri-blog --local"
Write-Host "  2. corepack pnpm dev:api"
Write-Host "  3. corepack pnpm dev:web"
Write-Host "  4. corepack pnpm dev:admin"
Write-Host ""
Write-Host "Login email: $AdminEmail"
Write-Host "R2 public base URL: $assetBaseUrl"
