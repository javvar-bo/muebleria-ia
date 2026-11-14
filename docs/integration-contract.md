# Contratos iniciales de integración para el grupo
API de negocio versionada: `/api/v1`. Peticiones JSON HTTPS; servidor aplica autorización por rol; respuestas con `request_id` y `data_as_of` cuando sean datos de inventario.

## Agente comercial
- `GET /api/v1/products?category=&max_price_bob=&max_width_cm=`: campos públicos (sin costo interno).
- `GET /api/v1/inventory/{product_id}/availability`: disponible = físico - reservas; incluir fecha y frescura.
- `POST /api/v1/quote-requests`: customer_id, confirmed_email, items[{product_id, quantity}], notes; devuelve request_id.
- Si faltan profundidad/uso consultar antes de recomendar M04; prohibido inventar disponibilidad.

## Agente proformas
- `GET /api/v1/quote-requests/{request_id}`
- `POST /api/v1/quotes/issue`: request_id, idempotency_key; cálculos/versión/PDF en backend determinista.
- `POST /api/v1/quotes/{quote_id}/simulate-send`: idempotency_key, confirmed_email; no correo real.
- `GET /api/v1/quotes/{quote_id}`: estado, versión, URL firmada PDF, historial.
- Descuento especial y entrega fuera cobertura: revisión humana. Proforma no reserva stock ni registra venta.

## Agente analítico
- `GET /api/v1/reports/sales?from=&to=&product_id=&seller_id=&customer_id=`
- `GET /api/v1/reports/purchases?from=&to=&supplier_id=&product_id=`
- `GET /api/v1/reports/gross-margin?from=&to=&product_id=`
- `GET /api/v1/reports/inventory`
- `GET /api/v1/reports/quotes`
- Todos devuelven filtros aplicados, moneda, periodo, datos y fecha de actualización; herramientas **solo lectura**, sin SQL arbitrario.

## Reposición — automatización, no agente LLM
- `POST /api/v1/replenishment/runs`: admite `dry_run=true`, idempotency_key y rol autorizado.
- `POST /api/v1/purchase-requests/{id}/approve`: gerencia, auditoría.
- Reposición calculada por producto; filtrar calidad, mínimo, disponibilidad, plazo <=5 días; mínimo costo total.
- Programar 08:00 `America/La_Paz`; en hosting gratis la precisión al minuto puede no estar garantizada.

## Respuestas/errores
Usar `{data,meta:{request_id, data_as_of},error:null}` para éxito; `{data:null,error:{code,message,details}}` para error. HTTP 400 validación, 401/403 auth, 404 no encontrado, 409 duplicado/conflicto, 422 estado inválido.

## Seguridad
Nunca exponer API keys al navegador, ni costos o información de otro cliente; autorización centralizada y logs sin PII sensible. Preferir backend mediador antes que acceso directo de LLM a PostgreSQL.
