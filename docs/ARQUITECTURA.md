# Arquitectura — Plataforma de Lectoescritura Gamificada (EdTech RPG)

**Stack obligatorio:** Laravel 12 (backend) · React 19 (frontend) · Inertia.js v2 (comunicación monolito) · Tailwind CSS v4 (estilos) · Laravel Reverb (WebSockets para duelos).

---

## 1. Vista general de capas

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVEGADOR (niño / profesor)                                    │
│  React 19 + Inertia + Tailwind + Framer Motion + Web Speech API │
└──────────────┬──────────────────────────────────────────────────┘
               │  AJAX puro (Inertia: X-Inertia headers, JSON)
┌──────────────▼──────────────────────────────────────────────────┐
│  LARAVEL (monolito)                                             │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ Controllers│→ │ FormRequest │→ │ Services de dominio      │  │
│  │ (Inertia)  │  │ (validación) │  │ Gamification, Analytics, │  │
│  └────────────┘  └──────────────┘  │ Streak, Diploma, Duel    │  │
│                                     └───────────┬─────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────▼─────────────┐  │
│  │ Policies     │  │ Jobs (cola)  │  │ Eloquent Models        │  │
│  │ (autorización)│ │ PDF, alertas │  │ + SQLite/MySQL         │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Laravel Reverb (WebSocket) — canales privados de duelo     │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Principio:** Inertia elimina la capa API REST. Los controladores devuelven `Inertia::render('pagina', ['prop' => ...])` y las mutaciones se hacen con `router.post/put/delete` de `@inertiajs/react`. No hay JWT, no hay CORS, no hay doble modelo de tipos.

---

## 2. Estructura de carpetas propuesta

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Student/                  # módulo 1 y 2 (el niño)
│   │   │   ├── DashboardController.php
│   │   │   ├── AvatarController.php
│   │   │   ├── StoreController.php        # tienda de accesorios
│   │   │   ├── GameSessionController.php  # inicia/resuelve actividades
│   │   │   └── StreakController.php
│   │   ├── Teacher/                  # módulo 3 y 4 (el profesor)
│   │   │   ├── DashboardController.php    # analítica
│   │   │   ├── GroupController.php
│   │   │   ├── StudentController.php
│   │   │   ├── ContentController.php      # CMS: vocabulario/lecturas
│   │   │   ├── ActivityController.php     # dificultad de minijuegos
│   │   │   ├── MediaController.php        # subida imágenes/audios
│   │   │   └── ReportController.php       # errores comunes, alertas
│   │   └── DuelController.php        # módulo 5
│   ├── Middleware/EnsureStudentSession.php  # sesión tipo niño (sin email)
│   └── Requests/                     # FormRequest por recurso
├── Models/
│   ├── Teacher.php, Group.php, Student.php
│   ├── AvatarItem.php, StudentAvatar.php
│   ├── Minigame.php, Level.php, Activity.php
│   ├── VocabularyWord.php, Reading.php, ReadingQuestion.php
│   ├── Attempt.php, ErrorLog.php, StudentProgress.php
│   ├── Achievement.php, Streak.php, Diploma.php, Duel.php
│   └── MediaAsset.php
├── Services/
│   ├── GamificationService.php   # otorga XP/monedas, sube de nivel, desbloquea
│   ├── ProgressService.php       # avance en el mapa, desbloqueo de niveles
│   ├── StreakService.php         # racha diaria + calendario
│   ├── AnalyticsService.php      # top, alertas, errores comunes
│   ├── DuelService.php           # lógica de pizarra compartida
│   └── DiplomaService.php        # genera PDF (job en cola)
├── Events/  Broadcast/            # eventos Reverb: DuelStarted, DuelMove, DuelFinished
├── Jobs/    GenerateDiplomaPdf.php, ComputeDailyAlerts.php
└── Policies/ StudentPolicy.php, ContentPolicy.php

resources/js/
├── pages/
│   ├── student/
│   │   ├── Dashboard.jsx          # mapa del mundo + avatar + racha
│   │   ├── AvatarEditor.jsx       # personalización drag-and-drop
│   │   ├── Shop.jsx               # tienda de accesorios
│   │   ├── StreakCalendar.jsx
│   │   └── games/
│   │       ├── WordSearch.jsx     # sopa de letras / sombras
│   │       ├── LetterBuilder.jsx  # arrastrar letras → palabras → oraciones
│   │       ├── FillBlank.jsx      # completar espacios
│   │       ├── MatchVisual.jsx    # unir imagen ↔ palabra (SVG lines)
│   │       ├── ReadingTrivia.jsx  # lectura + escuchar + trivia
│   │       └── DuelBoard.jsx      # pizarra en tiempo real
│   ├── teacher/
│   │   ├── Dashboard.jsx          # analítica + alertas + gráficos
│   │   ├── Groups.jsx, Students.jsx
│   │   ├── Content/ (Vocabulary, Readings, Questions)
│   │   ├── ActivityConfig.jsx     # dificultad por minijuego
│   │   └── ErrorReport.jsx
│   └── auth/
├── components/
│   ├── ui/            (botones grandes, tarjetas, modales — rondos y vivos)
│   ├── gamification/  (XpBar, CoinCounter, LevelBadge, StreakFlame)
│   ├── avatar/        (AvatarRenderer, ItemSlot)
│   ├── dnd/           (DraggableTile, DropZone — pointer events táctiles)
│   └── audio/         (PhonemeButton, useSpeech hook)
├── layouts/  (StudentLayout con HUD, TeacherLayout tipo CMS)
├── hooks/    (useSpeech, useDrag, useDuel, useStreak)
└── lib/      (api.js con router de Inertia, utils de XP)
```

---

## 3. Modelos y relaciones (resumen del esquema)

```
users (role: admin|teacher)
  └─1:1─ teachers
           └─1:N─ groups (shift: matutino|vespertino, join_code)
                    └─1:N─ students (xp, coins, level, login_code+pin)
                             ├─1:1─ student_avatars ─N:1─ avatar_items (via student_avatar_items)
                             ├─1:1─ streaks
                             ├─1:N─ attempts ─1:N─ error_logs
                             ├─1:N─ student_progress ─N:1─ levels
                             ├─N:M─ achievements (student_achievements)
                             ├─1:N─ diplomas
                             └─N:M─ duels (challenger/opponent/winner)

teachers ─1:N─ media_assets ─referenciado por─ vocabulary_words / readings
teachers ─1:N─ vocabulary_words, readings ─1:N─ reading_questions

minigames ─1:N─ activities ─N:1─ levels (module: abecedario|silabas|palabras|oraciones|comprension)
activities (content_type/content_id → vocabulary | reading)
```

**Notas clave:**
- **Estudiantes fuera de `users`**: login por `join_code` + PIN de 4 dígitos vía middleware `EnsureStudentSession` — un niño de 6 años no tiene email. El profesor sí usa `users` con el starter de auth incluido.
- **`error_logs.target_value`** es la columna que alimenta el *Reporte de Errores Comunes* (`GROUP BY target_type, target_value`).
- **`attempts.details`** (JSON) guarda el detalle crudo para auditoría; las métricas consultables van en columnas normalizadas.
- **`activities.content_type/content_id`** permite que una actividad apunte a una lectura o a vocabulario sin tablas polimórficas completas.

---

## 4. Flujo principal (ciclo de vida del niño)

```
1. Login        → código de clase + PIN  →  StudentLayout con HUD (XP, monedas, fuego 🔥)
2. Mapa         → niveles bloqueados/disponibles (student_progress)
3. Actividad    → minijuego renderiza según slug:
                  sopa-letras → WordSearch   construccion → LetterBuilder
                  completar   → FillBlank     match-visual → MatchVisual
                  comprension → ReadingTrivia (botón "Escuchar lectura": audio subido
                               o Web Speech API como fallback)
4. Respuesta    → POST /activities/{id}/attempts
                  ├─ GamificationService: XP + monedas + posible subida de nivel
                  ├─ ErrorLog: registra letra/sílaba fallida
                  ├─ StreakService: marca el día, actualiza calendario
                  └─ ProgressService: desbloquea siguiente nivel
5. Recompensa   → animación Framer Motion (confeti, badge) → posible Achievement
6. Milestone    → Achievement.generates_diploma → job GenerateDiplomaPdf (cola)
```

### Endpoints Inertia (rutas)

```
WEB (session)                        MÉTODO
/                       (welcome)
/login                  (profesor)
/student                GET    Dashboard del niño
/student/avatar         GET/PUT Editor de avatar
/student/shop           GET/POST Tienda
/student/games/{act}    GET    Render del minijuego
/attempts               POST   Enviar resultado (→ gamificación)
/teacher/dashboard      GET    Analítica
/teacher/groups*        CRUD   Grupos y turnos
/teacher/students*      CRUD   Estudiantes
/teacher/content*       CRUD   Vocabulario, lecturas, preguntas, media
/teacher/activities*    PUT    Dificultad/config por actividad
/teacher/reports/errors GET    Errores comunes
/duels                  POST   Crear/aceptar duelo (canal Reverb: duels.{uuid})
```

---

## 5. Analítica (Módulo 4) — algoritmos

**Top estudiantes** — orden por XP con datos denormalizados:
```sql
SELECT s.name, s.xp, s.level, s.current_streak, g.name AS grupo
FROM students s JOIN groups g ON g.id = s.group_id
WHERE g.teacher_id = ? AND s.is_active = 1
ORDER BY s.xp DESC LIMIT 10;
```

**Alertas de refuerzo (prioridad alta → media):** reglas combinadas sobre ventana de 14 días:

```sql
-- 1) Baja tasa de acierto (< 50%) con ≥3 intentos
SELECT student_id,
       SUM(correct_count)*100.0 / NULLIF(SUM(correct_count+wrong_count),0) AS acierto,
       COUNT(*) AS intentos
FROM attempts WHERE created_at >= NOW() - INTERVAL 14 DAY
GROUP BY student_id
HAVING acierto < 50 AND intentos >= 3;          -- prioridad ALTA

-- 2) Estancamiento: mismo activity_id con ≥5 intentos y best_score < 70
-- 3) Inactividad: última partida hace ≥5 días (streak roto)
```
Implementado en `AnalyticsService::alerts()` y ejecutado por el job programado `ComputeDailyAlerts` (resultado cacheable por día; la vista puede calcularlo on-the-fly con índices de `attempts`).

**Errores comunes del grupo:**
```sql
SELECT target_type, target_value, COUNT(*) AS fallos
FROM error_logs el JOIN students s ON s.id = el.student_id
JOIN groups g ON g.id = s.group_id
WHERE g.teacher_id = ? AND el.created_at >= NOW() - INTERVAL 30 DAY
GROUP BY target_type, target_value
ORDER BY fallos DESC LIMIT 20;
```
Se renderiza como barras horizontales (Tailwind) o donut; filtrable por grupo/turno.

---

## 6. Gamificación — reglas centrales

- **XP:** actividad completada con ≥70% → XP del nivel; bonus por velocidad y racha.
- **Nivel del jugador:** `level = floor(sqrt(xp / 100)) + 1` (curva suave para primaria) — calculado en `GamificationService`.
- **Monedas:** se ganan al completar; se gastan en `avatar_items` (validación server-side: nivel requerido + saldo suficiente; la compra inserta en `student_avatar_items`).
- **Duelo (Reverb):** `POST /duels` crea registro con `uuid`, ambos se suscriben a canal privado `duels.{uuid}`; cada jugada emite `DuelMove` (score), servidor valida con `DuelService` y emite `DuelFinished` → XP extra al ganador.
- **Racha:** `StreakService::markDay()` compara `last_completed_date` con hoy (ayer → +1, hoy → no-op, otro → reset a 1).
- **Diploma:** job en cola genera PDF (dompdf/snappy) con avatar renderizado + nombre → se guarda en `diplomas.pdf_path` y queda listo para imprimir desde el panel del profesor.

---

## 7. UI/UX (Módulo 1)

- **Tailwind v4** con tokens de tema en `resources/css/app.css`: paleta viva (morado/ámbar/turquesa), radios `3xl/4xl`, sombras suaves, `text-2xl` mínimo para niños.
- **Framer Motion** para: transiciones de página del mapa, confeti al completar, entrada de fichas arrastrables, animación de monedas volando al contador.
- **Componentes grandes:** targets táctiles ≥48px, botones con `active:scale-95`, feedback háptico visual inmediato (shake en error, bounce en acierto).
- **Drag & Drop:** pointer events unificados (mouse + táctil) en `components/dnd/` — sin dependencias pesadas; fallback `draggable` HTML5 solo escritorio.
- **Audio fonético:** `PhonemeButton` reproduce `/audio/phonemes/{letra}.mp3` (archivos estáticos en `public/audio/phonemes/`); hook `useSpeech` usa `speechSynthesis` (es-MX/es-ES) para lectura de textos y como fallback de audio no subido.
- **Accesibilidad:** contraste AA, `prefers-reduced-motion` respetado, navegación por teclado en el mapa.

---

## 8. Despliegue y operación

| Pieza | Recomendación |
|---|---|
| Base de datos | MySQL 8 en producción (SQLite ya funciona en dev) |
| Colas | `database` o Redis (`QUEUE_CONNECTION`) para PDF y alertas |
| WebSockets | Laravel Reverb (servidor propio, sin servicios externos) |
| Almacenamiento | `public` disk para imágenes/audios/PDFs |
| Cache | Redis para tableros del profesor (TTL 5 min) |
| Programados | `ComputeDailyAlerts` diario; `commands:streaks` cierre de día |

**Paquetes a agregar:** `laravel/reverb` (WebSockets), `barryvdh/laravel-dompdf` (diplomas), `spatie/laravel-medialibrary` *opcional* si se quiere gestión avanzada de media (hoy se usa `media_assets` propio).

---

## 9. Autenticación y accesos

Dos portales independientes sobre las mismas rutas `web`:

| Portal | Ruta | Credenciales | Protección |
|---|---|---|---|
| Profesor | `/profesor/dashboard`, `/profesor/niveles` | email + contraseña (starter `auth`) | middleware `auth` + `teacher` (`EnsureTeacher`: `role === 'teacher'` y `is_active`, si no → **403**) |
| Estudiante | `/juegos`, `POST /intentos` | código de clase + PIN de 4 dígitos | middleware `student` (`EnsureStudentSession`: `session('student_id')`, si no → redirect a `/juegos/entrar`) |

- **Login infantil:** `StudentLoginController` (`GET|POST /juegos/entrar`, `POST /juegos/salir`) valida `login_code` (case-insensitive) contra `students.pin_hash` con `Hash::check`; al fallar devuelve *"Código o PIN incorrecto"*. Rate limit `throttle:10,1`.
- **Sesión:** el middleware resuelve el `Student` y lo deja en `$request->attributes['student']`; `GamesController` y `AttemptController` lo leen de ahí (antes se usaba el "primer estudiante" como demo).
- **Tras iniciar sesión**, el profesor cae en `/profesor/dashboard` (redirect con rol en `AuthenticatedSessionController`).
- **Acceso demo:**
  - Profesor: `profe@abcleto.test` / `password`
  - Estudiante: código `SOFI01`…`SAMU08` / PIN `1234` (los 8 creados por `AnalyticsDemoSeeder`)
- **Sin cerrar sesión** el estudiante no ve `/juegos`, y un usuario sin rol `teacher` recibe 403 en `/profesor/*` (verificado en navegador).

### 9.1 Medidas de seguridad del acceso

| Riesgo | Control |
|---|---|
| Fuerza bruta sobre el PIN infantil | `RateLimiter` propio por **código + IP** (5 fallos / 60 s → "Demasiados intentos…") + `throttle:60,1` por IP en `POST /juegos/entrar` |
| Fuerza bruta sobre la contraseña del profesor | `LoginRequest` del starter: 5 intentos por **email + IP** → *Too many login attempts* |
| Enumeración de usuarios | Mensaje único *"Código o PIN incorrecto"* exista o no el alumno; *These credentials do not match* en el profesor |
| Oraculo de tiempo | `Hash::check` se ejecuta siempre, contra el PIN real o un hash falso |
| Fijación de sesión | `session()->regenerate()` tras cada login (profesor y estudiante) |
| Validación | PIN `regex /^[0-9]{4}$/`, código alfanumérico, `unique` en `login_code` |
| CSRF | Middleware `web` + token XSRF en todos los POST de Inertia |
| Partidas falsas del profesor | `preview_mode` en sesión → `POST /intentos` responde 403 |

### 9.2 Progresión y nivel (cómo sube de nivel)

- `GamificationService` recalcula `students.level = floor(sqrt(xp / 100)) + 1` en cada intento y lo devuelve al HUD.
- El hub recibe por actividad `unlocked` + `best_score` desde `student_progress`, así los desbloqueos **sobreviven a la recargar** (antes vivían en `useState` y se perdían).
- El desbloqueo es en cadena: aprobado (≥70) el nivel *n*, se abre el *n*+1; los niveles extra del profesor (11, 12…) se ordenan por número de nivel y quedan al final de la lista.
