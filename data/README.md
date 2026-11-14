# Datos semilla — Mueblería Cochabamba
## Advertencia de procedencia
- **FUENTE_CASO**: solo reglas y cifras expresas del PDF de 8 páginas.
- **SINTETICO**: registros inventados para demostración académica, **no** representan registros reales ni los datos ausentes del dossier.
- **DERIVADO**: valores calculados para reproducir los escenarios con los datos sintéticos.
El PDF menciona un dossier, secciones 2–13, **no adjuntado**. Este paquete no pretende reproducir ese dossier.
## Unidades y formato
CSV UTF-8; separador coma, encabezados snake_case; moneda BOB (Bs); cantidades unidades enteras; importes decimales con punto; fechas ISO-8601; fecha de corte 2026-11-13 America/La_Paz. Identificadores estables M01–M08, P01–P03, etc.
Las imágenes no están autorizadas en el dossier: usar **placeholder** claramente identificado.
## Carga
1. Revisar docs/data-dictionary.md y docs/integration-contract.md.
2. Crear modelo relacional compatible en PostgreSQL mediante migraciones propias. No usar directamente estos CSV como base operativa en producción.
3. Importar catálogos (productos, proveedores, clientes, empleados) antes de entidades relacionadas.
4. Importar inventario, ofertas, ventas, compras pendientes y proformas.
5. Validar fixtures/acceptance.json. Evitar contar proformas como ventas o incrementar stock al emitir compras.
6. Los campos unit_cost_bob y ofertas de proveedores son **privados**, nunca exposición pública de agentes.
