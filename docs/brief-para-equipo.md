# Brief técnico para el equipo — Dataset semilla v1
**Propósito:** entregar datos y contratos comunes para web React, API, BD PostgreSQL, tres agentes IA y reposición.
**Fuente:** PDF del docente, 8 páginas. **El dossier que el PDF referencia (secciones 2–13) no se adjuntó**. El dataset es **sintético** y NO es equivalente al dossier original.
**Cobertura:** 8 muebles (M01–M08), 3 proveedores, 8 ofertas, 8 estados de inventario, 6 clientes, 4 personas, 11 líneas de venta de septiembre y octubre, una compra pendiente, solicitud S01 y proforma borrador.
**Cifras fijas de aceptación del PDF:** M04 ancho 100 cm/precio Bs850; M05 ancho140 cm/precio Bs1400; S01 subtotal2480 + transporte100 =2580 con 2 de 4 sillas disponibles; ventas sep9170/oct6660/total15830, utilidad bruta5170, margen32.66%; reposiciones M01 8/P02/Bs1780, M03 6/P01/Bs2640, M06 0, M08 3/P02/Bs2670, total Bs7090.
**Datos completados artificialmente:** nombres de productos, otras medidas, precios M01/M02/M03/M06/M07/M08, costos, todos los registros individuales de venta, inventarios no indicados expresamente, proveedores y ofertas; no presentarlos como hechos del dossier.
**Importación recomendada:** CSV UTF-8 + migraciones PostgreSQL realizadas por responsable BD; `data/policies.json` para configuración y `fixtures/acceptance.json` para pruebas.
**Responsables:** BD implementa modelo relacional/API e importación; agentes consumen endpoints controlados; frontend consume backend; automatización aplica reglas y autorizaciones.
**No enviar emails reales**; usar example.com. Producto sin foto: placeholder.
