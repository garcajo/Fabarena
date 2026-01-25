---
description: Configurar Google AdSense cuando tengas tu código de publisher
---

# Implementar Google AdSense

Cuando tengas tus credenciales de AdSense, proporciona:
1. **Publisher ID** (formato: `ca-pub-XXXXXXXXX`)
2. **Ad Slot ID** (formato: `1234567890`)

## Pasos de implementación:

// turbo-all

### 1. Añadir script de AdSense a index.html
Agregar en `<head>`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXX" crossorigin="anonymous"></script>
```

### 2. Actualizar el componente AdBanner
Archivo: `/Users/josue/Documents/fabarena/fab-tcg-web/src/components/Layout.jsx`

Cambiar:
```jsx
<AdBanner position="bottom" />
```
Por:
```jsx
<AdBanner 
    position="bottom" 
    adClient="ca-pub-XXXXXXXXX"  // Tu Publisher ID
    adSlot="1234567890"          // Tu Ad Slot ID
/>
```

### 3. Rebuild para producción
```bash
cd /Users/josue/Documents/fabarena/fab-tcg-web
npm run build
```

## Notas:
- Los anuncios solo aparecen en producción (no en localhost)
- Puedes añadir múltiples banners con diferentes adSlot IDs
- El componente AdBanner ya está preparado en: `src/components/AdBanner.jsx`
