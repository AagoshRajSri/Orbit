$lines = Get-Content 'c:\Users\aagos\Downloads\Orbit\frontend\src\themes\pastelTheme.jsx'
$newLines = @()
$foundGsap = $false
foreach ($line in $lines) {
    if ($line -like '*import { gsap } from "gsap"*') {
        if (-not $foundGsap) {
            $newLines += $line
            $foundGsap = $true
        }
    } else {
        $newLines += $line
    }
}
$newLines | Set-Content 'c:\Users\aagos\Downloads\Orbit\frontend\src\themes\pastelTheme.jsx'
