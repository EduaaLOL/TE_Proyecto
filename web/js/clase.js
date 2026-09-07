/**
 * clase.js — Detalle de una clase para el estudiante.
 *
 * Espera el ID de la clase en la URL: clase.html?clase=<id>
 *
 * Nota sobre lo que se quitó: la versión original simulaba subir tareas con
 * una barra de progreso falsa. El backend no tiene endpoints de escritura, así
 * que ese botón parecía funcionar sin hacer nada. Un control que miente es peor
 * que un control ausente, así que se eliminó.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const usuario = API.exigirSesion("estudiante");
  if (!usuario) return;

  const avatar = document.getElementById("avatar");
  if (avatar) {
    avatar.textContent = (usuario.nombre || "?")[0].toUpperCase();
    avatar.title = `${usuario.nombre} ${usuario.apellido}`;
  }

  // --- Pestañas (las que queden) ---
  document.querySelectorAll(".class-tab:not(.link)").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".class-tab:not(.link)").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.target}`)?.classList.remove("hidden");
    });
  });

  const idClase = new URLSearchParams(location.search).get("clase");
  const lista = document.getElementById("lista-tareas");

  if (!idClase) {
    lista.innerHTML = '<p>No se indicó qué clase mostrar. <a href="dashboard.html">Volver al inicio</a>.</p>';
    return;
  }

  // El enlace al libro de calificaciones tiene que arrastrar la clase
  const enlaceNotas = document.querySelector('.class-tab.link');
  if (enlaceNotas) enlaceNotas.href = `calificaciones.html?clase=${encodeURIComponent(idClase)}`;

  lista.innerHTML = '<p>Cargando actividades...</p>';

  try {
    const d = await API.detalleDeClase(usuario.id, idClase);

    document.getElementById("nombre-clase").textContent = d.clase.nombre;
    document.getElementById("desc-clase").textContent =
      `Vas con ${d.notaActual ?? "—"} sobre 100 · ${d.tareas.length} evaluaciones`;
    document.getElementById("nombre-docente").textContent = d.clase.docente;

    const badge = document.getElementById("badge-riesgo");
    if (d.riesgo) {
      badge.hidden = false;
      badge.className = `class-badge ${d.riesgo.nivel === "BAJO" ? "" : "risk"}`;
      badge.textContent = `Riesgo ${d.riesgo.nivel.toLowerCase()} (${d.riesgo.porcentaje}%)`;
    }

    lista.innerHTML = d.tareas.map(t => {
      const estado = !t.entregada
        ? '<span class="badge badge-error">No entregada</span>'
        : (t.atrasada ? '<span class="badge badge-warning">Entrega tardía</span>'
                      : '<span class="badge badge-success">Entregada a tiempo</span>');

      return `
      <div class="task-card">
        <div class="task-header">
          <div class="task-icon ${t.entregada ? "success" : ""}">
            <i class="ph ph-${t.entregada ? "check-circle" : "warning-circle"}"></i>
          </div>
          <div style="flex:1">
            <h3>${escapar(t.nombre)}</h3>
            <p>${escapar(t.tipo || "")} · vale ${t.pesoEnLaNota ?? "—"}% de la nota
               · fecha límite ${formatearFecha(t.fechaLimite)}</p>
          </div>
          <div style="text-align:right">
            <strong style="font-size:1.2rem">${t.entregada ? t.porcentajeObtenido + "%" : "—"}</strong>
            <div>${estado}</div>
          </div>
        </div>
        ${t.observaciones && t.entregada ? `<p style="margin:8px 0 0;font-size:.85rem;color:#64748B">
            Observación del docente: ${escapar(t.observaciones)}</p>` : ""}
      </div>`;
    }).join("") || "<p>Esta clase todavía no tiene actividades calificadas.</p>";

  } catch (e) {
    lista.innerHTML = `<p style="color:var(--color-error-text)">${escapar(e.message)}</p>`;
  }
});
