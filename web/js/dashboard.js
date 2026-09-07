/**
 * ============================================================================
 * LÓGICA DEL DASHBOARD DEL ESTUDIANTE · AETHERIA ACADEMY (dashboard.js)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. GESTIÓN DE TABS (Clases Actuales vs Historial)
    // ----------------------------------------------------------------------
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.grid-main-col');

    function activateTab(tabName) {
        tabBtns.forEach(b => {
            if (b.dataset.tab === tabName) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        tabContents.forEach(c => {
            if (c.id === `tab-${tabName}`) {
                c.classList.remove('hidden');
            } else {
                c.classList.add('hidden');
            }
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activateTab(btn.dataset.tab);
        });
    });

    // Enlaces de navegación rápida desde la barra lateral
    const navMisClases = document.getElementById('nav-mis-clases');
    navMisClases?.addEventListener('click', (e) => {
        activateTab('actuales');
        const seccion = document.getElementById('seccion-clases');
        seccion?.scrollIntoView({ behavior: 'smooth' });
    });

    const navCalendario = document.getElementById('nav-calendario');
    navCalendario?.addEventListener('click', (e) => {
        const cal = document.getElementById('widget-calendario');
        cal?.scrollIntoView({ behavior: 'smooth' });
    });

    // ----------------------------------------------------------------------
    // 2. CALENDARIO MENSUAL INTERACTIVO & AGENDA DE ENTREGAS
    // ----------------------------------------------------------------------
    const calendarDaysContainer = document.getElementById('calendar-days-container');
    const calCurrentLabel = document.getElementById('cal-current-label');
    const calPrevBtn = document.getElementById('cal-prev-btn');
    const calNextBtn = document.getElementById('cal-next-btn');
    const agendaDateTitle = document.getElementById('agenda-date-title');
    const agendaCountBadge = document.getElementById('agenda-count-badge');
    const agendaEventsList = document.getElementById('agenda-events-list');
    const btnResetCalFilter = document.getElementById('btn-reset-cal-filter');

    // Actividades del calendario. Se llenan desde la API con las fechas límite
    // reales de las tareas del estudiante (ver el bootstrap al final del archivo).
    let academicEvents = [];

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const shortMonthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    // El calendario abre en el mes actual, no en una fecha fija.
    let currentCalDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let selectedDateStr = null;

    function renderCalendar() {
        if (!calendarDaysContainer) return;

        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();

        // Actualizar etiqueta del mes actual
        if (calCurrentLabel) {
            calCurrentLabel.textContent = `${monthNames[month]} ${year}`;
        }

        calendarDaysContainer.innerHTML = '';

        // Primer día del mes (0=Domingo, ..., 6=Sábado) -> Convertir para que Lunes sea 0
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const startingDay = (firstDayOfMonth + 6) % 7; // 0 = Lunes, 6 = Domingo

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Días del mes anterior (padding)
        for (let i = startingDay - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const prevMonthDate = new Date(year, month - 1, dayNum);
            const dateStr = formatDate(prevMonthDate);

            const cell = createDayCell(dayNum, dateStr, true);
            calendarDaysContainer.appendChild(cell);
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const thisDate = new Date(year, month, day);
            const dateStr = formatDate(thisDate);

            const cell = createDayCell(day, dateStr, false);
            calendarDaysContainer.appendChild(cell);
        }

        // Días del mes siguiente para completar la cuadrícula (múltiplo de 7)
        const totalRendered = startingDay + daysInMonth;
        const remainingCells = (7 - (totalRendered % 7)) % 7;

        for (let day = 1; day <= remainingCells; day++) {
            const nextMonthDate = new Date(year, month + 1, day);
            const dateStr = formatDate(nextMonthDate);

            const cell = createDayCell(day, dateStr, true);
            calendarDaysContainer.appendChild(cell);
        }

        // Renderizar agenda según la selección actual
        renderAgenda(selectedDateStr);
    }

    function formatDate(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function createDayCell(dayNumber, dateStr, isOtherMonth) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('data-date', dateStr);

        if (isOtherMonth) {
            cell.classList.add('other-month');
        }

        // Marcar día seleccionado
        if (selectedDateStr === dateStr) {
            cell.classList.add('is-selected');
        }

        // Marcar día actual (simulado como 14 de Octubre de 2026)
        if (dateStr === '2026-10-14') {
            cell.classList.add('is-today');
        }

        // Buscar eventos para este día
        const dayEvents = academicEvents.filter(ev => ev.date === dateStr);
        if (dayEvents.length > 0) {
            cell.classList.add('has-events');
            cell.setAttribute('title', dayEvents.map(e => `${e.course}: ${e.title}`).join(' | '));
        }

        const dayNumSpan = document.createElement('span');
        dayNumSpan.className = 'day-number';
        dayNumSpan.textContent = dayNumber;
        cell.appendChild(dayNumSpan);

        // Indicadores visuales de actividades (dots)
        if (dayEvents.length > 0) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'day-events-dots';

            dayEvents.forEach(ev => {
                const dot = document.createElement('span');
                dot.className = `event-dot ${ev.type}`;
                dotsContainer.appendChild(dot);
            });

            cell.appendChild(dotsContainer);
        }

        // Evento de clic para filtrar eventos por día
        if (!isOtherMonth) {
            cell.addEventListener('click', () => {
                if (selectedDateStr === dateStr) {
                    // Deseleccionar si ya estaba seleccionado
                    selectedDateStr = null;
                } else {
                    selectedDateStr = dateStr;
                }
                renderCalendar();
            });
        }

        return cell;
    }

    function renderAgenda(filterDate = null) {
        if (!agendaEventsList) return;

        agendaEventsList.innerHTML = '';
        const currentYear = currentCalDate.getFullYear();
        const currentMonth = currentCalDate.getMonth();

        let eventsToShow = [];

        if (filterDate) {
            // Filtrar por día específico
            eventsToShow = academicEvents.filter(ev => ev.date === filterDate);
            const [y, m, d] = filterDate.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);

            if (agendaDateTitle) {
                agendaDateTitle.innerHTML = `<i class="ph-fill ph-calendar-check"></i> Actividades del ${d} de ${monthNames[m - 1]}`;
            }
            btnResetCalFilter?.classList.remove('hidden');
        } else {
            // Mostrar todas las actividades del mes actualmente visualizado
            const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
            eventsToShow = academicEvents
                .filter(ev => ev.date.startsWith(monthPrefix))
                .sort((a, b) => a.date.localeCompare(b.date));

            if (agendaDateTitle) {
                agendaDateTitle.innerHTML = `<i class="ph-fill ph-clock"></i> Actividades de ${monthNames[currentMonth]} ${currentYear}`;
            }
            btnResetCalFilter?.classList.add('hidden');
        }

        // Actualizar badge de conteo
        if (agendaCountBadge) {
            const count = eventsToShow.length;
            agendaCountBadge.textContent = `${count} ${count === 1 ? 'entrega' : 'entregas'}`;
            agendaCountBadge.className = count > 0 ? 'badge badge-info' : 'badge badge-secondary';
        }

        if (eventsToShow.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'agenda-empty-msg';
            emptyEl.innerHTML = `
                <i class="ph ph-calendar-x" style="font-size: 1.5rem; margin-bottom: 0.25rem; display: block;"></i>
                No hay actividades o entregas programadas para esta fecha.
            `;
            agendaEventsList.appendChild(emptyEl);
            return;
        }

        // Renderizar tarjetas de eventos
        eventsToShow.forEach(ev => {
            const [y, m, d] = ev.date.split('-').map(Number);
            const monthShort = shortMonthNames[m - 1];

            const card = document.createElement('div');
            card.className = `agenda-event-card ${ev.type}-type`;

            card.innerHTML = `
                <div class="event-date-col">
                    <span class="event-day-num">${d}</span>
                    <span class="event-month-lbl">${monthShort}</span>
                </div>
                <div class="event-details-col">
                    <div class="event-top-row">
                        <span class="event-course-title">${ev.course} • ${ev.section}</span>
                        <span class="badge ${ev.badgeClass}">${ev.badgeText}</span>
                    </div>
                    <h5 class="event-name">${ev.title}</h5>
                    <div class="event-footer-row">
                        <span class="event-time-badge">
                            <i class="ph ph-clock"></i> Hora límite: ${ev.time}
                        </span>
                        <a href="${ev.link}" class="event-action-link">
                            <span>Ver actividad</span>
                            <i class="ph-bold ph-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;

            agendaEventsList.appendChild(card);
        });
    }

    // Controles de navegación mensual
    calPrevBtn?.addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        selectedDateStr = null;
        renderCalendar();
    });

    calNextBtn?.addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        selectedDateStr = null;
        renderCalendar();
    });

    btnResetCalFilter?.addEventListener('click', () => {
        selectedDateStr = null;
        renderCalendar();
    });

    // Iniciar renderizado del calendario
    renderCalendar();

    // ----------------------------------------------------------------------
    // 3. ASISTENTE DE MACHINE LEARNING (Simulación interactiva)
    // ----------------------------------------------------------------------
    const mlTriggers = document.querySelectorAll('.ml-trigger');
    const mlModal = document.getElementById('ml-modal');
    const closeMlModal = document.getElementById('close-ml-modal');

    const stateLoading = document.getElementById('ml-state-loading');
    const stateResults = document.getElementById('ml-state-results');
    const loadingText = document.getElementById('ml-loading-text');

    // Mensajes mientras el modelo responde. Son honestos: describen lo que el
    // backend está haciendo de verdad (leer Mongo, calcular las 5 variables,
    // pasarlas por el Random Forest), no una animación de relleno.
    const loadingMessages = [
        "Leyendo tus calificaciones...",
        "Calculando promedio, tendencia y entregas...",
        "Consultando el modelo entrenado...",
    ];

    let mlInterval = null;
    let geminiDisponible = false;
    API.salud().then(s => { geminiDisponible = s.gemini; }).catch(() => {});

    async function openMlAssistant() {
        if (!mlModal) return;

        stateLoading.classList.remove("hidden");
        stateResults.classList.add("hidden");
        mlModal.classList.remove("hidden");

        if (mlInterval) clearInterval(mlInterval);
        let step = 0;
        if (loadingText) loadingText.textContent = loadingMessages[0];
        mlInterval = setInterval(() => {
            step = (step + 1) % loadingMessages.length;
            if (loadingText) loadingText.textContent = loadingMessages[step];
        }, 900);

        const contenedor = document.getElementById("ml-resultado");
        try {
            const usuario = API.sesion();
            const datos = await API.clasesDelEstudiante(usuario.id);
            contenedor.innerHTML = construirInforme(datos);

            // Una sola llamada a Gemini, para la clase que peor va: pedir una
            // por clase multiplicaria la espera y la cuota sin agregar mucho.
            const peor = datos.clases
                .filter(c => c.riesgo && c.riesgo.nivel !== "BAJO")
                .sort((a, b) => b.riesgo.probabilidad - a.riesgo.probabilidad)[0];

            if (geminiDisponible && peor) {
                const zona = document.createElement("div");
                zona.innerHTML = '<p class="reco-label">Redactando recomendación...</p>';
                contenedor.appendChild(zona);
                try {
                    const rec = await API.recomendacion(usuario.id, peor.id);
                    zona.innerHTML = `
                      <div class="ml-insight-card">
                        <h4>Qué hacer con ${escapar(peor.nombre)}</h4>
                        <p>${escapar(rec.redaccion.resumen)}</p>
                        <div class="ml-recommendations">
                          <span class="reco-label">Pasos sugeridos:</span>
                          <ul class="reco-list">
                            ${rec.redaccion.acciones.map(a => `<li>${escapar(a)}</li>`).join("")}
                          </ul>
                        </div>
                      </div>`;
                } catch {
                    zona.innerHTML = "";   // sin redacción, el informe de arriba ya sirve
                }
            }
        } catch (e) {
            contenedor.innerHTML = `<div class="ml-insight-card"><h4>No se pudo analizar</h4><p>${escapar(e.message)}</p></div>`;
        } finally {
            clearInterval(mlInterval);
            stateLoading.classList.add("hidden");
            stateResults.classList.remove("hidden");
        }
    }

    /** Arma el informe con las predicciones reales del modelo, clase por clase. */
    function construirInforme(datos) {
        const conRiesgo = datos.clases
            .filter(c => c.riesgo)
            .sort((a, b) => b.riesgo.probabilidad - a.riesgo.probabilidad);

        if (!conRiesgo.length) {
            return `<div class="ml-insight-card">
                <h4>Todavía no hay suficientes datos</h4>
                <p>El modelo necesita al menos 3 evaluaciones en una clase para poder opinar.</p>
            </div>`;
        }

        const alertas = conRiesgo.filter(c => c.riesgo.nivel !== "BAJO");
        const encabezado = alertas.length
            ? `<p><strong>${alertas.length}</strong> de tus ${conRiesgo.length} clases ${alertas.length === 1 ? "necesita" : "necesitan"} atención.</p>`
            : `<p>Ninguna de tus ${conRiesgo.length} clases muestra señales de riesgo.</p>`;

        const tarjetas = conRiesgo.map(c => {
            const r = c.riesgo;
            const critica = r.nivel === "ALTO";
            return `<div class="ml-insight-card ${critica ? "risk-insight" : ""}">
                <h4>${escapar(c.nombre)}
                    <span class="badge ${claseDeRiesgo(r.nivel)}">Riesgo ${escapar(r.nivel)}</span>
                </h4>
                <p>Probabilidad estimada de reprobar: <strong>${r.porcentaje}%</strong>.
                   Vas con <strong>${c.notaActual ?? "—"}</strong> sobre 100.</p>
                <div class="ml-recommendations">
                    <span class="reco-label">Datos que recibió el modelo:</span>
                    <ul class="reco-list">
                        ${r.factores.map(f => `<li>${escapar(f)}</li>`).join("")}
                    </ul>
                </div>
            </div>`;
        }).join("");

        return encabezado + tarjetas +
            `<p style="font-size:.8rem;color:#64748B;margin-top:14px">
                Predicción de un Random Forest entrenado con ${escapar(String(conRiesgo[0].riesgo.evaluacionesVistas))}
                evaluaciones por curso. Es una estimación, no un veredicto.
            </p>`;
    }

    mlTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openMlAssistant();
        });
    });

    // Cerrar Modal
    function closeModal() {
        if (mlInterval) clearInterval(mlInterval);
        mlModal?.classList.add('hidden');
    }

    closeMlModal?.addEventListener('click', closeModal);

    // Cerrar al hacer clic fuera del modal
    mlModal?.addEventListener('click', (e) => {
        if (e.target === mlModal) {
            closeModal();
        }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mlModal?.classList.contains('hidden')) {
            closeModal();
        }
    });

    // ----------------------------------------------------------------------
    // 4. ANIMACIÓN INICIAL DE BARRAS DE PROGRESO
    // ----------------------------------------------------------------------
    const progressFills = document.querySelectorAll('.progress-fill');
    progressFills.forEach(fill => {
        const targetWidth = fill.style.width;
        fill.style.width = '0%';
        setTimeout(() => {
            fill.style.width = targetWidth;
        }, 200);
    });

    // ----------------------------------------------------------------------
    // 5. DATOS REALES — todo lo de arriba es UI; acá entra la base de datos
    // ----------------------------------------------------------------------
    const usuario = API.exigirSesion("estudiante");
    if (!usuario) return;   // exigirSesion ya redirigió al login

    document.getElementById("saludo").textContent = `Hola, ${usuario.nombre}`;
    const avatar = document.getElementById("avatar");
    avatar.textContent = (usuario.nombre || "?")[0].toUpperCase();
    avatar.title = `${usuario.nombre} ${usuario.apellido} (estudiante)`;

    document.getElementById("btn-salir")?.addEventListener("click", () => API.cerrarSesion());

    /** Una tarjeta de clase con la nota real y el riesgo del modelo. */
    function tarjetaDeClase(clase) {
        const r = clase.riesgo;
        const enRiesgo = r && r.nivel !== "BAJO";
        const nota = clase.notaActual;
        const insignia = r
            ? `<span class="badge ${claseDeRiesgo(r.nivel)}">Riesgo ${r.nivel.toLowerCase()}</span>`
            : `<span class="badge badge-info">Sin datos suficientes</span>`;

        return `
        <a href="clase.html?clase=${encodeURIComponent(clase.id)}" class="class-card ${enRiesgo ? "risk" : ""}">
            <div class="class-card-header">
                <div class="class-info">
                    <h3>${escapar(clase.nombre)}</h3>
                    <span class="class-section">${escapar(clase.docente)} • ${clase.evaluadas} evaluaciones</span>
                </div>
                <div class="class-grade">
                    <span class="grade-value">${nota === null ? "—" : nota}</span>
                </div>
            </div>
            <div class="class-progress-container">
                <div class="progress-bar">
                    <div class="progress-fill ${claseDeNota(nota)}" style="width: ${Math.max(0, Math.min(100, nota ?? 0))}%;"></div>
                </div>
                <span class="progress-text">${insignia}</span>
            </div>
        </a>`;
    }

    const listaClases = document.getElementById("lista-clases");
    const listaHistorial = document.getElementById("lista-historial");
    listaClases.innerHTML = '<p class="progress-text">Cargando tus clases...</p>';

    API.clasesDelEstudiante(usuario.id)
        .then(async (datos) => {
            if (!datos.clases.length) {
                listaClases.innerHTML = '<p class="progress-text">No estás matriculado en ninguna clase.</p>';
                listaHistorial.innerHTML = "";
                return;
            }

            // "Actuales" = cursos todavía en marcha; "historial" = ya cerrados (6 de 6).
            const actuales = datos.clases.filter(c => c.evaluadas < 6);
            const cerradas = datos.clases.filter(c => c.evaluadas >= 6);

            listaClases.innerHTML = (actuales.length ? actuales : datos.clases).map(tarjetaDeClase).join("");
            listaHistorial.innerHTML = cerradas.length
                ? cerradas.map(tarjetaDeClase).join("")
                : '<p class="progress-text">Todavía no hay clases cerradas.</p>';

            document.getElementById("titulo-periodo").textContent =
                `Mis clases (${datos.clases.length})`;

            // Re-animar las barras recién insertadas
            document.querySelectorAll(".progress-fill").forEach(fill => {
                const ancho = fill.style.width;
                fill.style.width = "0%";
                setTimeout(() => { fill.style.width = ancho; }, 100);
            });

            // --- Calendario con las fechas límite reales de cada tarea ---
            const detalles = await Promise.all(
                datos.clases.map(c => API.detalleDeClase(usuario.id, c.id).catch(() => null))
            );

            academicEvents = [];
            let n = 0;
            for (const d of detalles) {
                if (!d) continue;
                for (const t of d.tareas) {
                    if (!t.fechaLimite) continue;
                    academicEvents.push({
                        id: ++n,
                        date: t.fechaLimite.slice(0, 10),
                        title: t.nombre,
                        course: d.clase.nombre,
                        section: t.entregada ? `Obtuviste ${t.porcentajeObtenido}%` : "No entregada",
                        time: "23:59",
                        type: (t.tipo || "").toLowerCase(),
                        badgeClass: !t.entregada ? "badge-error" : (t.atrasada ? "badge-warning" : "badge-success"),
                        badgeText: !t.entregada ? "No entregada" : (t.atrasada ? "Entrega tardía" : t.tipo),
                        link: `clase.html?clase=${encodeURIComponent(d.clase.id)}`,
                    });
                }
            }

            // Abrir el calendario en el mes donde de verdad hay actividad
            if (academicEvents.length) {
                const ultima = academicEvents.map(e => e.date).sort().at(-1);
                const [anio, mes] = ultima.split("-").map(Number);
                currentCalDate = new Date(anio, mes - 1, 1);
            }
            renderCalendar();
        })
        .catch(e => {
            listaClases.innerHTML =
                `<p class="progress-text" style="color:var(--color-error-text)">${escapar(e.message)}</p>`;
        });
});
