/**
 * panel-docente.js — Vista del docente: clases → estudiantes → detalle.
 *
 * Tres pantallas dentro de la misma página, con una miga de pan para volver.
 * Todos los datos vienen de la API; no hay nada fijo en el código.
 */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = API.exigirSesion("docente");
  if (!usuario) return;

  const vista = document.getElementById("vista");
  const miga = document.getElementById("miga");

  document.getElementById("nombre-docente").textContent = `${usuario.nombre} ${usuario.apellido}`;
  document.getElementById("btn-salir").addEventListener("click", () => API.cerrarSesion());

  function pintarMiga(pasos) {
    miga.innerHTML = pasos.map((p, i) => {
      const flecha = i > 0 ? '<i class="ph ph-caret-right" aria-hidden="true"></i>' : "";
      return p.accion
        ? `${flecha}<button data-paso="${i}">${escapar(p.texto)}</button>`
        : `${flecha}<span>${escapar(p.texto)}</span>`;
    }).join("");
    miga.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => pasos[Number(b.dataset.paso)].accion());
    });
  }

  function cargando(mensaje) {
    vista.innerHTML = `<p class="cargando">${escapar(mensaje)}</p>`;
  }

  function error(e) {
    vista.innerHTML = `<div class="aviso">${escapar(e.message)}</div>`;
  }

  function colorRiesgo(nivel) {
    return { ALTO: "#DC2626", MEDIO: "#D97706", BAJO: "#059669" }[nivel] || "#94A3B8";
  }

  // =======================================================================
  // Pantalla 1 — Las clases del docente
  // =======================================================================
  async function verClases() {
    pintarMiga([{ texto: "Mis clases" }]);
    cargando("Cargando tus clases...");

    try {
      const datos = await API.clasesDelDocente(usuario.id);
      document.getElementById("sub-docente").textContent =
        `${datos.clases.length} ${datos.clases.length === 1 ? "clase" : "clases"} a cargo`;

      if (!datos.clases.length) {
        vista.innerHTML = '<p class="cargando">No tenés clases asignadas.</p>';
        return;
      }

      vista.innerHTML = `<div class="rejilla">${datos.clases.map(c => `
        <button class="tarjeta ${c.enRiesgo > 0 ? "alerta" : ""}" data-id="${c.id}" data-nombre="${escapar(c.nombre)}">
          <h3>${escapar(c.nombre)}</h3>
          <p class="meta">${c.estudiantes} ${c.estudiantes === 1 ? "estudiante" : "estudiantes"}</p>
          <div class="cifras">
            <span class="cifra">
              <span class="n">${c.promedio ?? "—"}</span>
              <span class="t">Promedio</span>
            </span>
            <span class="cifra">
              <span class="n ${c.enRiesgo > 0 ? "mal" : "bien"}">${c.enRiesgo}</span>
              <span class="t">En riesgo</span>
            </span>
          </div>
        </button>`).join("")}</div>`;

      vista.querySelectorAll(".tarjeta").forEach(t => {
        t.addEventListener("click", () => verEstudiantes(t.dataset.id, t.dataset.nombre));
      });
    } catch (e) { error(e); }
  }

  // =======================================================================
  // Pantalla 2 — Los estudiantes de una clase, ordenados por riesgo
  // =======================================================================
  async function verEstudiantes(idClase, nombreClase) {
    pintarMiga([{ texto: "Mis clases", accion: verClases }, { texto: nombreClase }]);
    cargando(`Cargando estudiantes de ${nombreClase}...`);

    try {
      const datos = await API.estudiantesDeClase(idClase);

      const filas = datos.estudiantes.map(e => {
        const r = e.riesgo;
        const nota = e.notaActual;
        return `
        <tr class="clicable" data-est="${e.id}" data-nombre="${escapar(e.nombre + " " + e.apellido)}">
          <td><strong>${escapar(e.nombre)} ${escapar(e.apellido)}</strong></td>
          <td class="num">${nota ?? "—"}</td>
          <td>
            <div class="barra-mini">
              <span class="${claseDeNota(nota)}" style="width:${Math.max(0, Math.min(100, nota ?? 0))}%"></span>
            </div>
          </td>
          <td>${r ? `<span class="badge ${claseDeRiesgo(r.nivel)}">${r.nivel}</span>` : '<span class="badge badge-info">Sin datos</span>'}</td>
          <td class="num">${r ? r.porcentaje + "%" : "—"}</td>
        </tr>`;
      }).join("");

      vista.innerHTML = `
        <div class="detalle-cab">
          <h2>${escapar(datos.clase.nombre)}</h2>
          <p>${datos.estudiantes.length} estudiantes · ordenados por riesgo, de mayor a menor</p>
        </div>
        <div class="tabla-caja">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th class="num">Nota</th>
                <th>Avance</th>
                <th>Riesgo</th>
                <th class="num">Probabilidad</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>`;

      vista.querySelectorAll("tr.clicable").forEach(tr => {
        tr.addEventListener("click", () =>
          verDetalle(tr.dataset.est, tr.dataset.nombre, idClase, datos.clase.nombre));
      });
    } catch (e) { error(e); }
  }

  // =======================================================================
  // Pantalla 3 — Un estudiante en una clase: predicción + evaluaciones
  // =======================================================================
  async function verDetalle(idEst, nombreEst, idClase, nombreClase) {
    pintarMiga([
      { texto: "Mis clases", accion: verClases },
      { texto: nombreClase, accion: () => verEstudiantes(idClase, nombreClase) },
      { texto: nombreEst },
    ]);
    cargando(`Analizando a ${nombreEst}...`);

    try {
      const d = await API.detalleDeClase(idEst, idClase);
      const r = d.riesgo;

      const panelRiesgo = r ? `
        <div class="panel-riesgo">
          <h3>Predicción del modelo
            <span class="badge ${claseDeRiesgo(r.nivel)}">Riesgo ${r.nivel}</span>
          </h3>
          <div class="medidor">
            <span style="width:${r.porcentaje}%;background:${colorRiesgo(r.nivel)}"></span>
          </div>
          <p class="meta"><strong>${r.porcentaje}%</strong> de probabilidad de reprobar el curso.</p>
          <ul>${r.factores.map(f => `<li>${escapar(f)}</li>`).join("")}</ul>
          <p class="nota-vista">
            El modelo solo usó las primeras ${r.evaluacionesVistas} evaluaciones
            (resaltadas abajo). Las demás no las vio.
          </p>
          <div id="zona-redaccion"></div>
        </div>` : `
        <div class="panel-riesgo">
          <h3>Sin predicción</h3>
          <p class="meta">El modelo necesita al menos 3 evaluaciones y hay ${d.tareas.length}.</p>
        </div>`;

      const filas = d.tareas.map(t => `
        <tr class="${t.vistaPorElModelo ? "fila-vista" : ""}">
          <td>
            <strong>${escapar(t.nombre)}</strong>
            ${t.vistaPorElModelo ? '<span class="badge badge-info">vista por el modelo</span>' : ""}
          </td>
          <td>${escapar(t.tipo || "—")}</td>
          <td class="num">${t.pesoEnLaNota ?? "—"}%</td>
          <td class="num">${t.entregada ? t.porcentajeObtenido + "%" : "—"}</td>
          <td>${formatearFecha(t.fechaLimite)}</td>
          <td>${!t.entregada
            ? '<span class="badge badge-error">No entregada</span>'
            : (t.atrasada ? '<span class="badge badge-warning">Tardía</span>'
                          : '<span class="badge badge-success">A tiempo</span>')}</td>
        </tr>`).join("");

      vista.innerHTML = `
        <div class="detalle-cab">
          <h2>${escapar(d.estudiante.nombre)} ${escapar(d.estudiante.apellido)}</h2>
          <p>${escapar(d.clase.nombre)} · va con <strong>${d.notaActual ?? "—"}</strong> sobre 100
             (${d.aprobando ? "aprobando" : "reprobando"})</p>
        </div>
        ${panelRiesgo}
        <div class="tabla-caja">
          <table>
            <thead>
              <tr>
                <th>Evaluación</th><th>Tipo</th>
                <th class="num">Vale</th><th class="num">Obtuvo</th>
                <th>Fecha límite</th><th>Entrega</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>`;

      if (r) montarRedaccion(idEst, idClase);
    } catch (e) { error(e); }
  }

  // =======================================================================
  // Redacción con Gemini — opcional, y claramente separada del modelo
  // =======================================================================
  // El bloque de arriba ya mostró la predicción del Random Forest. Esto solo
  // agrega una explicación en prosa. Si no hay clave configurada, el botón ni
  // siquiera aparece: la pantalla sigue siendo útil sin él.
  function montarRedaccion(idEst, idClase) {
    const zona = document.getElementById("zona-redaccion");
    if (!zona || !geminiDisponible) return;

    zona.innerHTML = `
      <button class="btn btn-primary btn-sm" id="btn-redactar" style="margin-top:14px">
        <i class="ph ph-magic-wand"></i> Redactar informe para el docente
      </button>`;

    document.getElementById("btn-redactar").addEventListener("click", async (ev) => {
      const boton = ev.currentTarget;
      boton.disabled = true;
      boton.innerHTML = '<i class="ph ph-circle-notch"></i> Redactando...';

      try {
        const d = await API.recomendacion(idEst, idClase);
        zona.innerHTML = `
          <div style="margin-top:16px;padding:16px 18px;background:#F0FDFA;border:1px solid #99F6E4;border-radius:9px">
            <p style="margin:0 0 10px;font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;color:#0D5C56;font-weight:600">
              Informe redactado
            </p>
            <p style="margin:0 0 12px;font-size:.9rem;line-height:1.55">${escapar(d.redaccion.resumen)}</p>
            <p style="margin:0 0 6px;font-size:.8rem;font-weight:600">Acciones sugeridas</p>
            <ul style="margin:0;padding-left:20px;font-size:.87rem;color:#334155">
              ${d.redaccion.acciones.map(a => `<li style="margin-bottom:4px">${escapar(a)}</li>`).join("")}
            </ul>
            <p style="margin:12px 0 0;font-size:.75rem;color:#64748B">
              El nivel de riesgo lo determinó el modelo entrenado. Este texto solo lo explica.
            </p>
          </div>`;
      } catch (e) {
        zona.innerHTML = `<p style="margin-top:14px;font-size:.85rem;color:#B91C1C">${escapar(e.message)}</p>`;
      }
    });
  }

  // Preguntamos una sola vez si Gemini está configurado, al arrancar.
  let geminiDisponible = false;
  API.salud().then(s => { geminiDisponible = s.gemini; }).catch(() => {});

  verClases();
});
