# Agent MVP readiness v1.1 (sin Supabase)
**Los tres agentes pueden desarrollarse sobre datos locales CSV/JSON** a través de un adaptador `FixtureRepository` de solo lectura y un estado simulado desacoplado. El backend real se conectará después.

## Hallazgos corregidos
1. Se ajustaron los objetivos de stock de ALM01 para M09-M40: la suma por almacenes coincide ahora con `inventory.csv` para los 40 artículos. El producto de exhibición forma parte del stock físico, pero debe parametrizarse si se permite venderlo.
2. Se mantienen M01-M08 y cifras del caso. M30 entra en el filtro ancho/precio del caso de escritorio: se añade clasificación de uso ficticia en `data/product_usage.csv` para que M04 pueda justificarse por uso *home_office* mientras M30 se mantiene como opción de estudio juvenil; no manipular resultados por ID.
3. Se amplían pruebas con `fixtures/conversations.json`, `fixtures/quotation-scenarios.json` y `fixtures/analytics-questions.json`.
4. Se propone `fixtures/agent-io-contracts.json` para nombres de herramientas y estructuras de mensajes.

## Reglas de la primera versión
- `inventory.csv` es una *proyección* de `warehouse_stock.csv`; **no sumar ambos**. ALM01/SALA01 son ubicaciones de demo.
- Con los datos de aceptación, M01 pide 8 unidades P02; M03 pide 6 P01; M06 0 por compra pendiente; M08 pide 3 P02. Total Bs 7090.
- Los datos de ventas de septiembre y octubre son muestra cerrada: no mezclar ventas nuevas de demostración en el mismo conjunto al ejecutar pruebas de aceptación.
- Proforma S01 es estado **DRAFT** para el fixture: no existe un PDF real ni correo enviado.
- Para probar versiones, envío, errores e idempotencia, utilizar un almacenamiento simulado **externo al sistema de archivos de ejecución de Vercel**. Las funciones de Vercel no tienen almacenamiento persistente de escritura.
- `transport_local_bob=100` solo aplica al escenario S01: otros casos requieren política validada; la retirada sin transporte de QT02 es una suposición ficticia de prueba.
- `expiry_days=null` significa **pendiente de política**, no crear vencimientos arbitrarios.
- El LLM interpreta y presenta; cálculos, correos y permisos son operaciones deterministas.

## Supabase
Integración de Supabase autorizada por usuario; el acceso operativo a herramientas/proyecto se verifica por separado. Antes de crear tablas reales, el compañero responsable de base de datos debe acordar proyecto, esquema, ambiente y migraciones. Nunca exponer credenciales de servicio al navegador.
