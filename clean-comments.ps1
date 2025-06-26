param(
    [string]$RootPath = "src"
)

# Get all page.tsx and route.ts files
$files = Get-ChildItem -Recurse -Path $RootPath -Include *.tsx,*.ts | Where-Object { 
    $_.Name -match "(page\.tsx|route\.ts)$" 
}

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    # Read file content
    $content = Get-Content -Path $file.FullName -Raw
    
    # Remove single-line comments that start at the beginning of a line
    $content = $content -replace '(?m)^\s*//.*$', ''
    
    # Remove trailing inline comments (but keep URLs and important code)
    $content = $content -replace '\s+//\s*[A-Za-z].*$', ''
    
    # Remove empty lines that were left behind
    $content = $content -replace '(?m)^\s*\r?\n', ''
    
    # Remove multiple consecutive empty lines
    $content = $content -replace '(\r?\n){3,}', "`n`n"
    
    # Write back to file
    $content | Set-Content -Path $file.FullName -NoNewline
    
    Write-Host "✓ Cleaned: $($file.Name)"
}

Write-Host "`nCompleted cleaning comments from $($files.Count) files."
