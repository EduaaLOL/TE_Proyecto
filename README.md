# Sistema Predictivo de Rendimiento Académico

Detecta a mitad de curso qué estudiantes van camino a reprobar, usando un modelo
de machine learning entrenado con el historial de calificaciones.

## Estructura

```
backend/   API en Python (FastAPI). Lee MongoDB Atlas y sirve las predicciones.
ml/        El modelo: entrenamiento, modelo entrenado y cálculo de variables.
web/       Interfaz (HTML/CSS/JS). No toca la base directo, todo pasa por la API.
docs/      Documentación de diseño y los archivos originales de la interfaz.
```

**Por qué el backend está en Python:** el modelo es Python. Si la API estuviera
en Node harían falta dos servidores hablándose por HTTP; así el modelo vive en
el mismo proceso y predecir es una llamada a función en vez de una de red.

## Cómo correrlo

**1. Instalar (solo la primera vez)**

```bash
pip install -r backend/requirements.txt
```

Copiar `backend/.env.example` como `backend/.env` y poner las credenciales de Atlas.

**2. Arrancar el servidor**

```bash
cd backend
python -m uvicorn app:app --reload --port 3001
```

Documentación interactiva de la API en http://localhost:3001/docs — sirve para
probar cualquier endpoint sin escribir código.

**3. Abrir la interfaz**

Abrir `web/login.html` en el navegador. Pide un ID de docente o de estudiante;
la pantalla de acceso trae seis usuarios reales de la base para probar rápido.

## Usuarios de prueba

| Rol | Nombre | ID |
|---|---|---|
| Docente | Luis Flores — Programación I, Bases de Datos | `6a9cd740f89babdc05b2cfa8` |
| Docente | Ana Castellanos — Literatura Española, Redacción | `6a9cd740f89babdc05b2cfa7` |
| Docente | Elena Martínez — Psicología General, Sociología | `6a9cd740f89babdc05b2cfa9` |
| Estudiante | David Rivas — en dificultades (43.7) | `6a9cdb16f89babdc05b2cfea` |
| Estudiante | Omar Quintanilla — mixto (68.2) | `6a9cdb16f89babdc05b2d014` |
| Estudiante | Luis Hernandez — buen rendimiento (87.9) | `6a9cdb16f89babdc05b2cfda` |

## El modelo

```bash
python ml/entrenar_modelo.py
```

Lee el historial de Mongo, entrena, y guarda `ml/modelo_riesgo.joblib` con las
métricas en `ml/reporte_entrenamiento.json`.

Predice si un estudiante reprobará el curso viendo **solo las 3 primeras
evaluaciones** de las 6. Random Forest, F1 en validación cruzada **0.842**.

`ml/caracteristicas.py` define cómo se calculan las 5 variables y lo importan
**tanto el entrenamiento como la API**: así el modelo recibe al predecir
exactamente los mismos números que vio al aprender.

## La IA generativa (opcional)

El sistema funciona completo sin esto. Lo único que se pierde es la redacción
en prosa; el modelo sigue prediciendo y la interfaz sigue mostrando los factores.

Para activarla: sacar una clave gratis en https://aistudio.google.com/apikey y
ponerla en `backend/.env` como `GEMINI_API_KEY=...`. El botón "Redactar informe"
aparece solo cuando la clave está configurada.

**La división de trabajo es lo importante:**

> El Random Forest **decide** el riesgo. Gemini únicamente lo **redacta**.

Gemini nunca ve la pregunta "¿este estudiante reprueba?". Recibe el veredicto ya
tomado y los datos que lo produjeron, y su trabajo es explicarlo en lenguaje claro
y proponer acciones. Si le dejáramos estimar el riesgo, el modelo entrenado
sobraría y estaríamos presentando la API de Google como si fuera nuestro
machine learning.

La clave vive en el servidor, nunca en el navegador.

**Detalle que costó encontrar:** no se manda `thinkingConfig`. Poner
`thinkingBudget: 0` ahorra latencia pero los modelos "lite" lo rechazan con
HTTP 400 — justo los que se usan de respaldo cuando el principal está saturado.

## Datos de prueba

```bash
cd backend
npm install    # solo la primera vez
npm run seed
```

Es el único pedazo que sigue en Node. Genera tareas y calificaciones realistas
y es idempotente: correrlo varias veces no duplica nada. **Ojo:** re-generarlo
cambia los IDs de la tabla de arriba.

## Estado

| Pieza | Estado |
|---|---|
| Base de datos (MongoDB Atlas) | Funcionando |
| API en Python + modelo en proceso | Funcionando |
| Modelo entrenado | Random Forest, F1 CV 0.842 |
| Login por ID, une docente y estudiante | Funcionando |
| Interfaz conectada a datos reales | Funcionando, sin datos fijos |
| Redacción con IA generativa (Gemini) | Funcionando (~10 s por informe) |
