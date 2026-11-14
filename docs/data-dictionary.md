# Diccionario de datos y diseño lógico
> Paquete **sintético** para el grupo. Valores del enunciado claramente diferenciados en fixtures/acceptance.json.

| Archivo | PK | FK | Uso |
|---|---|---|---|
| products.csv | product_id | — | Catálogo; precios autorizados y costo interno restringido |
| inventory.csv | product_id | products | Existencia, reservas, mínimo, objetivo, pendientes válidos, marca temporal |
| suppliers.csv | supplier_id | — | Proveedores ficticios |
| supplier_offers.csv | offer_id | suppliers, products | Precios, vigencia, calidad, mínimos, capacidad y plazo |
| customers.csv | customer_id | — | Contactos `example.com` solamente |
| staff.csv | staff_id | — | Personal ficticio para filtros |
| sales_lines.csv | sale_line_id | customers, staff, products | Una fila por línea de venta confirmada; incorpora COGS histórico |
| pending_purchases.csv | purchase_id | suppliers, products | Compras **confirmadas** por proveedor |
| requests.csv | request_id | customers | Solicitudes web |
| request_lines.csv | (request_id,product_id) | requests, products | Líneas solicitadas |
| quotes.csv | (quote_id,version) | requests | Proformas y versiones; no implican ventas |

## Reglas técnicas para el compañero de base de datos
- PostgreSQL recomendado: `NUMERIC(12,2)` para importes, `INTEGER CHECK (quantity >= 0)` para stock, `TIMESTAMPTZ` para eventos, ID de texto como clave natural de prototipo.
- Product price y costos como dimensiones separadas; el público solo ve `sale_price_bob`, nunca `unit_cogs_bob` ni `supplier_offers`.
- `sales_lines` es un **fixture de ventas confirmadas** y no se sincroniza como movimiento de inventario sobre el snapshot inicial.
- Inventario es instantánea 2026-11-13, ventas son historia 2026-09/10. Evitar restar nuevamente ventas históricas del stock del snapshot.
- Registrar una tabla independiente de `stock_movements` al pasar a operaciones reales.
- Compras pendientes confirmadas cuentan para reposición solo cuando cumplen plazo; no aumentan stock físico hasta recepción.
- El valor `confirmed_inbound_within_deadline` es cache **derivada** del registro pending_purchases y no debe mantenerse manualmente como segunda verdad.
- Establecer restricciones únicas para solicitud, versión de proforma y clave de reposición por corrida; transacciones y control de concurrencia.
- La proforma no equivale a venta ni a reserva. La aceptación no convierte automáticamente en venta.
- El email de salida en la práctica es simulado; no enviar mensajes reales.
- Las fechas, descripciones, descuentos, atributos no especificados y personas de prueba están inventados.
