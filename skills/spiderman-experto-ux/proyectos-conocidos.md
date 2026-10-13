# Proyectos con contexto guardado

Una ficha por proyecto. Se lee solo si el directorio de trabajo o la URL
coinciden; si no, el contexto sale del paso 1 de la skill. Una ficha nueva
copia el formato de las de abajo y se queda corta: solo lo que la pantalla no
dice.

---

## unimar_tms — TMS de Unimar (web)

- **Se reconoce por**: carpeta `unimar_tms`, o `http://localhost:5173`.
- **Usuarios**: despachadores y planificadores de transporte del depósito de
  contenedores, en escritorio, toda la jornada, expertos en el dominio. Un
  servicio que sale tarde o queda mal asignado es un **error con costo**.
- **URL**: `http://localhost:5173` (servicio `web` del `docker-compose.yml`).
  Las rutas salen de `src/apps/web/src/app/catalogo-de-pantallas.ts`.
- **Perfiles**: bandejas de planificación y citas → operativa; carga de
  archivo → operativa; mantenimientos → formulario; consolidado de nave →
  consulta.
- **Reglas del proyecto que limitan las sugerencias**: no hay tooltips
  (`title`) salvo que se pidan (CLAUDE.md); todo texto en español.
- **Decisiones que no se critican sin daño visible**:
  - la bandeja no tiene selección múltiple a propósito (ADR-TMS-025);
  - las maestras las crea y edita SAP; la web solo edita la cuenta UMS del
    conductor, las horas libres de la instalación portuaria y el TB/TD de la
    nave. No sugerir «agregar botón de crear» en una maestra.
- **Fuera del navegador**: la app UNITRANS (Android nativo) se critica con
  capturas que dé el usuario, con el perfil «App móvil».
