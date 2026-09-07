# 🎓 Portal Académico · Campus Virtual (Aetheria Academy)

> Interfaz moderna, accesible y de grado de producción para el Campus Virtual Universitario. Diseñada bajo una filosofía de **minimalismo utilitario y editorial**, optimizada para el entorno educativo e investigativo.

---

## 📋 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Características Destacadas](#-características-destacadas)
3. [Filosofía y Sistema de Diseño](#-filosofía-y-sistema-de-diseño)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
6. [Instrucciones de Uso y Ejecución](#-instrucciones-de-uso-y-ejecución)
7. [Validaciones y Funcionalidades Interactivas](#-validaciones-y-funcionalidades-interactivas)
8. [Accesibilidad y Buenas Prácticas (A11y / WCAG)](#-accesibilidad-y-buenas-prácticas-a11y--wcag)

---

## 📖 Descripción General

Este proyecto implementa tanto el sistema de autenticación inicial como el **Portal del Estudiante** integral del Campus Virtual institucional. Proporciona a estudiantes una experiencia fluida, confiable y libre de distracciones, garantizando un estándar visual de alta calidad (*top-tier*). Se organiza de manera modular para garantizar la escalabilidad y un fácil mantenimiento.

---

## ✨ Características Destacadas

### 🔐 Autenticación y Acceso
- 🔄 **Selector de Modos Integrado**: Alternancia fluida entre **Iniciar Sesión** y **Crear Cuenta** sin recargar la página.
- 🚀 **Redirección Automática**: Conexión directa hacia el Dashboard tras validar credenciales o autenticación federada (SSO).
- 🛡️ **Medidor de Robustez de Contraseña**: Evaluación interactiva de seguridad con barra visual de progreso y etiquetas contextuales.
- 🔑 **Modal Accesible "¿Olvidaste tu contraseña?"**: Flujo de restablecimiento con desenfoque de fondo y temporizador de reenvío.

### 📊 Portal del Estudiante
- 🚪 **Cierre de Sesión Transversal**: Acceso rápido y visible para cerrar sesión desde la barra superior y la barra lateral en todas las pantallas.
- 📱 **Menú Lateral Móvil (Drawer)**: Botón de hamburguesa accesible en pantallas pequeñas con telón de fondo (*backdrop blur*) y soporte táctil.
- 🏠 **Dashboard Principal**: Vista consolidada de clases actuales y el historial académico con porcentajes de avance y calendario interactivo.
- 🧠 **Asistente de Aprendizaje ML (Machine Learning)**: Botón interactivo premium que desencadena una simulación animada (*top-tier*) de escaneo y análisis de rendimiento, desplegando recomendaciones didácticas predictivas (Alertas tempranas de riesgo).
- 📚 **Detalle de Clase y Entregas**: Módulo para cada clase que muestra información del docente, pestañas para navegar entre "Contenido Didáctico" y "Tareas".
- 📤 **Zona de Carga (Drag & Drop)**: Interfaz intuitiva y funcional para la subida de tareas, con barra de progreso simulada y cambios dinámicos de estado a "En Revisión".
- 📈 **Libro de Calificaciones**: Vista dedicada con una tabla filtrable (Todas, Calificadas, Pendientes) y soporte de desplazamiento horizontal responsivo.

---

## 🎨 Filosofía y Sistema de Diseño

El proyecto cuenta con un documento normativo completo: [diseño.md](diseño.md). Todos los componentes y vistas adicionales (Dashboard, Clases, Calificaciones) se han construido siguiendo estrictamente estas guías a través de `global.css` centralizado.

- **Midnight Slate (`#0B132B` / `#0F172A`)**: Base de contraste profundo y texto primario.
- **Botanical / Academic Teal (`#0D5C56` / `#14B8A6`)**: Acento de color que guía la atención.
- **Canvas Alabaster (`#F8FAFC`) y Blanco Puro (`#FFFFFF`)**: Superficies limpias.
- **Bordes Nítidos (`#E2E8F0`)**: Estructuras limpias sin sombras difusas excesivas.
- **Fuente Principal**: *Plus Jakarta Sans* (Google Fonts).

---

## 📂 Estructura del Proyecto

Para garantizar que un archivo no tenga demasiadas líneas de código y facilitar la escalabilidad, la arquitectura se divide en pantallas independientes:

```text
proyecto_tecnologias_emergentes/
├── index.html               # Redirección automática de bienvenida
├── diseño.md                # Manual canónico del Sistema de Diseño
├── global.css               # Estilos globales compartidos (tokens, layout base, botones, drawer móvil)
├── global.js                # Lógica global compartida (menú móvil, backdrop, parámetros URL)
│
├── login.html/css/js        # Módulo de Autenticación, Registro y Recuperación
├── dashboard.html/css/js    # Módulo de Dashboard del Estudiante, Calendario y Asistente ML
├── clase.html/css/js        # Módulo de Detalles de Clase, Contenido y Subida de Tareas
├── calificaciones.html/css/js # Módulo del Libro de Calificaciones y Filtros
│
├── README.md                # Documentación general del proyecto (este archivo)
└── skills/                  # Habilidades y guías de diseño frontend de referencia
```

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Semántico**: Elementos nativos y estructura modular.
- **CSS3 Moderno**: Variables CSS (`:root`), Flexbox, CSS Grid, `min-height: 100dvh`, diseño fluido y responsivo.
- **JavaScript Vanilla (ES6+)**: Interactividad sin dependencias externas (DOM Scripting, eventos, simulación de IA, drag & drop).
- **Phosphor Icons**: Iconografía vectorial nítida y moderna, cargada vía CDN.

---

## 🚀 Instrucciones de Uso y Ejecución

### Opción 1: Abrir directamente en el navegador
No requiere instalación:
1. Haz doble clic en el archivo [login.html](login.html) o [index.html](index.html) para iniciar la experiencia.
2. Inicia sesión para ser redirigido automáticamente a [dashboard.html](dashboard.html).
3. Desde el Dashboard, navega a las clases, revisa el calendario o activa el Asistente ML.
4. En dispositivos móviles, usa el botón de menú superior izquierdo para abrir el drawer lateral.
5. Puedes cerrar sesión en cualquier momento con el botón "Cerrar Sesión" en la barra superior o lateral.

### Opción 2: Usar un servidor local (Recomendado)
- **Con Live Server (Extensión de VS Code)**: Clic derecho sobre `login.html` y selecciona *Open with Live Server*.
- **Con Node.js (npx serve)**:
  ```bash
  npx serve .
  ```
  Luego abre `http://localhost:3000/login.html`.

---

## 🔍 Validaciones y Funcionalidades Interactivas

| Componente / Vista | Comportamiento |
|---|---|
| **Formularios (Login)** | Validación en tiempo real de correos electrónicos, medidor interactivo de fuerza de contraseñas y redirección al Dashboard tras autenticación. |
| **Menú Lateral Móvil** | Apertura fluida con botón de hamburguesa, telón de fondo oscuro translúcido y cierre automático al interactuar o presionar `Escape`. |
| **Pestañas (Dashboard y Clases)** | Navegación instantánea mediante JS Vanilla sin recargar la página (Clases actuales vs Historial). |
| **Botón Asistente ML** | Animaciones CSS avanzadas de gradientes rotatorios y despliegue de modal con simulación secuencial del análisis cognitivo. |
| **Zona de Upload (Tareas)** | Soporte para eventos de Drag & Drop (`dragenter`, `dragleave`, `drop`) y barra de progreso simulada para la carga de documentos. |
| **Filtros de Calificaciones** | Clasificación dinámica de elementos del DOM para visualizar únicamente tareas pendientes, calificadas o todas. |

---

## ♿ Accesibilidad y Buenas Prácticas (A11y / WCAG)

- **Contraste de Color**: Cumple estándar WCAG 2.1 AA.
- **Responsividad Absoluta**: Grid y Flexbox estructurados para colapsar armónicamente desde monitores de escritorio (1440px+) hasta teléfonos compactos (320px).
- **Tablas Desplazables**: Las tablas de calificaciones permiten *scroll* horizontal táctil sin distorsionar el layout de la pantalla.
- **Movimiento Reducido**: Soporte nativo de `prefers-reduced-motion` para anular animaciones en usuarios sensibles.

---

*Desarrollado para el entorno educativo de Aetheria Academy.*
