for ($i=0; $i -lt 12; $i++) {
  Write-Output "--- check $i ---"
  npx wrangler pages deployment list --project-name spincrete
  Start-Sleep -Seconds 10
}