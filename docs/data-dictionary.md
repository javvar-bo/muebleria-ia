# Diccionario de datos y diseño lógico
> Paquete **sintético** para el grupo. Valores del enunciado claramente diferenciados en fixtures/acceptance.json.

| Archivo | PK | FK | Uso |
|---|---|---|---|
| products.csv | product_id | — | Catálogo; precios autorizados y costo interno restringido |
| inventory.csv | product_id | products | **Vista/snapshot consolidado por producto** para agentes y pruebas; no importar como segunda fuente de verdad junto con warehouse_stock |
| warehouses.csv | warehouse_id | — | Almacén y sala de exhibición ficticios |
| warehouse_stock.csv | (product_id,warehouse_id) | products, warehouses | **Stock por ubicación**: existencia física, reservado, mínimo, objetivo, fecha de lectura |
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

## Inventario ampliado y normalización
- 40 SKU de M01 a M40. `ALM01` almacén central; `SALA01` sala de exhibición.
- `warehouse_stock.csv` contiene 72 registros: M01–M08 solo en ALM01 para conservar fixtures exactos; M09–M40 distribuidos entre ambos espacios.
- `inventory.csv` es **consolidado de consulta** por producto; derivarlo mediante SUM(physical_stock), SUM(reserved_stock), SUM(minimum_stock), SUM(target_stock) sobre `warehouse_stock`. Sus `confirmed_inbound_within_deadline` se calculan desde compras pendientes confirmadas, filtrando por fecha de llegada requerida.
- Regla stock disponible: SUM(físico − reservado). Reposición global: si disponible <= SUM(mínimo), solicitar max(0, SUM(objetivo) − disponible − pendientes confirmados válidos).
- `minimum_stock` y `target_stock` son **por ubicación**; en los productos originales el almacén central conserva los mínimos/objetivos definidos en el paquete inicial y el showroom no contiene stock original. En los nuevos productos el mínimo del showroom se define en 0: no dispara reposiciones independientes.
- Los 32 productos nuevos tienen stock por encima del mínimo y del objetivo global; así las únicas solicitudes en el escenario de aceptación siguen siendo M01, M03 y M08.
- No sumar `inventory.csv` y `warehouse_stock.csv` como si ambos fueran fuentes de movimientos; evitar duplicar inventario.
- Escenario M06: cantidad pendiente confirmada 6; todavía no aumenta existencia física.
