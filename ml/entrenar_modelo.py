"""
entrenar_modelo.py — Entrena un clasificador de riesgo académico con datos reales de Mongo.

QUÉ PREDICE (etiqueta):
    Si el estudiante reprueba la clase, calculado con su nota final ponderada
    de las 6 evaluaciones (< 60 = reprueba).

CON QUÉ LO PREDICE (variables):
    SOLO las 3 primeras evaluaciones del curso. El modelo nunca ve las
    últimas 3, de las cuales sale la etiqueta.

POR QUÉ ASÍ:
    Es lo que el sistema necesita responder de verdad: "a mitad de curso,
    ¿quién va camino a reprobar?" (CU-04 del diagrama). Además evita dos
    errores que invalidarían el modelo:
      - Fuga de datos: si entrenáramos con las 6 y predijéramos la nota
        final, el modelo solo estaría sumando, no prediciendo.
      - Circularidad: si predijéramos el perfil (excelencia/normal/bajo)
        que el generador de datos asignó, el modelo solo redescubriría las
        reglas con las que se generaron las notas.

Uso:  python ml/entrenar_modelo.py
"""

from pathlib import Path
import json
import sys

# La consola de Windows usa cp1252 por defecto: revienta con los acentos y con
# el caracter de bloque de las barras. Forzamos UTF-8 para que el reporte se
# lea bien; errors="replace" garantiza que nunca vuelva a tumbar el script.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient
import os

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
)
import joblib

# El calculo de las variables vive en caracteristicas.py, compartido con el
# backend. Asi el modelo recibe exactamente los mismos numeros al entrenar y
# al predecir -- si cada lado tuviera su copia, podrian separarse en silencio.
from caracteristicas import (
    VARIABLES, TAREAS_VISIBLES, NOTA_APROBACION,
    calcular_variables, calcular_nota_final,
)

RAIZ = Path(__file__).resolve().parent.parent
SEMILLA = 42                  # para que los resultados sean reproducibles


def cargar_datos():
    """Arma un DataFrame con una fila por combinación estudiante-clase."""
    load_dotenv(RAIZ / "backend" / ".env")
    cliente = MongoClient(os.environ["MONGODB_URI"])
    db = cliente[os.environ.get("DB_NAME", "AplicativoEducativo")]

    tareas = {t["_id"]: t for t in db.Tareas.find({})}
    clases = {c["_id"]: c for c in db.Clases.find({})}

    # Agrupamos las calificaciones por (estudiante, clase)
    grupos = {}
    for cal in db.Calificaciones.find({}):
        tarea = tareas.get(cal["Tarea"])
        if not tarea:
            continue  # calificación huérfana: su tarea ya no existe
        clave = (cal["Estudiante"], tarea["Clase"])
        grupos.setdefault(clave, []).append({
            "pct": cal.get("PorcentajeCalificacion"),
            "ponderacion": tarea.get("Ponderacion", 0),
            "fecha_limite": tarea.get("FechaEntrega"),
            "fecha_entrega": cal.get("FechaEntrega"),
            "observaciones": cal.get("Observaciones", ""),
        })

    filas = []
    for (id_estudiante, id_clase), evaluaciones in grupos.items():
        # Solo sirven los casos con el curso completo: necesitamos las 3
        # primeras para las variables y las 6 para saber si reprobó.
        if len(evaluaciones) < 6:
            continue

        # Las variables salen SOLO de las 3 primeras (mismo calculo que usa la
        # API al predecir); la etiqueta sale de las 6.
        variables = calcular_variables(evaluaciones)
        nota_final = calcular_nota_final(evaluaciones)

        filas.append({
            "estudiante": str(id_estudiante),
            "clase": clases.get(id_clase, {}).get("NombreClase", str(id_clase)),
            **variables,
            "nota_final": nota_final,
            "reprobo": int(nota_final < NOTA_APROBACION),
        })

    cliente.close()
    return pd.DataFrame(filas)


def evaluar(nombre, modelo, X_entrena, X_prueba, y_entrena, y_prueba, X, y):
    modelo.fit(X_entrena, y_entrena)
    pred = modelo.predict(X_prueba)

    cv = cross_val_score(
        modelo, X, y,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=SEMILLA),
        scoring="f1",
    )

    metricas = {
        "exactitud": accuracy_score(y_prueba, pred),
        "precision": precision_score(y_prueba, pred, zero_division=0),
        "exhaustividad": recall_score(y_prueba, pred, zero_division=0),
        "f1": f1_score(y_prueba, pred, zero_division=0),
        "f1_validacion_cruzada_media": float(cv.mean()),
        "f1_validacion_cruzada_desviacion": float(cv.std()),
    }

    print(f"\n{'=' * 62}")
    print(f"  {nombre}")
    print(f"{'=' * 62}")
    print(f"  Exactitud (accuracy)      : {metricas['exactitud']:.3f}")
    print(f"  Precisión                 : {metricas['precision']:.3f}")
    print(f"  Exhaustividad (recall)    : {metricas['exhaustividad']:.3f}")
    print(f"  F1                        : {metricas['f1']:.3f}")
    print(f"  F1 en validación cruzada  : {cv.mean():.3f} (±{cv.std():.3f})")

    print("\n  Matriz de confusión (filas = real, columnas = predicho):")
    mc = confusion_matrix(y_prueba, pred)
    print(f"                 pred: aprueba   pred: reprueba")
    print(f"    real aprueba      {mc[0][0]:>6}          {mc[0][1]:>6}")
    print(f"    real reprueba     {mc[1][0]:>6}          {mc[1][1]:>6}")

    print("\n" + classification_report(
        y_prueba, pred, target_names=["aprueba", "reprueba"], zero_division=0
    ))

    return metricas


def main():
    print("Leyendo datos de MongoDB...")
    df = cargar_datos()

    if df.empty:
        print("No se encontraron casos con las 6 evaluaciones completas. ¿Corriste el seed?")
        return

    print(f"Casos (estudiante-clase) con curso completo: {len(df)}")
    print(f"  Reprobaron: {int(df['reprobo'].sum())}  |  Aprobaron: {int((1 - df['reprobo']).sum())}")
    print(f"  Nota final promedio: {df['nota_final'].mean():.1f}")

    # Muestra de la tabla real que ve el modelo. Las 5 primeras columnas son la
    # pregunta (salen SOLO de las 3 primeras evaluaciones); "reprobo" es la
    # respuesta (sale de las 6). "nota final" se imprime para poder verificar a
    # ojo que la etiqueta esta bien calculada -- el modelo NO la recibe.
    print(f"\n{'=' * 62}")
    print("  LA TABLA QUE APRENDE EL MODELO (6 casos al azar)")
    print(f"{'=' * 62}")
    muestra = df.sample(min(6, len(df)), random_state=SEMILLA)[VARIABLES + ["nota_final", "reprobo"]]
    muestra = muestra.rename(columns={
        "promedio_parcial": "promedio", "tendencia": "tend",
        "entregas_tardias": "tarde", "no_entregadas": "sin ent",
        "puntos_acumulados": "puntos", "nota_final": "NOTA FIN", "reprobo": "REPROBO",
    })
    print(muestra.to_string(index=False, float_format=lambda v: f"{v:.1f}"))
    print("  <-------- lo que ve el modelo -------->  <-- la respuesta -->")

    X = df[VARIABLES]
    y = df["reprobo"]

    X_entrena, X_prueba, y_entrena, y_prueba = train_test_split(
        X, y, test_size=0.25, stratify=y, random_state=SEMILLA
    )
    print(f"\nEntrenamiento: {len(X_entrena)} casos  |  Prueba: {len(X_prueba)} casos")

    regresion = Pipeline([
        ("escalado", StandardScaler()),
        ("modelo", LogisticRegression(max_iter=1000, random_state=SEMILLA)),
    ])
    bosque = RandomForestClassifier(n_estimators=200, random_state=SEMILLA)

    m_regresion = evaluar("REGRESIÓN LOGÍSTICA", regresion, X_entrena, X_prueba, y_entrena, y_prueba, X, y)
    m_bosque = evaluar("RANDOM FOREST", bosque, X_entrena, X_prueba, y_entrena, y_prueba, X, y)

    print(f"\n{'=' * 62}")
    print("  QUÉ VARIABLE PESA MÁS (según Random Forest)")
    print(f"{'=' * 62}")
    for variable, peso in sorted(
        zip(VARIABLES, bosque.feature_importances_), key=lambda p: -p[1]
    ):
        barra = "█" * int(peso * 40)
        print(f"  {variable:<20} {peso:.3f}  {barra}")

    # Guardamos el mejor modelo (por F1 de validación cruzada) y las métricas
    mejor_nombre, mejor_modelo, mejor_metricas = max(
        [("regresion_logistica", regresion, m_regresion), ("random_forest", bosque, m_bosque)],
        key=lambda t: t[2]["f1_validacion_cruzada_media"],
    )

    salida = Path(__file__).resolve().parent
    joblib.dump(mejor_modelo, salida / "modelo_riesgo.joblib")

    reporte = {
        "modelo_elegido": mejor_nombre,
        "casos_totales": len(df),
        "reprobaron": int(df["reprobo"].sum()),
        "variables": VARIABLES,
        "evaluaciones_vistas_por_el_modelo": TAREAS_VISIBLES,
        "nota_de_aprobacion": NOTA_APROBACION,
        "metricas": {"regresion_logistica": m_regresion, "random_forest": m_bosque},
        "importancia_variables": dict(zip(VARIABLES, bosque.feature_importances_.tolist())),
    }
    with open(salida / "reporte_entrenamiento.json", "w", encoding="utf-8") as f:
        json.dump(reporte, f, indent=2, ensure_ascii=False)

    print(f"\nModelo guardado: ml/modelo_riesgo.joblib  (ganó {mejor_nombre})")
    print("Métricas guardadas: ml/reporte_entrenamiento.json")


if __name__ == "__main__":
    main()
