# MuebleGest AI | Trabajo Final — Módulo 1, Diplomado UPB

Repositorio de colaboración para el caso académico **Mueblería Cochabamba 2026**. El objetivo es construir una aplicación web con atención comercial inteligente, proformas, analítica y automatización de reposición.

> **Estado actual:** web comercial y endpoints de los tres agentes desplegados en Vercel; Supabase poblado y conectado. **La conversación con el modelo de IA requiere configurar `OPENAI_API_KEY` (aún pendiente)**. Emisión de PDF, correo simulado, autenticación de usuarios y escrituras transaccionales siguen pendientes.

## 1. Alcance funcional

| Componente | Responsabilidad | Estado |
| --- | --- | --- |
| Agente 1 — Comercial | Asesor conversacional y herramientas de catálogo y stock; registro definitivo pendiente | Código desplegado; modelo pendiente |
| Agente 2 — Proformas | Chat administrativo y cálculo de vista previa S01; emisión PDF y envío aún no implementados | Código desplegado; modelo pendiente |
| Agente 3 — Analítica | Chat administrativo y herramientas de ventas, compras e inventario | Código desplegado; modelo pendiente |
| Automatización de reposición | Evalúa mínimos y objetivos, compara proveedores y solicita aprobación | Pendiente |
| Web app / administración | Catálogo, chat, solicitudes, inventario, dashboard, compras y autorizaciones | Pendiente |
| Datos semilla | CSV, reglas JSON y fixtures de aceptación para desarrollo e importación | **Disponibles** |

## 2. Documentación imprescindible

- [Brief para el equipo](docs/brief-para-equipo.md): alcance del paquete de datos y reparto de responsabilidades.
- [Diccionario de datos](docs/data-dictionary.md): entidades, claves, relaciones y sugerencias para PostgreSQL.
- [Contratos de integración](docs/integration-contract.md): endpoints REST **propuestos**, no implementados.
- [Escenarios de prueba](docs/test-cases.md): verificaciones funcionales del enunciado.
- [Origen y límites de los datos](data/README.md): qué está documentado y qué es sintético.
- [Fixtures de aceptación](fixtures/acceptance.json): resultados esperados para pruebas automatizadas.

## 3. Datos iniciales incluidos

| Archivo | Contenido |
| --- | --- |
| `data/products.csv` | 40 muebles M01–M40; dimensiones, categorías, precios de venta y costos internos |
| `data/inventory.csv` | 40 existencias consolidadas de referencia, reservas, mínimos, objetivos y pendientes válidos |
| `data/warehouses.csv` y `data/warehouse_stock.csv` | 2 ubicaciones y 72 registros de stock físico con mínimo y objetivo por ubicación |
| `data/suppliers.csv` | 3 proveedores ficticios P01–P03 |
| `data/supplier_offers.csv` | 72 ofertas para selección y filtros de elegibilidad |
| `data/customers.csv` | 6 clientes ficticios con correos `example.com` |
| `data/staff.csv` | 4 usuarios ficticios para filtros y perfiles |
| `data/sales_lines.csv` | 11 líneas de venta ficticias (septiembre y octubre de 2026), con costo de mercadería vendida |
| `data/purchase_lines.csv` | 7 líneas de compras históricas ficticias para dashboard |
| `data/pending_purchases.csv` | Una compra confirmada pendiente para demostrar que M06 no se repone de nuevo |
| `data/requests.csv` y `data/request_lines.csv` | Solicitud S01 y sus artículos |
| `data/quotes.csv` y `data/quote_events.csv` | Proforma de prueba y evento inicial |
| `data/policies.json` | Reglas de cotización, correo simulado, analítica y reposición |

**Formato:** CSV UTF-8 con encabezados `snake_case` y separador coma; JSON para reglas y casos. Moneda **BOB (Bs)**; fechas ISO-8601; zona horaria **America/La_Paz**.

### Procedencia y advertencia académica

El PDF de instrucciones del docente consta de **8 páginas** y remite a secciones de un *dossier* con tablas que **no están incluidas** en el documento recibido. Por ello, **todos los registros individuales y atributos no expresamente especificados fueron creados para esta demostración**. No deben atribuirse al dossier original ni presentarse como datos reales de la empresa.

Los valores y reglas expresamente indicados por el caso se preservan como criterios de aceptación. Cuando se reciba el dossier completo, los datos sintéticos deberán compararse o reemplazarse.

## 4. Controles obligatorios del caso

| Escenario | Resultado esperado |
| --- | --- |
| Consulta: escritorio de máximo 110 cm y presupuesto de Bs 900 | Recomendar M04 (100 cm, Bs 850); excluir M05 (140 cm, Bs 1.400); preguntar uso y profundidad cuando falten |
| Proforma S01 | 4 sillas M01 + 1 mesa M02 = Bs 2.480; transporte local Bs 100; **total Bs 2.580** |
| Disponibilidad S01 | Solo 2 de las 4 sillas disponibles; **2 pendientes de reposición**, sin prometer fecha de entrega |
| Ventas septiembre | **Bs 9.170** |
| Ventas octubre | **Bs 6.660**; variación **−27,37 %** |
| Rentabilidad total | Ventas Bs 15.830; costo de ventas Bs 10.660; utilidad bruta **Bs 5.170**; margen **32,66 %** |
| Reposición M01 | 8 unidades, proveedor P02, **Bs 1.780** |
| Reposición M03 | 6 unidades, proveedor P01, **Bs 2.640** |
| Reposición M06 | 0 unidades nuevas: ya existe compra pendiente confirmada |
| Reposición M08 | 3 unidades, proveedor P02, **Bs 2.670** |
| Total de nuevas solicitudes de reposición | **Bs 7.090** |

La proforma **no es venta ni reserva stock**; su aceptación no genera venta automáticamente. Las compras del período **no** se restan de las ventas para calcular utilidad: se usa el costo de unidades efectivamente vendidas. Las solicitudes y los envíos deben ser idempotentes.

## 5. Arquitectura de integración propuesta

```text
Usuarios (clientes / administración)
         |
Web app React (Vercel)
         |
API segura / servicios de negocio
   |          |          |
3 agentes  Reglas     Automatización
   IA     comerciales   de reposición
   |          |          |
   +----------+----------+
              |
       PostgreSQL / Supabase
```

El responsable de base de datos puede crear su propio esquema y migraciones SQL en PostgreSQL. Los CSV son **semillas de importación**, no un sustituto de los controles transaccionales. Los agentes deben consumir APIs controladas, sin acceder con permisos irrestrictos a la base.

## 6. Guía de trabajo para el compañero de base de datos

1. Leer el [diccionario de datos](docs/data-dictionary.md) y crear tablas, claves foráneas, `UNIQUE`, `CHECK` y políticas de acceso.
2. Importar primero productos, proveedores, clientes y personal; después existencias, ofertas, ventas, compras, solicitudes y proformas.
3. Exponer los endpoints documentados en [contratos de integración](docs/integration-contract.md), o acordar versiones equivalentes con el equipo.
4. Tratar `inventory.csv` como una **vista/snapshot consolidado**: importar `warehouse_stock.csv` como origen físico, sin duplicar cantidades; no volver a descontar ventas históricas sobre ese stock.
5. Mantener separados: disponibilidad física, reservas, compras confirmadas pendientes y recepciones. No contar un pedido emitido como stock recibido.
6. Conservar costos internos y ofertas de proveedores en servicios restringidos. Nunca entregarlos al agente público.
7. Probar todos los resultados de [aceptación](fixtures/acceptance.json) antes de integrar los agentes.

## 7. Reglas operativas y de seguridad

- El agente comercial no inventa muebles, precios, promociones ni disponibilidad. Si el inventario está desactualizado, comunica la fecha consultada.
- La proforma se calcula con funciones deterministas, se numera, versiona y registra con una clave de idempotencia.
- **No enviar correos reales**: el caso exige direcciones `example.com` y simulación de envíos.
- La analítica es de solo lectura; no atribuye causas de la caída de ventas sin evidencia y no suma proformas a ventas.
- La reposición se planifica para las **08:00 hora de Bolivia**; usa reglas exactas de stock, ofertas vigentes, plazo máximo de 5 días y autorización previa.
- Las compras superiores a **Bs 3.000** o excepcionales requieren aprobación; toda emisión está sujeta a la política de autorización gerencial.
- No publicar claves, tokens, credenciales ni datos personales reales. `.gitignore` protege archivos `.env`.

## 8. Próximas entregas

1. Migraciones y semillas de PostgreSQL a cargo del integrante de BD.
2. Endpoints REST de negocio y mecanismo de autenticación.
3. Implementación y pruebas de los tres agentes.
4. Web React y panel administrativo.
5. Automatización de reposición, integración y pruebas end-to-end.

**Proyecto académico con datos ficticios.** Las fotografías de productos deben presentarse como marcadores ilustrativos hasta contar con imágenes autorizadas.

## 9. Ampliación del catálogo e inventario
- **40 muebles**, agrupados en sala, comedor, dormitorio, oficina, almacenaje, escritorios, cocina, baño y multiuso.
- **2 ubicaciones:** almacén central (ALM01) y sala de exhibición (SALA01).
- Stock físico y reservado, **stock mínimo y objetivo por ubicación**, con 72 registros de existencias.
- **72 ofertas** de los tres proveedores ficticios existentes para probar comparación y compras.
- Los productos M01–M08 conservan los controles del enunciado. Los nuevos 32 son sintéticos, con inventario suficiente para no añadir reposiciones al fixture docente.
- `data/inventory.csv` es vista consolidada; no crear una segunda fuente de verdad al migrar a PostgreSQL.

## Agentes y despliegue (v0.2)
- [Web comercial en Vercel](https://mueblegest-ai-agents.vercel.app/)
- [Estado de agentes](https://mueblegest-ai-agents.vercel.app/api/agents): indica si el modelo está configurado sin exponer secretos
- [Pruebas de aceptación](https://mueblegest-ai-agents.vercel.app/api/acceptance): 12 comprobaciones deterministas contra Supabase
- [Guía para activar y probar los agentes](docs/AGENTS_MVP.md)
- Antes de activar chat: configurar `OPENAI_API_KEY` como **Sensitive** y producción en Vercel; redeploy. No equivale a la suscripción ChatGPT, requiere acceso a API.
- **Seguridad:** comercial público, proformas/analítica solo con `x-admin-key` en llamadas servidor-servidor. No colocar esta clave en JavaScript del navegador.
- El sistema aún no registra solicitudes ni emite PDF/correos. No presentar esas capacidades como completadas.

## Actualización de Supabase — seguridad y tienda (noviembre 2026)

- **Catálogo:** 100 muebles M01–M100, 192 existencias por almacén, 192 ofertas y 100 imágenes SVG **referenciales** (no fotos reales). 11 categorías, 9 secciones del sitio y 10 preguntas frecuentes.
- **Roles y controles (base de datos):** `VENDEDOR`, `COMPRAS`, `GERENCIA`, `ADMINISTRADOR`, tablas para cuentas, roles, permisos, asignaciones, auditoría y aprobaciones. `VISITANTE` es acceso anónimo a catálogo seguro.
- **Funciones RPC:** `catalog_public_products`, `my_access`, `supplier_directory`, `compare_supplier_offers`, `inventory_internal`, `sales_dashboard`, `quote_preview`, `submit_purchase_approval`, `approve_business_request`, `assign_staff_role`, `set_staff_account_status`.
- **Seguridad:** acceso directo a datos internos denegado al anónimo; RPCs internas requieren sesión/permiso; trigger de creación de perfil; no autoasignar rol al registrarse. Buckets `product-catalog` público y `quote-documents` privado.
- **Documentación para integrar con Google AI Studio:** [docs/GOOGLE_AI_STUDIO_SECURITY_INTEGRATION.md](docs/GOOGLE_AI_STUDIO_SECURITY_INTEGRATION.md).
- **Pendiente:** registrar usuarios Auth reales; completar frontend, emisión PDF, envíos simulados, motor transaccional/programado de reposición y pruebas end-to-end. No considerar el proyecto finalizado todavía. Los pushes a GitHub tampoco actualizan automáticamente Vercel sin integración de despliegues.
