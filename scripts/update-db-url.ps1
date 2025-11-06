# Script to update DATABASE_URL in .env file with proper URL encoding
$password = "786Saqib@#"
# URL encode special characters
$encodedPassword = $password -replace '@', '%40' -replace '#', '%23'

# Direct connection (port 5432) with SSL - required for migrations
$databaseUrl = "postgresql://postgres:$encodedPassword@db.gkezarrhcmnpwdsdnwsz.supabase.co:5432/postgres?sslmode=require"

Write-Host "Updating DATABASE_URL in .env file..."
Write-Host "Using direct connection (port 5432) with SSL"
Write-Host "Encoded password: $encodedPassword"

# Read current .env file
if (Test-Path .env) {
    $envContent = Get-Content .env
    
    # Update or add DATABASE_URL
    $updated = $false
    $newContent = $envContent | ForEach-Object {
        if ($_ -match '^DATABASE_URL=') {
            $updated = $true
            "DATABASE_URL=$databaseUrl"
        } else {
            $_
        }
    }
    
    # If DATABASE_URL wasn't found, add it
    if (-not $updated) {
        $newContent += "DATABASE_URL=$databaseUrl"
    }
    
    # Write back to .env
    $newContent | Set-Content .env
    Write-Host "✅ DATABASE_URL updated successfully!"
} else {
    Write-Host "❌ .env file not found!"
    Write-Host "Creating .env file with DATABASE_URL..."
    "DATABASE_URL=$databaseUrl" | Set-Content .env
    Write-Host "✅ .env file created!"
}

Write-Host ""
Write-Host "Note: If connection fails, check:"
Write-Host "1. Your Supabase project is active"
Write-Host "2. Your IP is allowed (check Supabase dashboard > Settings > Database)"
Write-Host "3. The password is correct"
Write-Host "4. Try getting the connection string from Supabase dashboard:"
Write-Host "   Settings > Database > Connection string > URI"
