$lines = Get-Content 'c:\Users\aagos\Downloads\Orbit\frontend\src\themes\lightTheme.jsx'
$newLines = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($i -lt 1060 -or $i -ge 1511) {
        $newLines += $lines[$i]
    }
}
$newLines | Set-Content 'c:\Users\aagos\Downloads\Orbit\frontend\src\themes\lightTheme.jsx'
