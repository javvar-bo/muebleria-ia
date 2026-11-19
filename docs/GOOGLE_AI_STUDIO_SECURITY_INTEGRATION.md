# MuebleGest AI — Supabase: seguridad y conexión con Google AI Studio

Estado verificado: **19 de noviembre de 2026 (hora UTC)**. Especificación para conectar la aplicación existente, no una app nueva.

## Proyecto e infraestructura

- Supabase Project ID: `jldeoyphvkmiizfmxdyc`
- API URL: `https://jldeoyphvkmiizfmxdyc.supabase.co`
- React/Google AI Studio: configurar `SUPABASE_URL` y `SUPABASE_ANON_KEY` con la **publishable key**.
- Nunca enviar `SUPABASE_SECRET_KEY`, clave `service_role` ni Gemini API secreta al navegador.
- Documentación del caso: `data/policies.json`, `docs/integration-contract.md`, `fixtures/acceptance.json`.

## Estado de datos

- 100 productos M01–M100; 192 filas de existencias; 192 ofertas; 3 proveedores.
- 11 categorías, 9 secciones informativas, 10 preguntas frecuentes.
- 100 referencias a ilustraciones SVG de carácter genérico: **no** son fotos verificadas de productos.
- Bucket público `product-catalog` (vacío); bucket privado `quote-documents` para PDF futuros.
- Los datos académicos de ventas, proformas y compras existentes no fueron modificados.

## Auth y roles (implementado en Supabase)

Tablas: `user_profiles`, `roles`, `permissions`, `role_permissions`,
`user_roles`, `audit_logs`, `approval_requests`, `customer_assignments`,
`staff_auth_links`, `inventory_movements`, `quote_documents`, `quote_operation_keys`.

Roles internos activos en `roles`: `VENDEDOR`, `COMPRAS`, `GERENCIA`, `ADMINISTRADOR`.
**VISITANTE** equivale a sesión pública, sin acceso administrativo. No se asigna a `auth.users`.

**Todavía no se han creado usuarios de Supabase Auth ni se ha probado inicio de sesión real**.
`staff` contiene 4 empleados ficticios para filtros, pero no cuentas Auth.
No autogenerar contraseñas ni convertir automáticamente empleados ficticios en usuarios.

Supabase Auth genera automáticamente `user_profiles` al crear un usuario.
No se autoasigna ningún rol. Un administrador existente puede gestionar los roles mediante la RPC protegida `assign_staff_role`.
Para el **primer administrador**, el propietario debe primero registrar una cuenta legítima por Supabase Auth y luego asignarle `ADMINISTRADOR` mediante una única operación manual en SQL Editor del proyecto, utilizando el ID verificado de `auth.users`. No abrir un endpoint público de bootstrap ni una pantalla de registro con rol seleccionable.

RLS está habilitado en las tablas. Las tablas sensibles siguen denegadas por defecto; no dar `select *` a `anon` o `authenticated`. Habilitar las funciones específicas al ampliar módulos.

## Funciones seguras disponibles

| Función RPC | Quien la invoca | Qué devuelve/hace |
|---|---|---|
| `catalog_public_products()` | Visitante/autenticado | Producto + precio público + disponibilidad + imagen; **sin costo interno** |
| `my_access()` | Autenticado | Rol y permisos efectivos (consulta basada en JWT) |
| `current_app_role()` | Autenticado | Rol interno activo |
| `has_permission(permission_code)` | Autenticado | Verifica permiso y estado del usuario |
| `supplier_directory()` | Compras/Gerencia/Admin con permiso | Directorio y cantidad de ofertas |
| `compare_supplier_offers(target_product)` | Permiso `suppliers.read` | Ofertas vigentes por producto |
| `inventory_internal()` | Permiso `inventory.read_internal` | Stock por almacén |
| `sales_dashboard(start_on,end_on)` | Permiso `analytics.financial_read` | Ventas, costo de ventas, utilidad y margen |
| `quote_preview(target_request)` | Preparación/lectura autorizada de proformas | Vista previa; vendedor restringido a clientes asignados |
| `submit_purchase_approval(request_ref,amount,justification)` | Compras con permiso | Nueva aprobación usando importe verificable |
| `approve_business_request(approval_key,decision,comment)` | Gerencia con permiso | Resuelve aprobación; no ejecuta compra física |
| `assign_staff_role(target_user,new_role)` | Administrador con permisos | Asigna rol, impide autoescalamiento |
| `set_staff_account_status(target_user,new_status)` | Administrador con permiso | Activa o suspende un usuario |

Privilegios SQL: solo la RPC pública de catálogo está ejecutable como anónimo; otras funciones sensibles no. La función trigger de Auth no es invocable desde API.

`catalog_categories`, `site_content` y `site_faq` permiten solo lectura pública de filas activas/publicadas. Las funciones de seguridad usan `auth.uid()` + permisos vigentes; **no** confiar en un rol que suministre React.

## Ejemplos en React + supabase-js

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
// Si AI Studio usa process.env u otra convención,
// adaptar los nombres SIN copiar secretos al frontend.

const catalog = await supabase.rpc('catalog_public_products');
const categories = await supabase.from('catalog_categories').select('*').order('sort_order');
const faqs = await supabase.from('site_faq').select('*').order('position');

const { data: signIn, error: loginError } = await supabase.auth.signInWithPassword({
  email: providedEmail,
  password: providedPassword
});
if (loginError) throw loginError;

const { data: access, error: accessError } = await supabase.rpc('my_access');
if (accessError) throw accessError;
// No basta con ocultar botones. Las RPC deben validar permisos.

const suppliers = await supabase.rpc('supplier_directory');
const inventory = await supabase.rpc('inventory_internal');
const report = await supabase.rpc('sales_dashboard', { start_on: '2026-09-01', end_on: '2026-10-31' });
```

Si la aplicación original solicita variables `SUPABASE_URL` y `SUPABASE_ANON_KEY`, mantener esos identificadores o adaptar claramente el mapeo; Vite expone al cliente solo variables con prefijo `VITE_` según configuración. La clave publishable es pública; la service role no.

## Pendiente de desarrollo real en Google AI Studio / backend

- Integración React del inicio de sesión, recuperación de contraseña y rutas protegidas.
- Alta de cuatro usuarios internos y asignación inicial de roles mediante Auth.
- Asignación de clientes a vendedores para que puedan consultar solicitudes.
- APIs de creación, actualización y emisión transaccional de proformas.
- Generación física del PDF y enlace firmado del bucket privado.
- Envío simulado a `example.com` con idempotencia real.
- Ajustes y recepciones de inventario mediante transacciones auditadas.
- Motor programado de reposición y flujo completo de aprobaciones/pedidos.
- Integración de Gemini API **sin contratar servicios de pago** y herramientas específicas por agente.
- Pruebas end-to-end por usuario, permisos, políticas RLS y cuotas.

## Pruebas de aceptación obligatorias

- Consulta M04 100cm/Bs850, excluir M05 140cm/Bs1400; considerar M30 110cm/Bs790 con explicación.
- S01: 4×M01 + 1×M02 subtotal Bs2480, transporte autorizado Bs100, total Bs2580; faltan dos M01.
- Ventas septiembre Bs9170, octubre Bs6660, variación −27,37%; utilidad Bs5170 sobre Bs15830 y margen 32,66%.
- Reposición histórica: M01/P02 Bs1780; M03/P01 Bs2640; M06 no duplicar; M08/P02 Bs2670; total Bs7090.
- Una proforma no es venta ni reserva stock; pedidos pendientes no se cuentan como recibido.
- Anónimo no accede a `products` directo con costos, proveedores, reportes ni funciones internas.
- Vendedor no accede a analítica financiera o solicitudes de clientes no asignados.
- Compras no puede autoaprobar su solicitud; Administrador no aprueba finanzas solo por rol.
- Usuarios suspendidos no tienen permisos efectivos.

**No declarar la aplicación terminada antes de validar estos escenarios a través de usuarios reales y la interfaz generada por Google AI Studio.**
