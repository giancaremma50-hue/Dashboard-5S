# Sistema de Auditorías 5S — FERCO Cerámica
**Documentación técnica y funcional · Versión 1.0 · Mayo 2026**

---

## Índice

1. [Descripción general](#1-descripción-general)
2. [Arquitectura técnica](#2-arquitectura-técnica)
3. [Roles y permisos](#3-roles-y-permisos)
4. [Módulos y funcionalidades](#4-módulos-y-funcionalidades)
5. [Formulario de auditoría 5S](#5-formulario-de-auditoría-5s)
6. [Sistema de SLA](#6-sistema-de-sla)
7. [Tablero Kanban](#7-tablero-kanban)
8. [Dashboard y visualización](#8-dashboard-y-visualización)
9. [Sistema de notificaciones](#9-sistema-de-notificaciones)
10. [Gestión de usuarios](#10-gestión-de-usuarios)
11. [Áreas auditadas](#11-áreas-auditadas)
12. [Criterios 5S](#12-criterios-5s)
13. [Infraestructura y despliegue](#13-infraestructura-y-despliegue)
14. [Seguridad](#14-seguridad)
15. [Flujo completo de una auditoría](#15-flujo-completo-de-una-auditoría)
16. [Usuarios del sistema](#16-usuarios-del-sistema)
17. [Glosario](#17-glosario)

---

## 1. Descripción general

El **Sistema de Auditorías 5S de FERCO Cerámica** es una herramienta web de registro, control, seguimiento y visualización de auditorías 5S aplicadas al área de Operaciones de El Salvador.

La metodología 5S es un sistema de organización del espacio de trabajo basado en cinco principios japoneses:

| S | Nombre japonés | Concepto |
|---|---|---|
| 1ª S | Seiri | Separar y eliminar lo innecesario |
| 2ª S | Seiton | Situar e identificar lo necesario |
| 3ª S | Seiso | Suprimir la suciedad |
| 4ª S | Seiketsu | Señalizar y estandarizar |
| 5ª S | Shitsuke | Sostener y respetar |

La herramienta digitaliza el proceso completo: desde el registro del hallazgo por parte del operador, la asignación al supervisor, el seguimiento de soluciones con evidencia fotográfica, hasta el cierre y análisis en el dashboard ejecutivo.

---

## 2. Arquitectura técnica

### Stack tecnológico

| Componente | Tecnología | Descripción |
|---|---|---|
| Frontend | HTML5 + CSS3 + JavaScript (Vanilla) | Single Page Application (SPA) en un solo archivo |
| Base de datos | Firebase Firestore | Base de datos NoSQL en tiempo real |
| Autenticación | Firebase Authentication | Login con correo y contraseña |
| Almacenamiento | Firebase Storage | Subida de fotos de evidencia |
| Gráficos | Chart.js 4.4.1 | Gráficos de barras y dona |
| Hosting | Netlify (PRO) | Deploy automático desde GitHub |
| CI/CD | GitHub + Netlify | Push a main = redeploy automático |

### Estructura de datos en Firestore

#### Colección `users`
```
users/{uid}
  ├── name: string
  ├── email: string
  ├── role: "operador" | "supervisor" | "admin"
  └── createdAt: timestamp
```

#### Colección `audits`
```
audits/{auditId}
  ├── area: string                        // Área auditada (Rack 1, Pasillo 3, etc.)
  ├── obs: string                         // Observaciones generales
  ├── status: "pending"|"inprog"|"closed"|"late"
  ├── auditorId: string                   // UID del operador
  ├── auditorName: string
  ├── supervisorId: string                // UID del supervisor asignado
  ├── supervisorName: string
  ├── deadline: timestamp                 // Fecha límite de la auditoría
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── closedAt: timestamp
  ├── criterios: {                        // Respuestas del formulario
  │     "s0_i0": "si" | "no" | null,
  │     "s0_i1": "si" | "no" | null,
  │     ... (20 ítems total: 5 secciones × 4 ítems)
  │   }
  ├── hallazgos: {                        // Texto de hallazgo por ítem
  │     "s0_i0": string,
  │     ...
  │   }
  ├── hallazgoSLA: {                      // SLA en horas por ítem
  │     "s0_i0": 24 | 48,
  │     ...
  │   }
  ├── soluciones: {                       // Texto de solución por ítem (supervisor)
  │     "s0_i0": string,
  │     ...
  │   }
  ├── evidencias_auditor: {              // URLs de fotos del auditor
  │     "s0_i0": [url1, url2, ...],
  │     ...
  │   }
  └── evidencias_supervisor: {           // URLs de fotos del supervisor
        "s0_i0": [url1, url2, ...],
        ...
      }
```

#### Colección `notifications`
```
notifications/{notifId}
  ├── recipientId: string       // UID del destinatario
  ├── title: string
  ├── body: string
  ├── auditId: string
  ├── type: "assignment"|"update"|"closed"
  ├── read: boolean
  └── createdAt: timestamp
```

---

## 3. Roles y permisos

El sistema maneja tres roles con acceso diferenciado:

### Operador
- Acceso al formulario de nueva auditoría
- Visualización de sus propias auditorías en el Kanban
- Recibe notificaciones de avances y cierres de sus auditorías
- **No puede** ver auditorías de otros operadores
- **No puede** acceder al dashboard ni gestión de usuarios

### Supervisor
- Visualiza únicamente las auditorías asignadas a su usuario
- Accede al modal completo de cada auditoría para registrar soluciones
- Puede guardar progreso parcial o marcar auditorías como cerradas
- Sube fotos de evidencia de solución por cada ítem
- Acceso al dashboard de cumplimiento
- Recibe notificaciones de nuevas asignaciones

### Administrador
- Visibilidad total sobre todas las auditorías del sistema
- Acceso completo al Kanban con filtros por área y estado
- Dashboard ejecutivo con semaforización por área
- Gestión de usuarios: crear, visualizar y cambiar roles
- Puede eliminar auditorías
- Puede registrar soluciones como supervisor en cualquier auditoría

### Matriz de acceso

| Función | Operador | Supervisor | Admin |
|---|:---:|:---:|:---:|
| Nueva auditoría | ✅ | ❌ | ✅ |
| Ver mis auditorías | ✅ | ✅ | ✅ |
| Ver todas las auditorías | ❌ | ❌ | ✅ |
| Registrar soluciones | ❌ | ✅ | ✅ |
| Cerrar auditoría | ❌ | ✅ | ✅ |
| Eliminar auditoría | ❌ | ❌ | ✅ |
| Dashboard | ❌ | ✅ | ✅ |
| Gestión de usuarios | ❌ | ❌ | ✅ |

---

## 4. Módulos y funcionalidades

El sistema cuenta con cuatro módulos principales accesibles desde la barra lateral:

| Módulo | Roles con acceso | Descripción |
|---|---|---|
| Tablero Kanban | Todos | Vista de auditorías por estado |
| Nueva Auditoría | Operador, Admin | Formulario de registro |
| Dashboard 5S | Supervisor, Admin | Análisis y semaforización |
| Gestión de Usuarios | Admin | CRUD de usuarios |

---

## 5. Formulario de auditoría 5S

### Encabezado de la auditoría

El operador completa los siguientes campos antes de iniciar los criterios:

| Campo | Tipo | Descripción |
|---|---|---|
| Área a auditar | Select | Lista de 13 áreas predefinidas |
| Fecha límite de solución | Date | Fecha máxima para resolver todos los hallazgos |
| Supervisor asignado | Select | Lista dinámica de supervisores registrados |
| Observaciones generales | Texto | Contexto o comentarios generales |

### Estructura por ítem de criterio

Cada uno de los 20 criterios (5 secciones × 4 ítems) tiene los siguientes campos:

| Campo | Responsable | Descripción |
|---|---|---|
| ¿Cumple? | Operador | Botón Sí / No (exclusivo) |
| SLA | Operador | Selector de tiempo de solución: 24h o 48h |
| Detalle del hallazgo | Operador | Campo de texto libre para describir el hallazgo |
| Evidencia | Operador | Subida de una o más fotos (image/*) con preview en miniatura |
| Detalle de la solución | Supervisor | Campo de texto libre para describir la acción tomada |
| Evidencia de la solución | Supervisor | Subida de fotos de la solución aplicada |

### Lógica de envío

Al hacer clic en **Enviar Auditoría** el sistema:
1. Valida que exista fecha límite y supervisor seleccionado
2. Guarda el documento en Firestore con estado `pending`
3. Sube las fotos de evidencia a Firebase Storage bajo `audits/{id}/auditor/`
4. Genera una notificación automática para el supervisor asignado

---

## 6. Sistema de SLA

### Definición de SLA

El SLA (Service Level Agreement) define el tiempo máximo para resolver cada hallazgo individual. Se configura en dos niveles:

| Tipo | Tiempo | Casos de uso típicos |
|---|---|---|
| SLA 24h | 24 horas | Hallazgos de limpieza, orden, señalización simple |
| SLA 48h | 48 horas | Hallazgos que requieren recursos adicionales (cuadrillas, reetarimado, equipos) |

### Funcionamiento

- El **operador** selecciona el SLA correspondiente en cada ítem del formulario al momento de registrar el hallazgo.
- El countdown se calcula desde la fecha de creación de la auditoría (`createdAt`).
- En el modal del supervisor, cada ítem muestra en tiempo real:
  - `⚡ 24h · 3h 45m restantes` — dentro del plazo
  - `🕐 48h · 22h 10m restantes` — dentro del plazo
  - `Vencido` (en rojo pulsante) — fuera del plazo

### Alertas visuales

| Indicador | Dónde aparece | Condición |
|---|---|---|
| `⚡ SLA vencido` (tarjeta Kanban) | Tarjeta de auditoría | Al menos un hallazgo con SLA vencido |
| Countdown en rojo pulsante | Modal de supervisor/admin | Hallazgo individual vencido |
| KPI "SLA vencidos" | Dashboard | Conteo total de auditorías activas con SLAs vencidos |

### Estado "Atrasada"

Una auditoría pasa automáticamente al estado **Atrasada** cuando la fecha límite general (`deadline`) de la auditoría es superada. Este chequeo se ejecuta cada vez que llegan datos en tiempo real desde Firestore.

---

## 7. Tablero Kanban

### Columnas del tablero

| Columna | Color | Condición |
|---|---|---|
| 🟣 Pendiente | Morado | Auditoría creada, sin acción del supervisor |
| 🟡 En curso | Amarillo | Supervisor ha guardado al menos una solución |
| 🟢 Cerrada | Verde | Supervisor marcó la auditoría como completada |
| 🔴 Atrasada | Rojo | Fecha límite superada y auditoría no cerrada |

### Información visible en cada tarjeta

- ID de auditoría (8 caracteres del ID de Firestore)
- Área auditada
- Nombre del auditor
- Nombre del supervisor (visible para supervisor y admin)
- Alerta `⚡ SLA vencido` si aplica
- Barra de progreso (% de criterios respondidos)
- Porcentaje de avance numérico
- Fecha límite

### Colores de la barra de progreso

| Color | Condición |
|---|---|
| Verde | ≥ 80% de criterios respondidos |
| Amarillo | 50–79% |
| Rojo | < 50% |

### Filtros disponibles

- **Por estado**: Pendiente / En curso / Cerrada / Atrasada
- **Por área**: Las 13 áreas predefinidas
- **Búsqueda libre**: Por área, nombre de auditor, nombre de supervisor o ID

### KPIs del Kanban

Sobre el tablero se muestran 5 tarjetas de métricas:
- Total de auditorías
- Pendientes
- En curso
- Cerradas
- Atrasadas (con alerta si hay alguna)

---

## 8. Dashboard y visualización

Accesible para supervisores y administradores.

### KPIs principales

| Métrica | Descripción |
|---|---|
| Cumplimiento global | Promedio de todas las S · Meta: 93% |
| Tasa de cierre | % de auditorías cerradas sobre el total |
| SLA vencidos | Cantidad de auditorías activas con hallazgos fuera de SLA |
| Áreas evaluadas | Cantidad de áreas con al menos una auditoría |

### Semaforización por área

Tarjetas visuales por cada área con auditorías registradas, mostrando:

| Indicador | Verde | Amarillo | Rojo |
|---|:---:|:---:|:---:|
| Umbral | ≥ 80% | 50–79% | < 50% |
| Banda superior | Verde | Amarillo | Rojo |
| Círculo indicador | Verde | Amarillo | Rojo |

Cada tarjeta incluye: nombre del área, porcentaje, etiqueta de estado, conteo de auditorías y barra de progreso.

### Gráficos

| Gráfico | Tipo | Datos |
|---|---|---|
| Cumplimiento por S | Barras apiladas | Criterios cumplidos vs. no cumplidos por cada S |
| Estado de auditorías | Dona | Distribución por estado (Pendiente / En curso / Cerrada / Atrasada) |

### Detalle por categoría 5S

Barras de progreso individuales para cada S con:
- Nombre de la categoría
- Porcentaje de cumplimiento
- Conteo de criterios: cumple / no cumple / total evaluados

---

## 9. Sistema de notificaciones

Las notificaciones se generan automáticamente en tres eventos:

| Evento | Destinatario | Título |
|---|---|---|
| Nueva auditoría creada | Supervisor asignado | "Nueva auditoría asignada" |
| Supervisor guarda progreso | Auditor | "Avance registrado" |
| Auditoría cerrada | Auditor | "Auditoría cerrada ✅" |

### Funcionamiento

- Las notificaciones se almacenan en Firestore en la colección `notifications`.
- Se muestran en tiempo real gracias a la suscripción de Firestore `onSnapshot`.
- Un badge rojo sobre el ícono de campana muestra el conteo de no leídas.
- Al abrir el panel, todas las notificaciones se marcan como leídas automáticamente.
- Las notificaciones no leídas tienen un borde izquierdo amarillo.

---

## 10. Gestión de usuarios

Exclusivo para administradores.

### Crear usuario

El administrador puede crear usuarios directamente desde la interfaz sin salir de la app:

1. Nombre completo
2. Correo corporativo (`@ferco.com.gt`)
3. Contraseña temporal
4. Rol: Operador / Supervisor / Administrador

El sistema llama al endpoint de Firebase Identity Toolkit para crear el usuario en Authentication y luego registra su perfil en Firestore.

### Cambiar rol

Desde la tabla de usuarios, un selector desplegable permite cambiar el rol de cualquier usuario en tiempo real (actualización inmediata en Firestore).

### Listado de usuarios

Tabla con nombre, correo, rol actual (con etiqueta de color) y acción de cambio de rol.

---

## 11. Áreas auditadas

El sistema incluye las 13 áreas de Operaciones de El Salvador:

| # | Área |
|---|---|
| 1 | Rack 1 |
| 2 | Rack 2 |
| 3 | Rack 3 |
| 4 | Rack 4 |
| 5 | Rack 5 |
| 6 | Rack 6 |
| 7 | Grifería |
| 8 | Pasillo 2 |
| 9 | Pasillo 3 |
| 10 | Pasillo 4 |
| 11 | Pasillo 5 |
| 12 | Pasillo 6 |
| 13 | Pasillo 7 |

---

## 12. Criterios 5S

### 1ª S — Separar y eliminar innecesarios

1. Un solo SKU en cada posición de rack
2. Evitar reubicar en ubicaciones rack tarimas dañadas
3. Colocar el producto en rack a granel y no uno encima de otro
4. Sacar producto dañado de posiciones de rack

### 2ª S — Situar e identificar necesarios

1. Identificación clara de ubicaciones de rack
2. Señalización de pasillos y zonas de trabajo
3. Etiquetado correcto de productos y áreas
4. Demarcación de zonas de tránsito

### 3ª S — Suprimir la suciedad

1. Pisos limpios y sin residuos de cerámica
2. Estanterías y racks libres de polvo y suciedad
3. Contenedores de basura disponibles y en uso
4. Área de trabajo limpia al finalizar turno

### 4ª S — Señalizar

1. Colocar la licencia de ingreso en tarimas completas
2. Dejar el producto en las áreas establecidas
3. Señalética de seguridad visible y en buen estado
4. Indicadores de capacidad de rack visibles

### 5ª S — Sostener y respetar

1. Estibar tarimas completas respetando los tamaños
2. No parciales en las ubicaciones de granel
3. Uso de equipos de seguridad industrial
4. Cumplimiento de procedimientos establecidos

**Total: 20 criterios · 5 categorías · 4 ítems por categoría**

---

## 13. Infraestructura y despliegue

### Proyecto Firebase

| Parámetro | Valor |
|---|---|
| Project ID | `dashboard-5s-e9781` |
| Auth Domain | `dashboard-5s-e9781.firebaseapp.com` |
| Storage Bucket | `dashboard-5s-e9781.firebasestorage.app` |

### Servicios Firebase habilitados

- **Authentication**: Email/Password
- **Firestore**: Base de datos en tiempo real
- **Storage**: Almacenamiento de evidencias fotográficas

### Hosting en Netlify

| Parámetro | Valor |
|---|---|
| URL | `https://dashboard5s.netlify.app` |
| Plan | PRO |
| Deploy automático | Sí — conectado a GitHub |
| Branch | `main` |

### Flujo de CI/CD

```
Editar HTML localmente
       ↓
git add . && git commit -m "actualización"
       ↓
git push origin main
       ↓
Netlify detecta el push automáticamente
       ↓
Build en ~4 segundos
       ↓
Deploy en producción
```

### Almacenamiento de evidencias en Storage

```
audits/
  {auditId}/
    auditor/
      s0_i0_1716000000000_foto.jpg
      s2_i3_1716000000001_foto.jpg
    supervisor/
      s0_i0_1716000001000_solucion.jpg
```

---

## 14. Seguridad

### Restricciones de API Key

La API Key de Firebase Browser está restringida en Google Cloud Console a:
- `https://dashboard5s.netlify.app/*`
- `http://localhost/*`

### Reglas de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null;
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

### Filtrado por rol en cliente

El sistema aplica filtros de consulta en Firestore según el rol:

| Rol | Filtro aplicado |
|---|---|
| Operador | `where('auditorId', '==', currentUser.uid)` |
| Supervisor | `where('supervisorId', '==', currentUser.uid)` |
| Admin | Sin filtro — ve todas |

---

## 15. Flujo completo de una auditoría

```
OPERADOR
  1. Inicia sesión con correo @ferco.com.gt
  2. Selecciona "Nueva Auditoría"
  3. Elige el área, fecha límite y supervisor
  4. Por cada criterio:
     - Marca Sí / No
     - Selecciona SLA (24h o 48h)
     - Escribe el detalle del hallazgo
     - Sube fotos de evidencia (opcional)
  5. Envía la auditoría
  
       ↓ [Firestore: status = "pending"]
       ↓ [Notificación automática al supervisor]

SUPERVISOR
  6. Recibe notificación en la app
  7. Ve la auditoría en su Kanban (columna Pendiente)
  8. Abre el modal de la auditoría
  9. Por cada hallazgo:
     - Revisa el detalle y las fotos del auditor
     - Ve el countdown de SLA restante
     - Escribe el detalle de la solución aplicada
     - Sube fotos de evidencia de la solución
 10. Guarda progreso (status → "inprog")
     o marca como cerrada (status → "closed")
     
       ↓ [Notificación al operador]

ADMINISTRADOR
 11. Monitorea el Kanban completo en tiempo real
 12. Revisa el Dashboard con semaforización por área
 13. Controla SLAs vencidos y auditorías atrasadas
 14. Gestiona usuarios desde el panel de administración
```

---

## 16. Usuarios del sistema

### Roles definidos

| Nombre | Correo | Rol |
|---|---|---|
| Diego Bautista | diego.bautista@ferco.com.gt | Administrador |
| Roberto Rodriguez | roberto.rodriguez@ferco.com.gt | Administrador |
| Mario Calderón | mario.calderon@ferco.com.gt | Supervisor |
| Amilcar Bautista | — | Operador (Rack 1) |
| Cesar Zometa | — | Operador (Rack 2) |
| Kevin Ponce | — | Operador (Rack 3) |
| Lester Garcia | — | Operador (Rack 4) |
| Juan Jose Gavidia | — | Operador (Rack 5) |
| Sabino Henriquez | — | Operador (Rack 6) |
| Jose Peres | — | Operador (Grifería) |
| Jorge Martinez | jorge.martinez@ferco.com.gt | Operador (Pasillo 3) |
| Bryan Ramirez | — | Operador (Pasillo 5) |
| Carlos Moz | — | Operador (Pasillo 6) |
| Victor Arana | — | Operador (Pasillo 7) |

> Los usuarios deben ser creados manualmente desde la sección **Gestión de Usuarios** por un administrador.

---

## 17. Glosario

| Término | Definición |
|---|---|
| 5S | Metodología japonesa de organización del lugar de trabajo: Seiri, Seiton, Seiso, Seiketsu, Shitsuke |
| SLA | Service Level Agreement — tiempo máximo acordado para resolver un hallazgo |
| Hallazgo | Incumplimiento detectado en un criterio 5S durante la auditoría |
| Evidencia | Fotografía que documenta un hallazgo o su solución |
| Kanban | Tablero visual de gestión de tareas dividido en columnas por estado |
| Firestore | Base de datos documental en la nube de Google (Firebase) |
| Operador | Usuario que realiza la auditoría y registra hallazgos |
| Supervisor | Usuario que recibe la auditoría asignada y registra soluciones |
| Admin | Usuario con acceso total al sistema, incluyendo gestión de usuarios |
| SPA | Single Page Application — aplicación web de una sola página |
| Deploy | Proceso de publicar la aplicación en el servidor (Netlify) |
| Countdown | Cuenta regresiva en tiempo real del SLA de un hallazgo |
| Semaforización | Sistema de colores (verde/amarillo/rojo) para indicar nivel de cumplimiento |

---

*Documentación generada el 19 de mayo de 2026 · FERCO Cerámica — Operaciones El Salvador*
