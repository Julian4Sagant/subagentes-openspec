---
name: owasp-checklist
description: Checklist de auditoría de seguridad contra OWASP Top 10:2025, adaptado a backends Spring Boot con PostgreSQL. Usar al auditar cambios de autenticación, autorización, entradas, errores, logs, configuración o dependencias.
---

# Checklist OWASP Top 10:2025 para backends Spring Boot

Recorré cada categoría sobre el diff del change. Para cada hallazgo anotá archivo:línea,
el escenario de ataque concreto (qué request, qué token o qué entrada) y la severidad
(CRITICAL, WARNING o SUGGESTION). Si una categoría no aplica al cambio, anotalo en una
línea y seguí. Sin evidencia, es una sugerencia, no un hallazgo.

## A01 Control de acceso roto
- Cada endpoint tiene una regla de rol explícita. Ninguna ruta queda abierta por omisión.
- Los objetos accedidos por id verifican que pertenecen al usuario o al tenant.
- Las reglas dependen del orden de la cadena de filtros y de seguridad: revisá ese orden.
- Un cambio de rol o de permiso no se puede hacer desde un endpoint de usuario común.

## A02 Mala configuración de seguridad
- CORS sin `*` combinado con credenciales. Orígenes explícitos.
- Swagger, Actuator y consola de base de datos no expuestos fuera de desarrollo.
- Headers de seguridad presentes donde corresponde. Cookies con `Secure`, `HttpOnly` y `SameSite`.
- Stack traces, mensajes SQL y nombres de clase ausentes de las respuestas.

## A03 Fallas en la cadena de suministro
- Dependencias nuevas o actualizadas: versión fija, sin rangos abiertos.
- Imágenes de contenedor con tag fijo, no `latest`.
- Ningún script descarga y ejecuta código sin verificación.

## A04 Fallas criptográficas
- Tokens firmados con algoritmo fijo. Rechazar `none` y cualquier algoritmo no esperado.
- Comparaciones de secretos en tiempo constante.
- Ningún hash propio: contraseñas con un algoritmo de derivación (bcrypt, argon2, PBKDF2).
- Datos sensibles cifrados en reposo cuando la spec lo pide.

## A05 Inyección
- SQL con parámetros nombrados (`:nombre`) en `JdbcClient`. Nunca concatenado.
- Ordenamientos y nombres de columna dinámicos validados contra una lista blanca.
- Plantillas, expresiones y comandos de sistema sin entrada del usuario.

## A06 Diseño inseguro
- Límites de tamaño del cuerpo, de paginación y de cantidad de elementos.
- Límites de intentos en lo que la spec pida (login, claves).
- Los flujos sensibles no dependen de un solo chequeo del cliente.

## A07 Fallas de autenticación
- Claims del token validados: emisor, audiencia y vencimiento.
- Tokens que sirven para un solo uso o un solo fin no se aceptan en otro endpoint.
- Mensajes de error de autenticación genéricos, sin revelar si el usuario existe.

## A08 Fallas de integridad de software y datos
- Deserialización de entradas con tipos fijos. Nunca tipos arbitrarios desde el cuerpo.
- Migraciones Flyway inmutables una vez aplicadas.
- Actualizaciones de datos verifican la versión o el estado previo cuando hace falta.

## A09 Fallas de logging y alertas
- Ningún log con cuerpos de request, claves, tokens, `X-API-Key` ni datos personales.
- Los eventos de seguridad (login fallido, acceso denegado) se registran.
- Los logs no incluyen valores recibidos que el usuario controla sin validar.

## A10 Manejo incorrecto de condiciones excepcionales
- Ninguna excepción escapa con el formato por defecto del framework.
- Los 5xx no revelan detalles internos.
- Los fallos parciales no dejan datos a medias: transacciones con alcance correcto.
- Un error al validar cuenta como rechazo, no como aceptación.

## Cómo reportar

Terminá con la línea de veredicto que pide tu formato, con los conteos de CRITICAL,
WARNING y SUGGESTION. Los hallazgos CRITICAL y WARNING vuelven al ciclo de corrección.
