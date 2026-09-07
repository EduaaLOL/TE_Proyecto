/**
 * panel-docente.js — Vista del docente: clases → estudiantes → detalle.
 *
 * Tres pantallas dentro de la misma página, con miga de pan para volver.
 * Todos los datos vienen de la API; no hay nada fijo en el código.
 */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = API.exigirSesion("docente");
  if (!usuario) return;

  const vista = document.getElementById("vista");
  const miga = document.getElementById("miga");
  const resumen = document.getElementById("sidebar-resumen");

  document.getElementById("nombre-docente").textContent = `${usuario.nombre} ${usuario.apellido}`;

  const avatar = document.getElementById("avatar-docente");
  avatar.textContent = (usuario.nombre || "?")[0].toUpperCase();
  avatar.title = `${usuario.nombre} ${usuario.apellido} (docente)`;

  ["btn-salir", "btn-salir-top"].forEach(id =>
    document.getElementById(id)?.addEventListener("click", () => API.cerrarSesion()));

  // Guardamos las clases al cargarlas: el atajo "Estudiantes en riesgo" y el
  // resumen lateral las reutilizan sin volver a pedirlas.
  let clasesCache = [];

  // =======================================================================
  // Utilidades de presentación
  // =======================================================================

  function iniciales(nombre, apellido = "") {
    return ((nombre || "?")[0] + (apellido[0] || "")).toUpperCase();
  }

  function severidad(enRiesgo, total) {
    if (!total || !enRiesgo) return "";
    return enRiesgo / total >= 0.4 ? "grave" : "media";
  }

  function claseDeCifra(nota) {
    if (nota === null || nota === undefined) return "";
    if (nota >= 80) return "bien";
    if (nota >= 60) return "regular";
    return "mal";
  }

  function colorRiesgo(nivel) {
    return { ALTO: "#DC2626", MEDIO: "#D97706", BAJO: "#10B981" }[nivel] || "#94A3B8";
  }

  function nivelACaja(nivel) {
    return { ALTO: "grave", MEDIO: "media", BAJO: "leve" }[nivel] || "leve";
  }

  function pintarMiga(pasos) {
    miga.innerHTML = pasos.map((p, i) => {
      const flecha = i > 0 ? '<i class="ph-bold ph-caret-right" aria-hidden="true"></i>' : "";
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
    vista.innerHTML = `<div class="aviso-error">${escapar(e.message)}</div>`;
  }

  function marcarNav(id) {
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(n => n.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
  }

  // =======================================================================
  // Pantalla 1 — Las clases del docente
  // =======================================================================
  async function verClases() {
    marcarNav("nav-clases");
    pintarMiga([{ texto: "Mis clases" }]);
    cargando("Cargando tus clases...");

    try {
      const datos = await API.clasesDelDocente(usuario.id);
      clasesCache = datos.clases;

      const totalEst = datos.clases.reduce((s, c) => s + c.estudiantes, 0);
      const totalRiesgo = datos.clases.reduce((s, c) => s + c.enRiesgo, 0);
      const promedios = datos.clases.map(c => c.promedio).filter(p => p !== null);
      const promGeneral = promedios.length
        ? Math.round(promedios.reduce((a, b) => a + b, 0) / promedios.length * 10) / 10
        : null;

      document.getElementById("sub-docente").textContent =
        `${datos.clases.length} ${datos.clases.length === 1 ? "clase" : "clases"} · ${totalEst} estudiantes`;

      resumen.innerHTML = `
        <div class="resumen-fila">
          <span class="r-etq">Promedio general</span>
          <span class="r-val">${promGeneral ?? "—"}</span>
        </div>
        <div class="resumen-fila">
          <span class="r-etq">Estudiantes</span>
          <span class="r-val">${totalEst}</span>
        </div>
        <div class="resumen-fila">
          <span class="r-etq">En riesgo</span>
          <span class="r-val ${totalRiesgo ? "alerta" : ""}">${totalRiesgo}</span>
        </div>`;

      if (!datos.clases.length) {
        vista.innerHTML = '<div class="vacio"><i class="ph ph-books"></i>No tenés clases asignadas.</div>';
        return;
      }

      vista.innerHTML = `
        <div class="cab-vista">
          <div>
            <h2>Mis clases</h2>
            <p>${totalRiesgo
              ? `${totalRiesgo} ${totalRiesgo === 1 ? "estudiante necesita" : "estudiantes necesitan"} atención`
              : "Ningún estudiante en riesgo"}</p>
          </div>
        </div>
        <div class="rejilla-clases">${datos.clases.map(tarjetaDeClase).join("")}</div>`;

      vista.querySelectorAll(".tarjeta-clase").forEach(t => {
        t.addEventListener("click", () => verEstudiantes(t.dataset.id, t.dataset.nombre));
      });
    } catch (e) { error(e); }
  }

  /** Tarjeta con promedio y la distribución de riesgo como barra apilada. */
  function tarjetaDeClase(c) {
    const sinDatos = Math.max(0, c.estudiantes - c.enRiesgo);
    const pctRiesgo = c.estudiantes ? (c.enRiesgo / c.estudiantes) * 100 : 0;

    return `
      <button class="tarjeta-clase ${severidad(c.enRiesgo, c.estudiantes)}"
              data-id="${c.id}" data-nombre="${escapar(c.nombre)}">
        <div class="tc-cabecera">
          <div>
            <h3>${escapar(c.nombre)}</h3>
            <p class="tc-meta">${c.estudiantes} ${c.estudiantes === 1 ? "estudiante" : "estudiantes"}</p>
          </div>
          <div class="tc-nota">
            <span class="n ${claseDeCifra(c.promedio)}">${c.promedio ?? "—"}</span>
            <span class="t">Promedio</span>
          </div>
        </div>
        <div class="tc-barra">
          <span class="seg-alto" style="width:${pctRiesgo}%"></span>
          <span class="seg-bajo" style="width:${100 - pctRiesgo}%"></span>
        </div>
        <div class="tc-leyenda">
          <span><i class="p-alto"></i>${c.enRiesgo} en riesgo</span>
          <span><i class="p-bajo"></i>${sinDatos} sin alertas</span>
        </div>
      </button>`;
  }

  // =======================================================================
  // Pantalla 2 — Los estudiantes de una clase, ordenados por riesgo
  // =======================================================================
  async function verEstudiantes(idClase, nombreClase) {
    marcarNav("nav-clases");
    pintarMiga([{ texto: "Mis clases", accion: verClases }, { texto: nombreClase }]);
    cargando(`Cargando estudiantes de ${nombreClase}...`);

    try {
      const datos = await API.estudiantesDeClase(idClase);
      const enRiesgo = datos.estudiantes.filter(e => e.riesgo && e.riesgo.nivel !== "BAJO").length;

      vista.innerHTML = `
        <div class="cab-vista">
          <div>
            <h2>${escapar(datos.clase.nombre)}</h2>
            <p>${datos.estudiantes.length} estudiantes · ${enRiesgo} en riesgo · ordenados de mayor a menor</p>
          </div>
        </div>
        <div class="caja-tabla">
          <div class="scroll-x">
            <table class="estudiantes">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th class="num">Nota</th>
                  <th>Avance</th>
                  <th>Riesgo</th>
                  <th class="num">Probabilidad</th>
                </tr>
              </thead>
              <tbody>${datos.estudiantes.map(filaEstudiante).join("")}</tbody>
            </table>
          </div>
        </div>`;

      vista.querySelectorAll("tbody tr").forEach(tr => {
        tr.addEventListener("click", () =>
          verDetalle(tr.dataset.est, tr.dataset.nombre, idClase, datos.clase.nombre));
      });
    } catch (e) { error(e); }
  }

  function filaEstudiante(e) {
    const r = e.riesgo;
    const nota = e.notaActual;
    const alerta = r && r.nivel !== "BAJO";

    return `
      <tr data-est="${e.id}" data-nombre="${escapar(e.nombre + " " + e.apellido)}">
        <td>
          <div class="celda-persona">
            <span class="ini ${alerta ? "riesgo" : ""}">${escapar(iniciales(e.nombre, e.apellido))}</span>
            <span>
              <span class="nom">${escapar(e.nombre)} ${escapar(e.apellido)}</span>
              <span class="sub">${e.evaluadas} evaluaciones${e.aprobando === false ? " · reprobando" : ""}</span>
            </span>
          </div>
        </td>
        <td class="num"><strong>${nota ?? "—"}</strong></td>
        <td>
          <div class="barra-mini">
            <span class="${claseDeNota(nota)}" style="width:${Math.max(0, Math.min(100, nota ?? 0))}%"></span>
          </div>
        </td>
        <td>${r
          ? `<span class="badge ${claseDeRiesgo(r.nivel)}">${r.nivel}</span>`
          : '<span class="badge badge-info">Sin datos</span>'}</td>
        <td class="num">${r ? r.porcentaje + "%" : "—"}</td>
      </tr>`;
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
        <div class="panel-riesgo ${nivelACaja(r.nivel)}">
          <div class="pr-cab">
            <h3>Predicción del modelo</h3>
            <span class="badge ${claseDeRiesgo(r.nivel)}">Riesgo ${r.nivel}</span>
          </div>
          <div class="pr-cifra">
            <span class="grande" style="color:${colorRiesgo(r.nivel)}">${r.porcentaje}%</span>
            <span class="txt">de probabilidad de reprobar el curso</span>
          </div>
          <div class="medidor">
            <span style="width:${r.porcentaje}%;background:${colorRiesgo(r.nivel)}"></span>
          </div>
          <p class="pr-etq">Datos que recibió el modelo</p>
          <ul class="pr-factores">${r.factores.map(f => `<li>${escapar(f)}</li>`).join("")}</ul>
          <p class="nota-vista">
            El modelo solo usó las primeras ${r.evaluacionesVistas} evaluaciones
            (resaltadas abajo). Las demás no las vio.
          </p>
          <div id="zona-redaccion"></div>
        </div>` : `
        <div class="panel-riesgo leve">
          <div class="pr-cab"><h3>Sin predicción</h3></div>
          <p class="cargando">El modelo necesita al menos 3 evaluaciones y hay ${d.tareas.length}.</p>
        </div>`;

      const filas = d.tareas.map(t => `
        <tr style="${t.vistaPorElModelo ? "background:#F0FDFA" : ""}">
          <td>
            <strong>${escapar(t.nombre)}</strong>
            ${t.vistaPorElModelo
              ? '<span class="badge badge-info" style="margin-left:8px">vista por el modelo</span>' : ""}
          </td>
          <td>${escapar(t.tipo || "—")}</td>
          <td class="num">${t.pesoEnLaNota ?? "—"}%</td>
          <td class="num"><strong>${t.entregada ? t.porcentajeObtenido + "%" : "—"}</strong></td>
          <td>${formatearFecha(t.fechaLimite)}</td>
          <td>${!t.entregada
            ? '<span class="badge badge-error">No entregada</span>'
            : (t.atrasada ? '<span class="badge badge-warning">Tardía</span>'
                          : '<span class="badge badge-success">A tiempo</span>')}</td>
        </tr>`).join("");

      vista.innerHTML = `
        <div class="ficha">
          <div class="ficha-cab">
            <span class="ini ${r && r.nivel !== "BAJO" ? "riesgo" : ""}">${escapar(iniciales(d.estudiante.nombre, d.estudiante.apellido))}</span>
            <div>
              <h2>${escapar(d.estudiante.nombre)} ${escapar(d.estudiante.apellido)}</h2>
              <p>${escapar(d.clase.nombre)} · va con <strong>${d.notaActual ?? "—"}</strong> sobre 100
                 (${d.aprobando ? "aprobando" : "reprobando"})</p>
            </div>
          </div>
        </div>
        ${panelRiesgo}
        <div class="caja-tabla">
          <div class="scroll-x">
            <table class="estudiantes" style="min-width:720px">
              <thead>
                <tr>
                  <th>Evaluación</th><th>Tipo</th>
                  <th class="num">Vale</th><th class="num">Obtuvo</th>
                  <th>Fecha límite</th><th>Entrega</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </div>
        </div>`;

      // Las filas de esta tabla no navegan a ningún lado
      vista.querySelectorAll("tbody tr").forEach(tr => { tr.style.cursor = "default"; });

      if (r) montarRedaccion(idEst, idClase);
    } catch (e) { error(e); }
  }

  // =======================================================================
  // Atajo — Todos los estudiantes en riesgo, de todas las clases
  // =======================================================================
  async function verEnRiesgo() {
    marcarNav("nav-riesgo");
    pintarMiga([{ texto: "Mis clases", accion: verClases }, { texto: "Estudiantes en riesgo" }]);
    cargando("Revisando todas tus clases...");

    try {
      if (!clasesCache.length) {
        clasesCache = (await API.clasesDelDocente(usuario.id)).clases;
      }

      const porClase = await Promise.all(
        clasesCache.map(c => API.estudiantesDeClase(c.id).catch(() => null))
      );

      const enRiesgo = [];
      for (const datos of porClase) {
        if (!datos) continue;
        for (const e of datos.estudiantes) {
          if (e.riesgo && e.riesgo.nivel !== "BAJO") {
            enRiesgo.push({ ...e, clase: datos.clase });
          }
        }
      }
      enRiesgo.sort((a, b) => b.riesgo.probabilidad - a.riesgo.probabilidad);

      if (!enRiesgo.length) {
        vista.innerHTML = `
          <div class="cab-vista"><div><h2>Estudiantes en riesgo</h2></div></div>
          <div class="caja-tabla"><div class="vacio">
            <i class="ph ph-check-circle"></i>Ningún estudiante en riesgo en tus clases.
          </div></div>`;
        return;
      }

      vista.innerHTML = `
        <div class="cab-vista">
          <div>
            <h2>Estudiantes en riesgo</h2>
            <p>${enRiesgo.length} en total, de todas tus clases · los más urgentes primero</p>
          </div>
        </div>
        <div class="caja-tabla">
          <div class="scroll-x">
            <table class="estudiantes">
              <thead>
                <tr>
                  <th>Estudiante</th><th>Clase</th>
                  <th class="num">Nota</th><th>Riesgo</th><th class="num">Probabilidad</th>
                </tr>
              </thead>
              <tbody>${enRiesgo.map(e => `
                <tr data-est="${e.id}" data-nombre="${escapar(e.nombre + " " + e.apellido)}"
                    data-clase="${e.clase.id}" data-clasenom="${escapar(e.clase.nombre)}">
                  <td>
                    <div class="celda-persona">
                      <span class="ini riesgo">${escapar(iniciales(e.nombre, e.apellido))}</span>
                      <span class="nom">${escapar(e.nombre)} ${escapar(e.apellido)}</span>
                    </div>
                  </td>
                  <td>${escapar(e.clase.nombre)}</td>
                  <td class="num"><strong>${e.notaActual ?? "—"}</strong></td>
                  <td><span class="badge ${claseDeRiesgo(e.riesgo.nivel)}">${e.riesgo.nivel}</span></td>
                  <td class="num">${e.riesgo.porcentaje}%</td>
                </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>`;

      vista.querySelectorAll("tbody tr").forEach(tr => {
        tr.addEventListener("click", () =>
          verDetalle(tr.dataset.est, tr.dataset.nombre, tr.dataset.clase, tr.dataset.clasenom));
      });
    } catch (e) { error(e); }
  }

  // =======================================================================
  // Redacción con Gemini — opcional, y separada de la predicción
  // =======================================================================
  // El bloque de arriba ya mostró lo que decidió el Random Forest. Esto solo
  // agrega la explicación en prosa. Sin clave configurada el botón no aparece:
  // la pantalla sigue siendo útil sin él.
  function montarRedaccion(idEst, idClase) {
    const zona = document.getElementById("zona-redaccion");
    if (!zona || !geminiDisponible) return;

    zona.innerHTML = `
      <button class="btn btn-primary btn-sm" id="btn-redactar" style="margin-top:16px">
        <i class="ph-fill ph-magic-wand"></i> Redactar informe para el docente
      </button>`;

    document.getElementById("btn-redactar").addEventListener("click", async (ev) => {
      const boton = ev.currentTarget;
      boton.disabled = true;
      boton.innerHTML = '<i class="ph ph-circle-notch"></i> Redactando...';

      try {
        const d = await API.recomendacion(idEst, idClase);
        zona.innerHTML = `
          <div class="informe">
            <p class="etq">Informe redactado</p>
            <p class="cuerpo">${escapar(d.redaccion.resumen)}</p>
            <p class="pr-etq">Acciones sugeridas</p>
            <ul>${d.redaccion.acciones.map(a => `<li>${escapar(a)}</li>`).join("")}</ul>
            <p class="pie">El nivel de riesgo lo determinó el modelo entrenado. Este texto solo lo explica.</p>
          </div>`;
      } catch (e) {
        zona.innerHTML = `<p class="aviso-error" style="margin-top:14px">${escapar(e.message)}</p>`;
      }
    });
  }

  // Preguntamos una sola vez si Gemini está configurado.
  let geminiDisponible = false;
  API.salud().then(s => { geminiDisponible = s.gemini; }).catch(() => {});

  document.getElementById("nav-clases").addEventListener("click", verClases);
  document.getElementById("nav-riesgo").addEventListener("click", verEnRiesgo);

  verClases();
});
