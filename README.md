# FERCO — Sistema de Auditorías 5S

> Herramienta web interna para el registro, seguimiento y análisis de auditorías 5S en el área de Operaciones de El Salvador de FERCO Cerámica.

**Producción:** [dashboard5s.netlify.app](https://dashboard5s.netlify.app)

---

## ¿Qué hace esta aplicación?

Digitaliza el ciclo completo de una auditoría 5S:

1. Un **operador** registra hallazgos en los 20 criterios de las 5S con fotos de evidencia
2. El sistema asigna automáticamente la auditoría al **supervisor** y le notifica
3. El **supervisor** revisa los hallazgos, registra soluciones con fotos y lleva el plan de acción
4. Cuando un plan llega al 100%, pasa a revisión y el supervisor lo aprueba para cierre
5. El **administrador** monitorea todo en tiempo real con un dashboard ejecutivo con semaforización por área

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | HTML5 + CSS3 + JavaScript Vanilla | — |
| Fuente | Plus Jakarta Sans (Google Fonts) | — |
| Gráficos | Chart.js | 4.4.1 |
| Base de datos | Firebase Firestore | SDK 10.12.0 |
| Autenticación | Firebase Authentication | SDK 10.12.0 |
| Almacenamiento de fotos | Firebase Storage | SDK 10.12.0 |
| Hosting | Netlify PRO | — |
| CI/CD | GitHub → Netlify (auto-deploy) | — |

**Arquitectura:** SPA de archivo único (`index.html` ~2,400 líneas). Sin bundler, sin framework, sin dependencias npm.

---

## Estructura del repositorio

```
/
├── index.html              # Toda la aplicación (HTML + CSS + JS)
├── netlify.toml            # Configuración de build y secrets scan
├── CLAUDE.md               # Guía de comportamiento para IA
├── FERCO_5S_Documentacion.md  # Documentación técnica completa
├── README.md               # Este archivo
└── .claude/
    └── napkin.md           # Runbook de gotchas y patrones del proyecto
```

---

## Roles y permisos

| Función | Operador | Supervisor | Admin |
|---------|:--------:|:----------:|:-----:|
| Crear nueva auditoría | ✅ | ❌ | ✅ |
| Ver mis auditorías (Kanban) | ✅ | ✅ | ✅ |
| Ver todas las auditorías | ❌ | ❌ | ✅ |
| Registrar soluciones | ❌ | ✅ | ✅ |
| Aprobar cierre de plan | ❌ | ✅ | ✅ |
| Eliminar auditoría | ❌ | ❌ | ✅ |
| Dashboard analytics | ❌ | ✅ | ✅ |
| Gestión de usuarios | ❌ | ❌ | ✅ |
| Configurar formulario | ❌ | ❌ | ✅ |

### Modo Rack (acceso anónimo)

Los operadores de rack pueden acceder sin cuenta mediante un **código QR o código de auditoría**. Desde este modo pueden:
- Registrar soluciones en los hallazgos asignados (solo ítems pendientes)
- Subir fotos de evidencia de la solución
- El sistema mueve automáticamente el plan a "En revisión" cuando llega al 100%

---

## Flujo de estados de una auditoría

```
🟣 Pendiente  →  🟡 En curso  →  🔵 En revisión  →  🟢 Cerrada
                                        ↑
                    Plan al 100% desde usuario rack/anónimo
```

| Estado | Descripción |
|--------|-------------|
| 🟣 Pendiente | Auditoría creada, supervisor aún no ha actuado |
| 🟡 En curso | Supervisor ha registrado al menos una solución |
| 🔵 En revisión | Plan llegó al 100% desde modo rack — pendiente aprobación del supervisor |
| 🟢 Cerrada | Supervisor aprobó y cerró el plan |
| 🔴 Atrasada | Fecha límite superada sin cierre |

---

## Módulos funcionales

### 1. Tablero Kanban
- Columnas por estado (Pendiente / En curso / En revisión / Cerrada / Atrasada)
- Filtros por estado, área y búsqueda libre
- KPIs: total, pendientes, en curso, cerradas, atrasadas
- Barra de progreso por tarjeta (verde ≥80% / amarillo 50–79% / rojo <50%)
- Indicador `⚡ SLA vencido` en tarjetas con hallazgos fuera de plazo

### 2. Nueva Auditoría
- Selección de área (13 áreas predefinidas de Operaciones El Salvador)
- Fecha límite y supervisor asignado
- 20 criterios organizados en 5 categorías (4 ítems por S)
- Por cada criterio: respuesta Sí/No, SLA (24h/48h), hallazgo en texto y fotos de evidencia
- Fotos subidas a Firebase Storage (best-effort — no bloquean el guardado principal)

### 3. Modal de auditoría (Supervisor/Admin)
- Vista completa del plan: criterios, hallazgos, fotos del auditor
- Countdown en tiempo real del SLA restante por ítem
- Campo de solución y subida de fotos de evidencia por ítem
- Botones de acción: Guardar progreso / Aprobar y cerrar / Regresar a En curso

### 4. Dashboard 5S
- KPIs globales: cumplimiento general, tasa de cierre, SLA vencidos, áreas evaluadas
- Semaforización por área (verde ≥80% / amarillo 50–79% / rojo <50%)
- Gráfico de barras: cumplimiento por cada S
- Gráfico de dona: distribución de estados
- Desglose por categoría 5S con porcentajes y conteos

### 5. Gestión de Usuarios (Admin)
- Crear usuarios directamente desde la app (Firebase Auth + Firestore)
- Cambiar rol en tiempo real (Operador / Supervisor / Administrador)
- Tabla con nombre, correo y rol actual

### 6. Notificaciones in-app

### 7. Configuración (Admin)
- Constructor visual para modificar las categorías y criterios del formulario 5S
- Requiere re-autenticación con contraseña de administrador para guardar cambios
- Guarda un *snapshot* del formulario en cada auditoría, garantizando retro-compatibilidad (auditorías antiguas mantienen su estructura original)
- Esquema central guardado en Firestore (`settings/form`)

### 6. Notificaciones in-app
- Campanita con badge de no leídas en tiempo real (Firestore `onSnapshot`)
- Eventos que generan notificaciones:

| Evento | Destinatario |
|--------|-------------|
| Nueva auditoría creada | Supervisor asignado |
| Supervisor guarda progreso | Auditor/Operador |
| Plan al 100% → revisión (modo rack) | Supervisor asignado |
| Plan aprobado y cerrado | Auditor/Operador |
| @mención en nota | Usuario mencionado |

---

## Cálculo de score

```
Por cada criterio:
  "si"                             → 100%
  "no" + solución registrada       → 100%  (resuelto)
  "no" + sin solución              →   0%
  null                             → excluido del promedio

Score por S  = promedio de criterios con respuesta en esa S
Score global = promedio de los 5 scores por S
```

---

## Infraestructura Firebase

| Servicio | Plan | Uso |
|----------|------|-----|
| Firestore | Blaze | Auditorías, usuarios, notificaciones |
| Authentication | Blaze | Login email/password + anónimo (modo rack) |
| Storage | Blaze | Fotos de evidencia bajo `audits/{id}/auditor/` y `audits/{id}/supervisor/` |

### Colecciones Firestore

```
users/{uid}
  name, email, role, createdAt

audits/{auditId}
  area, status, auditorId, supervisorId, deadline
  criterios: { s0_i0: "si"|"no"|null, ... }   // 20 ítems
  soluciones: { s0_i0: "texto", ... }
  hallazgos:  { s0_i0: "texto", ... }
  hallazgoSLA: { s0_i0: 24|48, ... }
  evidencias_auditor:     { s0_i0: [url, ...], ... }
  evidencias_supervisor:  { s0_i0: [url, ...], ... }
  guestAudit: boolean     // true si es modo rack
  auditCode: string       // código único generado
  formSnapshot: array     // copia del formulario al momento de creación
  closedAt, approvedBy, createdAt, updatedAt

notifications/{notifId}
  recipientId, title, body, auditId, type, read, createdAt
```

### Reglas de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email != null;
    }
    match /audits/{id} {
      allow read, write: if request.auth != null;
    }
    match /notifications/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Reglas de Firebase Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /audits/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Áreas auditadas

Rack 1 · Rack 2 · Rack 3 · Rack 4 · Rack 5 · Rack 6 · Grifería · Pasillo 2 · Pasillo 3 · Pasillo 4 · Pasillo 5 · Pasillo 6 · Pasillo 7

---

## Criterios 5S

| S | Categoría | Criterios |
|---|-----------|-----------|
| 1ª S | Separar | Un solo SKU por posición · Sin tarimas dañadas en rack · Sin producto a granel encimado · Sin producto dañado en posición |
| 2ª S | Situar | Identificación de ubicaciones · Señalización de pasillos · Etiquetado correcto · Demarcación de zonas de tránsito |
| 3ª S | Suprimir suciedad | Pisos limpios · Racks libres de polvo · Contenedores de basura en uso · Área limpia al finalizar turno |
| 4ª S | Señalizar | Licencia de ingreso en tarimas completas · Producto en áreas establecidas · Señalética de seguridad visible · Indicadores de capacidad visibles |
| 5ª S | Sostener | Tarimas estibadas respetando tamaños · Sin parciales en granel · Uso de equipo de seguridad · Cumplimiento de procedimientos |

---

## CI/CD — Deploy automático

```
Editar index.html localmente
         ↓
git add index.html && git commit -m "fix: ..."
         ↓
git push origin main
         ↓
Netlify detecta el push → build en ~5 segundos
         ↓
https://dashboard5s.netlify.app actualizado
```

**No hay paso de build** — el archivo se publica directamente. El `netlify.toml` declara `publish = "."`.

---

## Pendiente / Roadmap

- [ ] **Notificaciones por correo** — Resend + Netlify Function (código listo en historial git, pendiente verificar dominio `@ferco.com.gt` en Resend)
- [ ] **Dashboard analytics avanzado** — gauge por área, calendario de calor, gráfica de tendencia lineal
- [ ] **Exportar PDF** de auditoría individual
- [ ] **Filtro por rango de fechas** en el Kanban

---

## Seguridad

- La Firebase API Key del cliente (`AIza...`) es **pública por diseño** — la seguridad real está en las reglas de Firestore y Storage, no en ocultar esta key.
- La key tiene restricción de dominio en Google Cloud Console: solo funciona desde `dashboard5s.netlify.app` y `localhost`.
- El secrets scanner de Netlify está configurado para omitir este falso positivo (`netlify.toml`).

---

*FERCO Cerámica — Operaciones El Salvador · Sistema de Auditorías 5S · v1.1 · Mayo 2026*
