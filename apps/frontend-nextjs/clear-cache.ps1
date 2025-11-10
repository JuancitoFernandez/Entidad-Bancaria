# Script para limpiar el caché de Next.js
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Cache eliminado exitosamente"
} else {
    Write-Host "No hay cache para eliminar"
}




