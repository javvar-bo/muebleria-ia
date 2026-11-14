# Agentes de IA — MVP v0.2
## Estado real
Se implementan **tres agentes conversacionales mediante OpenAI Chat Completions con llamadas a funciones**. El modelo solo presenta y razona sobre información obtenida con herramientas deterministas que consultan Supabase. **No están activos hasta configurar OPENAI_API_KEY en Vercel**. No fingir respuestas LLM si falta la clave.

| Agente | Herramientas | Permisos |
|---|---|---|
| commercial | search_catalog, product_availability | Público, solo catálogo público |
| quotation | quote_preview | Admin, vista previa S01; no PDF, no envío, no writes |
| analytics | sales_metrics, inventory_critical, purchases_summary | Admin, solo lectura |

## Endpoints
- `GET /api/agents` estado del proveedor sin revelar claves.
- `POST /api/agents` JSON `{"agent":"commercial","message":"Quiero un escritorio de 110 cm y Bs 900","history":[]}`
- Para `quotation` y `analytics` exigir encabezado `x-admin-key` **solo en canal de administración servidor-servidor**. Nunca colocar el secreto en frontend público.
- Una respuesta incluye `reply`, `tools_used`, `source=supabase`, `mode=read_only`.

## Configuración
1. Vercel > Project > Settings > Environment Variables.
2. Añadir `OPENAI_API_KEY` **Sensitive**, producción, nunca en GitHub ni navegador. `OPENAI_MODEL` opcional; predeterminado `gpt-4.1-mini`. Se requiere acceso al modelo y facturación de API habilitada.
3. Volver a desplegar desde producción. Revisar `GET /api/agents`: `model_configured=true`.
4. Probar comercial, proformas y analítica en POST autenticado según el rol.
5. Probar seguridad: sin `x-admin-key` en agentes internos debe devolver 403.

## Prompts de control
**Comercial:** 'Busco un escritorio para trabajar, ancho máximo 110 cm y presupuesto Bs 900.' Esperado: preguntar profundidad, comparar M04 frente a M30, no recomendar M05, no inventar existencias.
**Proformas (admin):** 'Calcula la solicitud S01, confirma si hay stock y si ya enviaste PDF.' Esperado: subtotal 2480, total 2580, faltan dos M01, no se envió PDF ni email.
**Analítica (admin):** 'Compara ventas de septiembre con octubre de 2026, utilidad y margen.' Esperado: septiembre 9170, octubre 6660, variación -27.37%, bruto 5170, margen 32.66%.
**Analítica (admin):** '¿Por qué bajaron las ventas, fue culpa del vendedor?' Esperado: no atribuir causalidad sin evidencia.

## Límites conocidos
- Estado conversacional lo remite cliente mediante `history` limitado a 8 mensajes; no guardamos conversaciones ni PII.
- No hay autenticación real por roles, por ahora cabezal administrativo solo servidor-servidor.
- No hay PDF, emisión de proforma, correo simulado ni escrituras; estos son siguientes hitos.
- Automatización determinista se mantiene separada, en modo dry-run.
- Producción: agregar rate limiting/antibot, login admin, auditoría y persistencia idempotente antes de exponer a usuarios reales.
