---
name: entregar-cambio
description: >
  Checklist fijo para entregar un cambio de la plataforma: revisar qué archivos cambian,
  compilar, revisar en pantalla, hacer commits ordenados, subir la rama y abrir el Pull
  Request hacia master. Usar cada vez que se termina un cambio que el usuario va a revisar.
tags:
  - git
  - release
  - pull-request
  - quality
---

# Entregar un cambio

Seguir los pasos en orden. Si un paso falla, corregir antes de seguir.

## 1. Revisar qué cambia

```bash
git status --short
```

- Solo deben aparecer los archivos del cambio.
- Carpetas sin seguimiento que no son del cambio (por ejemplo `skills/` duplicada) NO se suben. Anotarlas y dejarlas fuera.
- Antes de borrar algo, revisar que no tenga cambios que se pierdan.

## 2. Partir de la versión actual de master

```bash
git fetch origin
git switch -c <tipo>/<tema> origin/master
```

Si la rama ya existe y es del mismo cambio, no crear otra: seguir en ella.

## 3. Compilar y revisar código

En `frontend/`:

```bash
npm run build
npm run lint
```

- `build` incluye la revisión de tipos (`tsc -b`). Un error de tipos hace fallar el build.
- `lint` puede tener avisos de otros archivos que ya existían. Revisar solo los archivos tocados y no agregar avisos nuevos.

## 4. Revisar en pantalla

Usar la vista previa del proyecto (`frontend`, puerto 5173 o 5174):

- Abrir cada capítulo o pantalla que cambió.
- Revisar en escritorio y en móvil (375 px). No puede haber scroll horizontal en la página.
- Revisar que no haya errores en la consola del navegador.
- Probar cada pestaña nueva: que muestre su contenido.

## 5. Commits ordenados

- Un commit por tema (por ejemplo: un panel, o un cambio de textos). Nunca un commit con todo mezclado.
- Mensaje en español, con prefijo: `refactor(ui):`, `style(...):`, `fix(...):`, `feat(...):`, `docs:`.
- Cada commit termina con esta línea:

```
Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>
```

- Al hacer commit, agregar solo los archivos del tema: `git add <ruta>`, no `git add .`.

## 6. Subir la rama

```bash
git push -u origin <nombre-de-la-rama>
```

## 7. Abrir el Pull Request

- Hacia `master`. No marcar como borrador, salvo que el usuario lo pida.
- Título corto en español que diga qué cambió.
- Cuerpo con estas secciones:
  - **Qué cambia:** lista corta, en lenguaje claro.
  - **Para revisar:** decisiones tomadas, datos que faltan, cosas que cambiaron de lugar.
  - **Verificación:** build, lint y revisión en pantalla (escritorio y móvil).
- Terminar el cuerpo con: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

```bash
gh pr create --base master --head <rama> --title "..." --body "..."
```

## 8. Informar al usuario

- Dar el enlace del Pull Request.
- Decir qué quedó pendiente (por ejemplo, datos que faltan).
- No unir el Pull Request a `master` sin que el usuario lo pida.
- Si la rama incluye cambios de otra rama que aún no tiene Pull Request, decirlo.
