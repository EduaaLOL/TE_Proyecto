"""
caracteristicas.py — Cómo se calculan las variables del modelo. UN SOLO LUGAR.

Este módulo lo importan los dos lados:
    ml/entrenar_modelo.py  — para armar la tabla con la que aprende
    backend/app.py         — para predecir en vivo

Y tiene que ser uno solo. Si el entrenamiento calculara "promedio_parcial" de
una forma y la API de otra, el modelo recibiría números que no significan lo
mismo que los que aprendió, y devolvería predicciones sin sentido *sin que
ningún error lo delate*. Ese tipo de bug es de los más difíciles de encontrar,
así que lo hacemos imposible: hay una sola definición y las dos partes la usan.
"""

import numpy as np

# El orden importa: es el orden de columnas con el que se entrenó el modelo.
VARIABLES = [
    "promedio_parcial",
    "tendencia",
    "entregas_tardias",
    "no_entregadas",
    "puntos_acumulados",
]

TAREAS_VISIBLES = 3   # cuántas evaluaciones ve el modelo (de 6)
NOTA_APROBACION = 60  # bajo esto se considera reprobado


def calcular_variables(evaluaciones):
    """Calcula las 5 variables a partir de las PRIMERAS evaluaciones del curso.

    evaluaciones: lista de dicts con las llaves
        pct            -- % que sacó el estudiante en esa tarea (0-100)
        ponderacion    -- cuánto vale esa tarea dentro del curso
        fecha_limite   -- cuándo se debía entregar
        fecha_entrega  -- cuándo entregó de verdad (o None)

    Devuelve un dict con las 5 variables, o None si todavía no hay suficientes
    evaluaciones para opinar.
    """
    if len(evaluaciones) < TAREAS_VISIBLES:
        return None

    ordenadas = sorted(evaluaciones, key=lambda e: e["fecha_limite"])
    primeras = ordenadas[:TAREAS_VISIBLES]
    pcts = [e["pct"] for e in primeras]

    return {
        # Cómo le está yendo, sin más
        "promedio_parcial": float(np.mean(pcts)),

        # Pendiente de la recta que mejor pasa por las 3 notas: negativa = cayendo.
        # Un 70 que viene en picada es peor señal que un 65 estable.
        "tendencia": float(np.polyfit(range(len(pcts)), pcts, 1)[0]),

        # Señales de conducta, no de conocimiento
        "entregas_tardias": sum(
            1 for e in primeras
            if e["fecha_entrega"] and e["fecha_limite"] and e["fecha_entrega"] > e["fecha_limite"]
        ),
        "no_entregadas": sum(1 for e in primeras if e["pct"] == 0),

        # Puntos del curso ya asegurados: no es lo mismo fallar un 10% que un 25%
        "puntos_acumulados": sum(e["pct"] * e["ponderacion"] for e in primeras) / 100,
    }


def calcular_nota_final(evaluaciones):
    """Suma ponderada de TODAS las evaluaciones. Las ponderaciones suman 100."""
    return sum(e["pct"] * e["ponderacion"] for e in evaluaciones) / 100


def nota_parcial_actual(evaluaciones):
    """Nota sobre 100 considerando solo lo evaluado hasta ahora.

    Distinto de puntos_acumulados: eso son puntos del curso completo (si van 35
    de ponderación, el máximo posible es 35). Esto reescala a 0-100 para poder
    mostrarlo como "va en 72", que es como lo lee una persona.
    """
    peso_total = sum(e["ponderacion"] for e in evaluaciones)
    if peso_total == 0:
        return None
    return sum(e["pct"] * e["ponderacion"] for e in evaluaciones) / peso_total
