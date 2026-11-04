---
name: textos-para-analista
description: >
  Reglas de redacción para todo lo que el usuario ve en pantalla y en sus respuestas:
  lenguaje de negocio, sin siglas técnicas ni nombres de código, con un glosario de
  términos del mercado inmobiliario boliviano. Usar al escribir títulos, etiquetas,
  encabezados de tablas, leyendas de gráficos o resúmenes para el usuario.
tags:
  - writing
  - business-language
  - ui-copy
  - bolivia-market
---

# Textos para analista de negocios

El usuario es analista de inteligencia de negocios. No programa. Ve datos y gráficas. Todo texto visible debe leerse como un informe de negocio.

## Reglas

1. **Nada técnico en pantalla.** Sin nombres de código, sin "Módulo 0X", sin "auditado de Looker Studio", sin "pestaña" dentro del nombre de un botón, sin "sub-pestaña".
2. **Sin abreviaturas que el usuario no use.** Escribir "superficie" en vez de "Sup.", "precio por m²" en vez de "Precio/m²".
3. **Un título dice qué se mide y en qué unidad.** Ejemplo: "Unidades por vender, por año".
4. **Nombres de pestaña = los que pidió el usuario.** Si el usuario escribió un nombre, usarlo tal cual (con sus tildes). Si hay un error de tipeo en su lista, corregirlo y decirlo en el resumen.
5. **Una frase corta por aclaración.** Si hace falta explicar un término, usar un ejemplo con números.
6. **Las etiquetas de gráficos y tablas siguen la misma regla** que los títulos.
7. **En el chat:** respuestas cortas, pasos claros, sin rodeos. Si algo no está hecho, decirlo primero.

## Reemplazos ya usados en la plataforma

| Evitar | Usar |
|---|---|
| Velocidad Venta | Ritmo de venta |
| Balance Vendido vs Vacante | Vendido vs por vender |
| Stock Unds por Vender | Unidades por vender |
| Stock Capital ($US M) | Capital por vender ($US M) |
| Matriz Estadística Censal | Resumen anual de la oferta |
| Sup. Mínima / Máxima / Promedio | Superficie mínima / máxima / promedio |
| Precio/m² Mín. | Precio por m² mínimo |
| Und. Totales | Unidades totales |
| Meses Stock | Meses para vender el stock |
| Comportamiento Cíclico | Nivel relativo |
| Serie Mensual de Velocidad de Absorción | Ritmo de venta por mes |
| Ticket Objetivo | Precio objetivo |
| Filosofía de Áreas Comunes | Áreas comunes |
| Dcto. Contado | Descuento al contado |
| Tasa deflactada | Cambio anual, descontando la inflación |
| Default (en un título) | Dejar de pagar su crédito |
| Pico pos-pandemia | Pico después de la pandemia |
| T/C oficial | Tipo de cambio oficial |
| Ratio | Porcentaje o tasa (según el caso) |
| Ratio deuda / ingreso | Porcentaje de la deuda sobre el ingreso |
| Ticket Lista ($US) / Ticket promedio | Precio de lista / Precio promedio |
| Ticket medio hipotecario | Monto promedio del préstamo |
| Plazo de Absorción | Tiempo para vender todo el stock |
| Absorción saludable (<12m) | Ritmo sano de venta (menos de 12 meses) |
| Presión moderada (12-18m) | Presión moderada (12 a 18 meses) |
| Sobre-inventario (>18m) | Exceso de unidades por vender (más de 18 meses) |
| Velocidad de Absorción (Ritmo) | Ritmo de venta |
| Und. Vendidas | Unidades vendidas |
| Matriz Oficial 01-E | Tabla oficial de tipologías |
| Matriz Analítica Comparativa (Head-to-Head) | Comparación lado a lado |
| Desempeño Comercial y Absorción | Desempeño comercial y ritmo de venta |
| unds / und. | unidades |

## Glosario del mercado (términos que sí se pueden usar)

- **VIS (vivienda de interés social):** vivienda social con crédito regulado.
- **Brecha cambiaria:** diferencia entre el precio en dólar oficial y en dólar paralelo.
- **Mora:** cuotas de crédito atrasadas.
- **Mora reprogramada:** atraso que el banco aceptó renegociar con nuevos plazos.
- **Adjudicado:** inmueble que el banco se queda cuando el deudor no paga.
- **Remate judicial:** venta forzosa de un inmueble en un juzgado.
- **Stock:** unidades o dinero que todavía no se han vendido.
- **Reventa / mercado secundario:** venta de una propiedad entre particulares, no por el constructor.
- **Ritmo de venta:** porcentaje o cantidad de unidades vendidas por mes.
- **Cuota inicial:** parte del precio que se paga al contado antes del crédito.
- **Tipología:** modelo de departamento según cantidad de cuartos (1 dormitorio, 2, 3, etc.).

## Cómo revisar

Buscar las palabras prohibidas en los paneles (ignora comentarios, que no se ven):

```bash
grep -n -E "Pestaña|Sup\.|Precio/m²|Und\.|Absorci|Ticket|Filosofía|Matriz|Módulo 0|auditad|Looker|Dcto\.|Ratio|Head-to-Head|unds" frontend/src/components/*Panel.tsx
```

Cada coincidencia que se ve en pantalla debe cambiarse con la tabla de arriba. Las que son nombres de variables en el código (por ejemplo `probabilidadDefault`) no se tocan.

## Revisión antes de entregar

- [ ] Ningún texto visible contiene nombres de código o siglas que el usuario no usa.
- [ ] Los títulos dicen qué se mide y en qué unidad.
- [ ] Los nombres de pestaña coinciden con la lista del usuario.
