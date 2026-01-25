---
description: Carga el servidor local para acceso móvil (Backend + Frontend --host)
---

Este workflow inicia el entorno de desarrollo configurado para ser accesible desde dispositivos en la misma red WiFi (como tu móvil).

1. Inicia el Backend en puerto 3000 (accesible externamente)
// turbo
2. Start backend server
    ```bash
    cd /Users/josue/Documents/fabarena/fab-tcg-backend
    # Usamos node directo para estabilidad, o npm run dev
    npm run dev
    ```

3. Inicia el Frontend en puerto 5173 (expuesto a la red)
// turbo
4. Start frontend with host flag
    ```bash
    cd /Users/josue/Documents/fabarena/fab-tcg-web
    npm run dev -- --host
    ```

5. Muestra las IPs de acceso
    ```bash
    echo "✅ Servidores iniciados (Modo Seguro HTTPS)!"
    echo "📱 Accede desde tu móvil a: https://(tu-ip-local):5173"
    echo "⚠️  Nota: Acepta la advertencia de seguridad ('Sitio no seguro') para continuar."
    ```
