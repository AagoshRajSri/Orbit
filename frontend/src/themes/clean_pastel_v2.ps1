$lines = Get-Content 'c:\Users\aagos\Downloads\Orbit\frontend\src\themes\pastelTheme.jsx'
$newLines = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($i -lt 1385 -or $i -ge 1689) {
        $newLines += $lines[$i]
    }
}
$newLines | Set-Content 'c:\Users\aagos\Downloads\Orbit\frontend\src\themes\pastelTheme.jsx'
