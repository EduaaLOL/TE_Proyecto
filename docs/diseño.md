# Guía Maestra del Sistema de Diseño (Design System)
**Plataforma Educativa Institucional · Campus Digital**

Este documento constituye la referencia canónica de diseño, arquitectura visual y patrones de experiencia de usuario (UI/UX) para la plataforma educativa. Todas las pantallas, componentes y vistas que se desarrollen en el futuro deben adherirse estrictamente a las especificaciones aquí descritas para garantizar consistencia visual, accesibilidad y una experiencia premium.

---

## 1. Filosofía y Principios de Diseño

1. **Minimalismo Utilitario y Editorial**: La interfaz prioriza la claridad cognitiva, el orden académico y la legibilidad. Se descartan elementos decorativos innecesarios, gradientes de IA saturados o modas efímeras.
2. **Confianza y Sobriedad Institucional**: La paleta y tipografía evocan rigor académico, seguridad y modernidad accesible.
3. **Jerarquía Visual y Espaciado Generoso**: El espacio en blanco (macro-whitespace) se utiliza como una herramienta activa de diseño para evitar la sobrecarga mental de estudiantes y docentes.
4. **Accesibilidad Universal (WCAG 2.1 AA / AAA)**: Todo texto garantiza un contraste mínimo de 4.5:1 (3:1 en texto grande), navegación por teclado completa, estados de foco visibles y compatibilidad con lectores de pantalla.
5. **Micro-interacciones Fluidas y Deliberadas**: El movimiento tiene propósito informativo (confirmar acciones, dar retroalimentación de carga o guiar la atención), respetando siempre las preferencias de reducción de movimiento (`prefers-reduced-motion`).

---

## 2. Paleta de Colores y Tokens

La paleta se construye sobre tonos neutros tintados con matices de pizarra fría (*Midnight Slate*) combinados con un acento vegetal académico (*Botanical Pine / Academic Teal*).

### 2.1 Variables CSS Globales (`:root`)

```css
:root {
  /* --- Colores Primarios de Marca (Brand) --- */
  --brand-navy-950: #0B132B;   /* Base profunda de contraste y encabezados */
  --brand-navy-900: #0F172A;   /* Tinta primaria (Body principal) */
  --brand-navy-800: #1E293B;   /* Superficies oscuras secundarias */
  --brand-navy-700: #334155;   /* Texto secundario y etiquetas */
  --brand-navy-500: #64748B;   /* Texto terciario, placeholders e iconos */
  --brand-navy-200: #E2E8F0;   /* Bordes estructurales estándar */
  --brand-navy-100: #F1F5F9;   /* Fondos de inputs y componentes secundarios */
  --brand-navy-50:  #F8FAFC;   /* Fondo general de la aplicación (Canvas) */

  /* --- Acento Académico (Accent: Botanical Teal) --- */
  --accent-teal-700: #0B4A45;  /* Estado hover / active del acento */
  --accent-teal-600: #0D5C56;  /* Acento primario institucional */
  --accent-teal-500: #14B8A6;  /* Acento brillante para detalles e indicadores */
  --accent-teal-100: #CCFBF1;  /* Fondo de badges y tags de acento */
  --accent-teal-50:  #F0FDFA;  /* Tinte sutil para selecciones y hover */

  /* --- Superficies y Fondos --- */
  --surface-white:   #FFFFFF;  /* Tarjetas, modales y contenedores principales */
  --surface-raised:  #FFFFFF;  /* Elementos elevados */
  --surface-subtle:  #F8FAFC;  /* Áreas de descanso visual */
  --surface-muted:   #F1F5F9;  /* Fondos de inputs deshabilitados */

  /* --- Bordes y Separadores --- */
  --border-subtle:   #E2E8F0;  /* Bordes de tarjetas e inputs por defecto */
  --border-medium:   #CBD5E1;  /* Bordes en estado hover */
  --border-strong:   #94A3B8;  /* Bordes activos */

  /* --- Estados Semánticos de Retroalimentación --- */
  /* Error / Alerta crítica */
  --color-error-text:   #B91C1C;
  --color-error-base:   #DC2626;
  --color-error-border: #FCA5A5;
  --color-error-bg:     #FEF2F2;

  /* Éxito / Confirmación */
  --color-success-text:   #047857;
  --color-success-base:   #059669;
  --color-success-border: #6EE7B7;
  --color-success-bg:     #ECFDF5;

  /* Advertencia / Precaución */
  --color-warning-text:   #B45309;
  --color-warning-base:   #D97706;
  --color-warning-border: #FDE68A;
  --color-warning-bg:     #FFFBEB;

  /* Información */
  --color-info-text:   #1D4ED8;
  --color-info-base:   #2563EB;
  --color-info-border: #BFDBFE;
  --color-info-bg:     #EFF6FF;

  /* --- Sombras Elevación Refinadas --- */
  --shadow-xs: 0 1px 2px 0 rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 2px 4px -1px rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 6px 16px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 12px 28px -6px rgba(15, 23, 42, 0.10), 0 4px 12px -3px rgba(15, 23, 42, 0.05);
  --shadow-modal: 0 20px 40px -10px rgba(15, 23, 42, 0.20), 0 8px 16px -4px rgba(15, 23, 42, 0.10);
}
```

### 2.2 Tabla de Roles y Casos de Uso

| Color Token | Valor HEX | Uso Primario | Contraste sobre Blanco |
|---|---|---|---|
| `--brand-navy-950` | `#0B132B` | Encabezados (H1, H2), botones primarios | 16.8:1 (AAA) |
| `--brand-navy-900` | `#0F172A` | Texto de párrafo, títulos de tarjetas | 15.2:1 (AAA) |
| `--brand-navy-700` | `#334155` | Etiquetas de formulario, textos secundarios | 9.4:1 (AAA) |
| `--brand-navy-500` | `#64748B` | Textos de ayuda, placeholders, iconos neutros | 4.8:1 (AA) |
| `--accent-teal-600` | `#0D5C56` | Acentos, enlaces interactivos, estados activos | 6.5:1 (AAA) |
| `--color-error-base`| `#DC2626` | Mensajes de error, estados inválidos | 4.6:1 (AA) |
| `--color-success-base`| `#059669`| Validaciones exitosas, estados completados | 4.7:1 (AA) |

---

## 3. Sistema Tipográfico

La tipografía base es **Plus Jakarta Sans**, una fuente moderna geométrica con excelente legibilidad en pantallas de alta densidad y proporciones equilibradas.

### 3.1 Escala Modular Tipográfica

```css
:root {
  --font-family-base: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: 'Geist Mono', 'SF Mono', 'JetBrains Mono', monospace;

  /* Tamaños de Fuente */
  --text-2xs: 0.6875rem; /* 11px - Metadatos muy pequeños, badges */
  --text-xs:  0.75rem;   /* 12px - Mensajes de ayuda, estados de validación */
  --text-sm:  0.875rem;  /* 14px - Etiquetas de input, botones secundarios */
  --text-base: 1rem;     /* 16px - Texto base, inputs, párrafos */
  --text-lg:  1.125rem;  /* 18px - Subtítulos, títulos de tarjetas */
  --text-xl:  1.25rem;   /* 20px - Títulos de sección */
  --text-2xl: 1.5rem;    /* 24px - Títulos principales de páginas */
  --text-3xl: 1.875rem;  /* 30px - Encabezados hero (Desktop) */
  --text-4xl: 2.25rem;   /* 36px - Display títulos hero institucionales */

  /* Pesos Tipográficos */
  --font-regular:  400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* Alturas de Línea */
  --leading-tight:  1.2;
  --leading-snug:   1.35;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;

  /* Espaciado de Caracteres (Tracking) */
  --tracking-tight: -0.025em; /* Para encabezados H1-H3 */
  --tracking-normal: 0em;
  --tracking-wide:  0.03em;   /* Para texto en mayúsculas pequeñas o badges */
}
```

### 3.2 Jerarquía de Texto

1. **Encabezados Principales (`H1`)**:
   - `font-size: var(--text-3xl)` (1.875rem a 2.25rem con clamp).
   - `font-weight: var(--font-bold)`.
   - `letter-spacing: var(--tracking-tight)`.
   - `color: var(--brand-navy-950)`.
   - `line-height: var(--leading-tight)`.
   - `text-wrap: balance`.

2. **Subtítulos y Descripciones**:
   - `font-size: var(--text-sm)` a `var(--text-base)`.
   - `font-weight: var(--font-normal)`.
   - `color: var(--brand-navy-500)`.
   - `line-height: var(--leading-relaxed)`.
   - Ancho máximo sugerido: `65ch`.

3. **Etiquetas de Formulario (`<label>`)**:
   - `font-size: var(--text-sm)`.
   - `font-weight: var(--font-semibold)`.
   - `color: var(--brand-navy-900)`.
   - `display: block; margin-bottom: 0.375rem`.

---

## 4. Sistema de Espaciado y Layout

El sistema se basa en una cuadrícula modular con incrementos de **4px / 8px**.

### 4.1 Escala de Espacios

```css
:root {
  --space-1:  0.25rem;  /* 4px */
  --space-2:  0.5rem;   /* 8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

### 4.2 Radios de Borde (Border Radius)

Se usan radios controlados y nítidos. Se evitan elementos excesivamente redondeados salvo en badges tipo píldora.

```css
:root {
  --radius-xs: 4px;   /* Checkboxes, pequeños tags */
  --radius-sm: 6px;   /* Botones compactos, badges */
  --radius-md: 8px;   /* Inputs, botones estándar */
  --radius-lg: 12px;  /* Tarjetas estándar, contenedores bento */
  --radius-xl: 16px;  /* Modales, tarjetas hero */
  --radius-full: 9999px; /* Badges de estado circular/píldora */
}
```

### 4.3 Puntos de Interrupción Responsivos (Breakpoints)

- **Mobile (Base)**: `< 640px` (Columna única, paddings de 16px a 20px).
- **Tablet**: `640px - 1023px` (Paddings de 24px a 32px, grids de 2 columnas).
- **Desktop**: `≥ 1024px` (Layouts divididos, tarjetas con max-width controlado).
- **Large Desktop**: `≥ 1280px` (Contenedor máximo `1200px` centrado con márgenes automáticos).

---

## 5. Especificaciones Anatómicas de Componentes

### 5.1 Campos de Entrada de Texto (`Inputs`)

Los inputs son el elemento central de captura de información. Deben ofrecer retroalimentación inmediata, accesible y nítida.

#### Estructura HTML Estándar:
```html
<div class="form-group">
  <div class="label-wrapper">
    <label for="campo-id" class="form-label">Correo Electrónico</label>
    <span class="label-hint" id="campo-id-hint">Institucional o personal</span>
  </div>
  <div class="input-wrapper">
    <span class="input-icon-prefix" aria-hidden="true">
      <!-- Icono SVG -->
    </span>
    <input 
      type="email" 
      id="campo-id" 
      name="email" 
      class="form-input" 
      placeholder="nombre@dominio.edu"
      aria-describedby="campo-id-hint campo-id-error"
      autocomplete="email"
      required
    />
    <button type="button" class="input-action-btn" aria-label="Limpiar campo">
      <!-- Icono SVG de acción opcional -->
    </button>
  </div>
  <p class="form-feedback-msg error" id="campo-id-error" role="alert" aria-live="polite">
    <!-- Mensaje de error dinámico -->
  </p>
</div>
```

#### Estados del Input:
1. **Default (Reposo)**:
   - `background-color: var(--surface-white)`
   - `border: 1px solid var(--border-subtle)` (`#E2E8F0`)
   - `color: var(--brand-navy-900)`
   - `height: 46px` (touch target óptimo)
   - `padding: 0 14px 0 42px` (si tiene icono prefijo)
   - `border-radius: var(--radius-md)` (`8px`)
2. **Hover**:
   - `border-color: var(--border-medium)` (`#CBD5E1`)
3. **Focus (Activo)**:
   - `outline: none`
   - `border-color: var(--accent-teal-600)` (`#0D5C56`)
   - `box-shadow: 0 0 0 3px rgba(13, 92, 86, 0.15)` (Anillo accesible)
4. **Error (Inválido)**:
   - `border-color: var(--color-error-base)` (`#DC2626`)
   - `box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12)`
   - Mostrar icono de alerta y texto en `var(--color-error-text)` abajo.
5. **Success (Válido)**:
   - `border-color: var(--color-success-base)` (`#059669`)
6. **Disabled (Deshabilitado)**:
   - `background-color: var(--surface-muted)`
   - `border-color: var(--border-subtle)`
   - `color: var(--brand-navy-500)`
   - `cursor: not-allowed`

---

### 5.2 Botones (`Buttons`)

Los botones deben comunicar claramente su nivel de jerarquía y acción sin usar etiquetas ambiguas.

#### Jerarquía de Botones:

1. **Botón Primario (`.btn-primary`)**:
   - Uso: Acción principal de la vista (ej. "Iniciar Sesión", "Registrar Estudiante").
   - Estilo: `background-color: var(--brand-navy-950)`, `color: #FFFFFF`.
   - Hover: `background-color: var(--brand-navy-800)`.
   - Active: `transform: scale(0.985)`.
   - Altura mínima: `46px`.
   - Border radius: `var(--radius-md)` (`8px`).
   - Sombra: `var(--shadow-sm)`.

2. **Botón Secundario (`.btn-secondary` / Outline)**:
   - Uso: Acciones complementarias o de retorno.
   - Estilo: `background: transparent`, `border: 1px solid var(--border-medium)`, `color: var(--brand-navy-900)`.
   - Hover: `background-color: var(--brand-navy-50)`, `border-color: var(--brand-navy-700)`.

3. **Botón Fantasma / Texto (`.btn-ghost`)**:
   - Uso: Enlaces de bajo impacto o acciones inline como "¿Olvidaste tu contraseña?".
   - Estilo: `background: transparent`, `color: var(--accent-teal-600)`, `font-weight: 500`.
   - Hover: `color: var(--accent-teal-700)`, `text-decoration: underline`.

4. **Estado de Carga (`.btn-loading`)**:
   - Deshabilita clics (`pointer-events: none; opacity: 0.85`).
   - Muestra un spinner SVG rotatorio animado (`20px x 20px`) reemplazando o acompañando el texto.

---

### 5.3 Casillas de Verificación (`Checkboxes`)

Diseñadas con foco en la accesibilidad por teclado y tamaño táctil cómodo.

```html
<label class="custom-checkbox">
  <input type="checkbox" name="recordar" id="recordar-correo" />
  <span class="checkbox-indicator" aria-hidden="true">
    <svg class="check-icon" viewBox="0 0 16 16" fill="none">
      <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>
  <span class="checkbox-label">Recordar mi correo institucional</span>
</label>
```

- Tamaño del indicador: `18px x 18px`, `border-radius: 4px`.
- Estado no marcado: `border: 1px solid var(--border-medium)`.
- Estado marcado: `background: var(--brand-navy-950)`, `border-color: var(--brand-navy-950)`, checkmark blanco.
- Foco visible: `box-shadow: 0 0 0 3px rgba(13, 92, 86, 0.25)`.

---

### 5.4 Tarjetas y Contenedores Bento (`Cards`)

Las tarjetas agrupan información con un contenedor limpio y sin sombras exageradas.

- **Fondo**: `var(--surface-white)` (`#FFFFFF`).
- **Borde**: `1px solid var(--border-subtle)` (`#E2E8F0`).
- **Radio**: `var(--radius-lg)` (`12px`) o `var(--radius-xl)` (`16px`).
- **Padding interno**: `var(--space-6)` a `var(--space-8)` (24px a 32px en desktop, 20px en móvil).
- **Sombra**: `var(--shadow-sm)` en reposo; si es interactiva, `var(--shadow-md)` en hover.

---

### 5.5 Diálogos y Modales (`Modals`)

Utilizados para flujos secundarios como "¿Olvidaste tu contraseña?".

- **Backdrop**: `background-color: rgba(11, 19, 43, 0.5)` con `backdrop-filter: blur(4px)`.
- **Contenedor**: `max-width: 460px`, centrado en pantalla, `background: var(--surface-white)`, `border-radius: var(--radius-xl)`, `box-shadow: var(--shadow-modal)`.
- **Accesibilidad**: Cierre con tecla `Escape`, trampa de foco (`trapFocus`), foco automático en el primer input interactivo y restauración de foco al botón disparador al cerrar.

---

### 5.6 Notificaciones Toast (`Toasts`)

Retroalimentación flotante no bloqueante para eventos del sistema.

- **Posición**: Esquina inferior derecha (Desktop) o superior centrada (Móvil).
- **Estructura**: Icono semántico + Mensaje descriptivo + Botón de descarte.
- **Temporizador**: Desvanecimiento automático a los 4500ms o al pulsar la `X`.
- **ARIA**: Contenedor con `role="status"` y `aria-live="polite"`.

---

## 6. Sistema de Animaciones y Micro-interacciones

El movimiento debe ser sutil, elegante y natural.

### 6.1 Curvas de Aceleración y Tiempos

```css
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-smooth: cubic-bezier(0.4, 0, 0.2, 1);

  --duration-fast: 150ms;  /* Micro-cambios: botones, toggles, colores */
  --duration-normal: 250ms;/* Despliegues, aperturas de modales, focus rings */
  --duration-slow: 400ms;  /* Entradas de página, transiciones de vista */
}
```

### 6.2 Regla de Reducción de Movimiento

Todo CSS interactivo debe incluir la media query:

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 7. Buenas Prácticas de UI/UX y Redacción de Contenidos

1. **Mensajes de Error Claros y Accionables**:
   - ❌ *Incorrecto*: "¡Ups! Ocurrió un error." o "Entrada inválida."
   - ✅ *Correcto*: "Ingresa un correo electrónico con formato válido (ej. usuario@institucion.edu)."
2. **Textos de Botones Específicos**:
   - ❌ *Incorrecto*: "OK", "Enviar", "Clic Aquí".
   - ✅ *Correcto*: "Iniciar Sesión", "Restablecer Contraseña", "Crear Cuenta de Estudiante".
3. **Indicadores de Fortaleza de Contraseña**:
   - Evaluar longitud mínima (8 caracteres), mayúscula, número y símbolo.
   - Retroalimentación visual progresiva (Débil: Rojo, Media: Amarillo, Fuerte: Verde) sin bloquear al usuario de forma frustrante.
4. **Prevención de Pérdida de Datos**:
   - Guardar el estado de "Recordar correo" de forma segura en `localStorage` únicamente para el nombre de usuario/correo, nunca para contraseñas.

---

## 8. Guía para Crear Nuevas Pantallas

Cuando se creen vistas adicionales (ej. *Dashboard de Cursos, Perfil de Usuario, Calificaciones, Recuperación de Cuenta*):

1. **Estructura HTML Base**:
   - Importar `login.css` o la hoja de estilo del sistema de diseño común.
   - Definir `<main class="app-layout">` con contenedor centralizado `max-width: 1200px`.
2. **Mantener la Misma Jerarquía de Encabezados**:
   - Usar un único `<h1>` con la tipografía y peso definidos.
3. **Reutilizar Clases Utilitarias y de Componentes**:
   - Inputs: `.form-group`, `.form-label`, `.form-input`, `.form-feedback-msg`.
   - Botones: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`.
   - Tarjetas: `.card`, `.card-header`, `.card-body`, `.card-footer`.
   - Badges: `.badge`, `.badge-accent`, `.badge-success`, `.badge-warning`.

---
*Fin de la Guía Maestra del Sistema de Diseño.*
