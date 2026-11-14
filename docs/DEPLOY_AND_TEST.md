# Guía de despliegue y protocolos de prueba v0.1
**Estado:** cuatro endpoints deterministas implementados, NO agentes LLM aún. Proforma = vista previa; PDF y correo simulado pendientes. Reposición = dry-run sin emisión.

## Vercel
1. Vercel Dashboard > Projects > importar `javvar-bo/muebleria-ia`. Framework Other, root `./`.
2. Configurar **solo en Vercel** `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_API_KEY`. Nunca poner secret key en React ni GitHub.
3. Deploy > comprobar /api/health. Luego invocar POST JSON a /api/commercial, /api/quotation, /api/analytics, /api/replenishment.
4. /api/commercial es público y muestra solo precios de venta. Los otros endpoints requieren header `x-admin-key` servidor-servidor: el frontend **no** debe recibir ese secreto. Implementar login/roles antes de habilitar dashboard al público.

## Pruebas
- Comercial: POST /api/commercial `{"category":"Escritorios","max_width_cm":110,"max_price_bob":900}` => contiene M04 y M30, excluye M05 y pregunta profundidad/uso.
- Proformas: POST /api/quotation `{"request_id":"S01"}` + encabezado admin => subtotal 2480, transporte 100, total 2580, 2 M01 faltantes, no venta. NO genera PDF.
- Analítica: POST /api/analytics `{}` + admin => ventas 15830, costo 10660, utilidad 5170, margen 32.66.
- Reposición: POST /api/replenishment `{"as_of":"2026-11-13"}` + admin => M01/8/P02/1780, M03/6/P01/2640, M06/0, M08/3/P02/2670. No registrar pedido ni alterar inventario.
- Seguridad: acceso a analytics sin x-admin-key => HTTP403. No exponer costo interno ni supplier_offers en commercial.

## Limitaciones
- Falta integración LLM/AI SDK, estado conversacional, autenticación real por roles, emisión PDF, versiones e idempotencia transaccional, envíos simulados y cron. No presentar como finalizado.
- La base Supabase actual se usa por adaptador; el compañero puede reemplazarla manteniendo contratos.
- Ejecutar pruebas antes y después de cualquier cambio de proveedor de datos.
