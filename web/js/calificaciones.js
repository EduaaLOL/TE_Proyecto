/**
 * calificaciones.js — Libro de calificaciones del estudiante.
 *
 * Con ?clase=<id> muestra solo esa clase; sin parámetro, muestra todas.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const usuario = API.exigirSesion("estudiante");
  if (!usuario) return;

  const avatar = document.getElementById("avatar");
  if (avatar) {
    avatar.textContent = (usuario.nombre || "?")[0].toUpperCase();
    avatar.title = `${usuario.nombre} ${usuario.apellido}`;
  }

  const cuerpo = document.getElementById("filas-notas");
  const subtitulo = document.getElementById("sub-clase");
  const idClase = new URLSearchParams(location.search).get("clase");

  if (idClase) {
    const volver = document.getElementById("volver");
    if (volver) {
      volver.href = `clase.html?clase=${encodeURIComponent(idClase)}`;
      volver.querySelector("span").textContent = "Volver a la clase";
    }
  }

  cuerpo.innerHTML = '<tr><td colspan="5">Cargando calificaciones...</td></tr>';

  try {
    const datos = await API.clasesDelEstudiante(usuario.id);
    const clases = idClase ? datos.clases.filter(c => c.id === idClase) : datos.clases;

    if (!clases.length) {
      cuerpo.innerHTML = '<tr><td colspan="5">No hay clases para mostrar.</td></tr>';
      return;
    }

    subtitulo.textContent = idClase
      ? `${clases[0].nombre} · ${clases[0].docente}`
      : `${clases.length} clases · ${usuario.nombre} ${usuario.apellido}`;

    const detalles = (await Promise.all(
      clases.map(c => API.detalleDeClase(usuario.id, c.id).catch(() => null))
    )).filter(Boolean);

    const filas = [];
    for (const d of detalles) {
      for (const t of d.tareas) {
        // Las clases del filtro ("graded" / "pending") tienen que coincidir con
        // los data-filter de los botones que ya estaban en el HTML.
        const clase = t.entregada ? "graded" : "pending";
        const estado = t.entregada
          ? (t.atrasada ? '<span class="badge badge-warning">Entregada tarde</span>'
                        : '<span class="badge badge-success">Calificada</span>')
          : '<span class="badge badge-error">No entregada</span>';

        filas.push(`
          <tr class="grade-row ${clase}">
            <td>
              <div class="activity-info">
                <i class="ph-fill ph-file-text"></i>
                <div>
                  <h4>${escapar(t.nombre)}</h4>
                  <span>${escapar(d.clase.nombre)} · vale ${t.pesoEnLaNota ?? "—"}%</span>
                </div>
              </div>
            </td>
            <td>${estado}</td>
            <td>${formatearFecha(t.fechaLimite)}</td>
            <td class="text-right"><strong>${t.entregada ? t.porcentajeObtenido + "%" : "—"}</strong></td>
            <td class="text-right">${escapar(t.observaciones || "—")}</td>
          </tr>`);
      }
    }

    cuerpo.innerHTML = filas.join("") ||
      '<tr><td colspan="5">Todavía no hay actividades calificadas.</td></tr>';

    // --- Filtros (los botones ya existían en el HTML) ---
    const botones = document.querySelectorAll(".filter-btn");
    botones.forEach(btn => {
      btn.addEventListener("click", () => {
        botones.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filtro = btn.dataset.filter;
        document.querySelectorAll(".grade-row").forEach(fila => {
          fila.classList.toggle("hidden", filtro !== "all" && !fila.classList.contains(filtro));
        });
      });
    });

  } catch (e) {
    cuerpo.innerHTML = `<tr><td colspan="5" style="color:var(--color-error-text)">${escapar(e.message)}</td></tr>`;
  }
});
