// seed-calificaciones.js — Genera Tareas y Calificaciones realistas para las
// clases que ya tienen estudiantes matriculados, respetando el validador de
// esquema real de Atlas (Tareas.Tipo enum, Calificaciones.PorcentajeCalificacion
// 0-100 en vez de puntos crudos).
//
// A cada combinación estudiante-clase se le asigna un perfil de rendimiento
// (excelencia / normal / bajo), igual que el generador del proyecto de
// graduación. El perfil "bajo" empeora a propósito con el tiempo —entregas
// más tarde, porcentaje más bajo, cada vez más actividades sin entregar—
// para que CU-06/07/09 (predicción, factores, recomendación) tengan una
// tendencia real que detectar, no solo un promedio bajo parejo.
//
// Idempotente: antes de sembrar, borra únicamente las Tareas (y sus
// Calificaciones) que ESTE script insertó en una corrida anterior —nunca
// toca matrícula, Docentes, Estudiantes, ni el registro huérfano de otra
// clase que ya existía—. Correrlo varias veces no duplica nada.
//
// Uso: npm run seed   (desde la carpeta backend/)

require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

// Tipo debe ser uno de "Foro" | "Tarea" | "Prueba" -- así lo exige el
// validador de Atlas en la colección Tareas.
const PLANTILLA_TAREAS = [
  { nombre: "Tarea 1",          tipo: "Tarea",  ponderacion: 10, semanasAtras: 6 },
  { nombre: "Taller en Clase",  tipo: "Foro",   ponderacion: 10, semanasAtras: 5 },
  { nombre: "Tarea 2",          tipo: "Tarea",  ponderacion: 15, semanasAtras: 4 },
  { nombre: "Prueba Parcial 1", tipo: "Prueba", ponderacion: 25, semanasAtras: 3 },
  { nombre: "Proyecto Corto",   tipo: "Tarea",  ponderacion: 15, semanasAtras: 2 },
  { nombre: "Prueba Parcial 2", tipo: "Prueba", ponderacion: 25, semanasAtras: 1 },
]; // Ponderacion suma 100 -- como un curso real ponderado sobre 100

function elegirPerfil() {
  const r = Math.random();
  if (r < 0.20) return "excelencia";
  if (r < 0.70) return "normal";
  return "bajo";
}

function ruido(base, rango) {
  return base + (Math.random() * 2 - 1) * rango;
}

/**
 * Decide qué pasó con UNA tarea para UN estudiante, según su perfil.
 * PorcentajeCalificacion es 0-100 -- independiente de Ponderacion, que solo
 * dice cuánto vale esa tarea dentro del curso (eso se combina después, al
 * calcular el promedio de la clase).
 */
function generarEntrega(perfil, indiceTarea, fechaLimite) {
  let pct, probAtraso, probFalta;

  if (perfil === "excelencia") {
    pct = ruido(93, 5);
    probAtraso = 0.05;
    probFalta = 0.02;
  } else if (perfil === "normal") {
    pct = ruido(75, 8);
    probAtraso = 0.20;
    probFalta = 0.08;
  } else {
    // "bajo": empeora conforme avanza el curso, no es un promedio bajo parejo
    const avance = indiceTarea / (PLANTILLA_TAREAS.length - 1); // 0 -> 1
    pct = ruido(62 - avance * 34, 6); // ~62% al inicio -> ~28% al final
    probAtraso = 0.40;
    probFalta = 0.15 + avance * 0.20; // hasta ~35% de probabilidad al final
  }

  const fechaBase = new Date(fechaLimite);

  if (Math.random() < probFalta) {
    // El validador exige FechaEntrega como fecha real (no admite null aquí),
    // así que la "no entrega" se registra como 0% con una observación
    // explícita -- sigue siendo visible tanto en el panel como para Gemini.
    return { porcentaje: 0, fechaEntregaReal: fechaBase, observaciones: "No entregada" };
  }

  const porcentaje = Math.max(15, Math.min(100, Math.round(pct)));

  const atrasada = Math.random() < probAtraso;
  const fechaEntregaReal = new Date(fechaBase);
  if (atrasada) {
    fechaEntregaReal.setDate(fechaEntregaReal.getDate() + 1 + Math.floor(Math.random() * 4));
  } else {
    fechaEntregaReal.setDate(fechaEntregaReal.getDate() - Math.floor(Math.random() * 2));
  }

  let observaciones;
  if (perfil === "excelencia" && Math.random() < 0.3) observaciones = "Excelente trabajo";
  else if (perfil === "bajo" && atrasada) observaciones = "Entrega tardía";

  return { porcentaje, fechaEntregaReal, observaciones };
}

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  console.log(`Conectado a "${process.env.DB_NAME}"`);

  // ---------- 1. Solo las clases que ya tienen estudiantes matriculados ----------
  const clases = await db.collection("Clases").find({}).toArray();
  const conteos = await db.collection("Estudiantes").aggregate([
    { $unwind: "$ClasesMatriculadas" },
    { $group: { _id: "$ClasesMatriculadas", total: { $sum: 1 } } },
  ]).toArray();
  const idsConEstudiantes = new Set(conteos.filter(c => c.total > 0).map(c => String(c._id)));
  const clasesObjetivo = clases.filter(c => idsConEstudiantes.has(String(c._id)));
  console.log(`Clases con estudiantes matriculados: ${clasesObjetivo.length} de ${clases.length} (las demás se dejan tal cual, no tienen a quién calificar)`);

  // ---------- 2. Limpieza idempotente: SOLO lo que este script sembró antes ----------
  // Importante: filtramos por Clase Y por Nombre exacto de la plantilla.
  // Filtrar solo por Clase fue el bug que borró tareas de un compañero que
  // vivían en la misma clase -- esto asegura que nunca tocamos nada que no
  // hayamos insertado nosotros mismos.
  const idsClasesObjetivo = clasesObjetivo.map(c => c._id);
  const nombresPlantilla = PLANTILLA_TAREAS.map(t => t.nombre);
  const tareasPrevias = await db.collection("Tareas")
    .find({ Clase: { $in: idsClasesObjetivo }, Nombre: { $in: nombresPlantilla } })
    .project({ _id: 1 })
    .toArray();
  const idsTareasPrevias = tareasPrevias.map(t => t._id);
  if (idsTareasPrevias.length) {
    const { deletedCount: borradasCal } = await db.collection("Calificaciones").deleteMany({ Tarea: { $in: idsTareasPrevias } });
    const { deletedCount: borradasTar } = await db.collection("Tareas").deleteMany({ _id: { $in: idsTareasPrevias } });
    console.log(`Limpieza de una corrida anterior: ${borradasTar} tareas y ${borradasCal} calificaciones borradas.`);
  }

  // ---------- 3. Armar Tareas por clase (una tanda de 6, igual en todas) ----------
  const ahora = new Date();
  const todasLasTareas = [];
  const tareasPorClase = {};

  for (const clase of clasesObjetivo) {
    const tareas = PLANTILLA_TAREAS.map(t => {
      const fecha = new Date(ahora);
      fecha.setDate(fecha.getDate() - t.semanasAtras * 7);
      return {
        _id: new ObjectId(),
        Nombre: t.nombre,
        Tipo: t.tipo,
        Clase: clase._id,
        Ponderacion: t.ponderacion,
        FechaEntrega: fecha,
      };
    });
    tareasPorClase[String(clase._id)] = tareas;
    todasLasTareas.push(...tareas);
  }
  await db.collection("Tareas").insertMany(todasLasTareas);
  console.log(`Tareas insertadas: ${todasLasTareas.length}`);

  // ---------- 4. Armar Calificaciones: un perfil por estudiante-clase ----------
  const todasLasCalificaciones = [];
  const conteoPerfiles = { excelencia: 0, normal: 0, bajo: 0 };

  for (const clase of clasesObjetivo) {
    const estudiantes = await db.collection("Estudiantes").find({ ClasesMatriculadas: clase._id }).toArray();
    const tareas = tareasPorClase[String(clase._id)];

    for (const estudiante of estudiantes) {
      const perfil = elegirPerfil();
      conteoPerfiles[perfil]++;

      tareas.forEach((tarea, indice) => {
        const entrega = generarEntrega(perfil, indice, tarea.FechaEntrega);
        const doc = {
          Estudiante: estudiante._id,
          Tarea: tarea._id,
          PorcentajeCalificacion: entrega.porcentaje,
          FechaEntrega: entrega.fechaEntregaReal,
        };
        if (entrega.observaciones) doc.Observaciones = entrega.observaciones;
        todasLasCalificaciones.push(doc);
      });
    }
  }
  await db.collection("Calificaciones").insertMany(todasLasCalificaciones);
  console.log(`Calificaciones insertadas: ${todasLasCalificaciones.length}`);
  console.log(`Perfiles asignados por estudiante-clase -> excelencia: ${conteoPerfiles.excelencia} | normal: ${conteoPerfiles.normal} | bajo: ${conteoPerfiles.bajo}`);

  await client.close();
  console.log("Listo.");
})().catch(e => {
  console.error("ERROR:", e.message);
  if (e.errInfo) console.error("Detalle del validador:", JSON.stringify(e.errInfo, null, 2));
  process.exit(1);
});
