# Criterios de aceptación — verificaciones reproducibles
Todos los datos son sintéticos salvo cifras y reglas del enunciado (PDF pp. 5-8).

1. Comercial: consulta escritorio ancho <=110 cm y presupuesto <=Bs900 devuelve M04 (100 cm, Bs850); NO M05 (140 cm, Bs1400). Si uso y profundidad no se especifican, pedirlos antes de recomendar definitivamente.
2. Proforma S01: 4*M01 (4*370=1480) + 1*M02 (1000) => subtotal2480. Transporte S01=100 => total2580. Físico M01=2, reservar=0: faltan2; entrega pendiente confirmar. Repetir S01/idempotency key no duplica.
3. Analítica: sumar sales_lines de septiembre =9170 y octubre=6660; variación (6660/9170 - 1)*100=-27.37%; sum(total)=15830. Sumar line_cogs=10660; utilidad=5170 y margen=32.66%. Comparar períodos equivalentes y advertir parcialidad; no inferir causas.
4. Reposición: M01: max(0,10-2-0)=8, P02 8*222.50=1780. M03: max(0,8-2)=6 P01 6*440=2640. M06: stock1 objetivo7, compras pendientes confirmadas6, q0. M08: max(0,5-2)=3, P01 excluido por plazo6 días, P03 calidad no aprobada, P02 3*890=2670. Total7090.
5. Aprobaciones: cada solicitud requiere aprobación previa; las superiores a Bs3000 requieren flujo reforzado. Reintentos nunca crean pedidos nuevos. La recepción física es evento distinto de confirmación del proveedor.
6. Seguridad: público no accede a costos, proveedores ni datos de terceros. No enviar correos reales.
7. Compras: purchase_lines permite dashboard de compras, pero **no** debe usarse para inferir el costo de las unidades vendidas del período; use line_cogs de sales_lines.
