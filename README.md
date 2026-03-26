# 📚 Guía de Integración: Buscador Visual Educativo

Este documento está diseñado para facilitar la integración del módulo de búsqueda visual en el ecosistema educativo existente.

## 🛠 Configuración de Credenciales (Google Custom Search)

Para que el buscador funcione, se requieren dos valores que deben configurarse en el panel de ajustes de la aplicación (o inyectarse directamente en el código):

1.  **API Key**:
    *   **Ruta**: [console.cloud.google.com](https://console.cloud.google.com/)
    *   **Acción**: Ir a `API y Servicios` -> `Credenciales`.
    *   **Requisito**: Asegurarse de que la **"Custom Search API"** esté habilitada en el proyecto.

2.  **CX (Search Engine ID)**:
    *   **Ruta**: [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)
    *   **Acción**: `Crear motor de búsqueda` -> Configurar nombre -> Habilitar la opción **"Buscar en toda la Web"**.
    *   **Requisito**: Activar la opción **"Búsqueda de imágenes"** en la configuración del motor creado.

---

## 🏗 Detalles Técnicos para Claude (Integración)

### Estructura del Módulo
*   **Archivo**: `index.html` (Vanilla JS / CSS / HTML).
*   **Dependencias Externas**: 
    *   `JSZip` (vía CDN de Cloudflare) para la descarga masiva.
*   **Persistencia**: Utiliza `localStorage` (`gcs_api_key` y `gcs_cx`) para mantener las credenciales entre sesiones sin necesidad de base de datos.

### Flujo de Datos
1.  **Búsqueda**: Realiza un `fetch` a la API de Google con el parámetro `searchType=image`.
2.  **Renderizado**: Genera un grid dinámico de tarjetas con previsualización y metadatos.
3.  **Descarga Individual**: Utiliza un flujo de `Blob` para intentar forzar la descarga local. Si el servidor de origen bloquea por CORS, implementa un fallback automático que abre la imagen en una pestaña nueva.
4.  **Descarga Masiva**: Itera sobre los resultados actuales, descarga los blobs en paralelo y genera un archivo `.zip` dinámicamente.

### Sugerencias de Integración Educativa
*   **Estilos**: El CSS utiliza variables (`:root`) para colores primarios y secundarios. Puedes ajustarlas para que coincidan con la paleta de colores del ecosistema principal.
*   **Filtros**: Se puede modificar la query de búsqueda en el JS para añadir términos educativos fijos (ej: `q + " material didáctico"`) si se desea acotar los resultados.

---
*Documentación generada para facilitar la transición de desarrollo entre asistentes de IA.*
