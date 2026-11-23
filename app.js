/* ==========================================================
   QUÉ COCINO HOY - app.js
   ÍNDICE
   1. Referencias al HTML
   2. Datos de la app (variables)
   3. Diccionario castellano -> inglés
   4. Añadir y quitar ingredientes (etiquetas)
   5. Buscar recetas en la API
   6. Dibujar la lista de recetas
   7. Ver el detalle de una receta
   8. Ventana: abrir y cerrar
   9. Arranque
   ========================================================== */

/* ===== 1. REFERENCIAS AL HTML =====
   Guardamos los elementos de la página en variables para usarlos luego. */
const formularioIngredientes = document.getElementById("formulario-ingredientes");
const campoIngrediente = document.getElementById("campo-ingrediente");
const listaEtiquetas = document.getElementById("lista-etiquetas");
const botonBuscar = document.getElementById("boton-buscar");
const mensaje = document.getElementById("mensaje");
const listaRecetas = document.getElementById("lista-recetas");
const ventana = document.getElementById("ventana");
const detalleReceta = document.getElementById("detalle-receta");
const botonCerrar = document.getElementById("boton-cerrar");

/* ===== 2. DATOS DE LA APP ===== */
// Dirección base de la API gratuita (no necesita clave)
const URL_API = "https://www.themealdb.com/api/json/v1/1/";

// Lista de ingredientes que ha escrito el usuario (tal como los escribió)
let ingredientes = [];

/* ===== 3. DICCIONARIO CASTELLANO -> INGLÉS =====
   La API solo entiende inglés. Si el ingrediente está aquí, lo traducimos;
   si no, lo enviamos tal cual (por si ya lo escribió en inglés). */
const diccionario = {
  "pollo": "chicken",
  "pechuga de pollo": "chicken_breast",
  "tomate": "tomatoes",
  "tomates": "tomatoes",
  "arroz": "rice",
  "huevo": "eggs",
  "huevos": "eggs",
  "cebolla": "onions",
  "ajo": "garlic",
  "patata": "potatoes",
  "patatas": "potatoes",
  "queso": "cheese",
  "leche": "milk",
  "mantequilla": "butter",
  "carne": "beef",
  "ternera": "beef",
  "cerdo": "pork",
  "cordero": "lamb",
  "pescado": "fish",
  "salmon": "salmon",
  "salmón": "salmon",
  "atun": "tuna",
  "atún": "tuna",
  "gambas": "prawns",
  "pasta": "pasta",
  "espagueti": "spaghetti",
  "espaguetis": "spaghetti",
  "pan": "bread",
  "zanahoria": "carrots",
  "zanahorias": "carrots",
  "pimiento": "red_pepper",
  "champiñones": "mushrooms",
  "champiñon": "mushrooms",
  "setas": "mushrooms",
  "limon": "lemon",
  "limón": "lemon",
  "aceite": "olive_oil",
  "aceite de oliva": "olive_oil",
  "nata": "double_cream",
  "harina": "flour",
  "azucar": "sugar",
  "azúcar": "sugar",
  "chocolate": "chocolate",
  "platano": "banana",
  "plátano": "banana",
  "manzana": "apples",
  "lentejas": "lentils",
  "garbanzos": "chickpeas",
  "judias": "green_beans",
  "judías": "green_beans",
  "espinacas": "spinach",
  "calabacin": "courgettes",
  "calabacín": "courgettes",
  "jamon": "ham",
  "jamón": "ham",
  "bacon": "bacon",
  "salchichas": "sausages",
  "yogur": "yogurt",
  "coco": "coconut_milk",
  "maiz": "sweetcorn",
  "maíz": "sweetcorn",
  "guisantes": "peas"
};

// Todas las comparaciones comparten la misma normalización.
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[_\s]+/g, " ");
}

const traducciones = Object.fromEntries(
  Object.entries(diccionario).map(([es, en]) => [normalizar(es), en])
);

// Una familia puede tener varios nombres exactos en la base de recetas.
// No buscamos solo por título: consultamos los ingredientes de cada familia.
const familias = {
  pasta: ["spaghetti", "macaroni", "penne_rigate", "penne_pasta", "tagliatelle", "fettuccine", "lasagne_sheets", "linguine_pasta"],
  macarrones: ["macaroni", "penne_rigate", "penne_pasta"],
  espaguetis: ["spaghetti"],
  huevos: ["eggs", "egg"],
  pollo: ["chicken", "chicken_breast", "chicken_breasts", "chicken_thighs"],
  arroz: ["rice", "basmati_rice", "long_grain_rice", "arborio_rice", "brown_rice"],
  queso: ["cheese", "cheddar_cheese", "parmesan_cheese", "mozzarella"],
  tomate: ["tomatoes", "tomato", "chopped_tomatoes", "cherry_tomatoes"],
  cebolla: ["onions", "onion", "red_onions", "spring_onions"],
  pimiento: ["red_pepper", "green_pepper", "yellow_pepper", "red_bell_pepper"],
  patata: ["potatoes", "potato"]
};
const alias = {
  macarron: "macarrones", macaroni: "macarrones", penne: "macarrones",
  espagueti: "espaguetis", spaghetti: "espaguetis", espaguetti: "espaguetis",
  huevo: "huevos", egg: "huevos", eggs: "huevos", pollos: "pollo",
  arroces: "arroz", quesos: "queso", tomates: "tomate", cebollas: "cebolla",
  pimientos: "pimiento", patatas: "patata", papas: "patata", papa: "patata",
  tortillas: "tortilla", ensaladas: "ensalada"
};
const platos = { tortilla: "omelette", ensalada: "salad" };

function claveIngrediente(texto) {
  const limpio = normalizar(texto);
  if (alias[limpio]) return alias[limpio];
  if (traducciones[limpio] || familias[limpio] || platos[limpio]) return limpio;
  // Solo singularizamos si el singular existe en el diccionario.
  for (const singular of [limpio.replace(/es$/, ""), limpio.replace(/s$/, "")]) {
    if (traducciones[singular] || familias[singular]) return singular;
  }
  return limpio;
}

function traducirIngrediente(texto) {
  const clave = claveIngrediente(texto);
  return (traducciones[clave] || clave).replace(/\s+/g, "_");
}

function ingredientesAPI(texto) {
  const clave = claveIngrediente(texto);
  return familias[clave] || [traducirIngrediente(clave)];
}

// Las promesas se comparten entre sinónimos y búsquedas repetidas.
const cacheAPI = new Map();
function consultarAPI(ruta) {
  if (!cacheAPI.has(ruta)) {
    const peticion = fetch(URL_API + ruta, { signal: AbortSignal.timeout(15000) })
      .then(function (r) {
        if (!r.ok) throw new Error("API " + r.status);
        return r.json();
      }).catch(function (error) {
        cacheAPI.delete(ruta); // permite reintentar tras un fallo de conexión
        throw error;
      });
    cacheAPI.set(ruta, peticion);
  }
  return cacheAPI.get(ruta);
}

async function recetasPara(texto) {
  const clave = claveIngrediente(texto);
  const rutas = platos[clave]
    ? ["search.php?s=" + encodeURIComponent(platos[clave])]
    : ingredientesAPI(texto).map(i => "filter.php?i=" + encodeURIComponent(i));
  const respuestas = await Promise.allSettled(rutas.map(consultarAPI));
  const recetas = new Map();
  let fallos = 0;
  respuestas.forEach(function (respuesta) {
    if (respuesta.status === "rejected") { fallos++; return; }
    (respuesta.value.meals || []).forEach(receta => recetas.set(receta.idMeal, receta));
  });
  return { recetas: [...recetas.values()], fallos: fallos, consultas: rutas.length };
}

function coincideIngrediente(ingrediente, mio) {
  if (platos[claveIngrediente(mio)]) return false;
  const limpio = normalizar(ingrediente);
  return ingredientesAPI(mio).some(i => normalizar(i) === limpio);
}

/* ===== 4. AÑADIR Y QUITAR INGREDIENTES ===== */

// Dibuja las etiquetas (chips) según la lista "ingredientes"
function dibujarEtiquetas() {
  listaEtiquetas.innerHTML = "";
  ingredientes.forEach(function (nombre, posicion) {
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta";
    etiqueta.textContent = nombre;

    const botonBorrar = document.createElement("button");
    botonBorrar.className = "etiqueta-borrar";
    botonBorrar.type = "button";
    botonBorrar.textContent = "✕";
    botonBorrar.setAttribute("aria-label", "Quitar " + nombre);
    botonBorrar.addEventListener("click", function () {
      ingredientes.splice(posicion, 1); // quita este ingrediente
      dibujarEtiquetas();
    });

    etiqueta.appendChild(botonBorrar);
    listaEtiquetas.appendChild(etiqueta);
  });
}

// Añade lo escrito en el campo (admite varios separados por comas)
function añadirIngredientes(texto) {
  texto.split(",").forEach(function (trozo) {
    const nombre = trozo.trim().toLowerCase();
    if (nombre && !ingredientes.some(i => claveIngrediente(i) === claveIngrediente(nombre))) {
      ingredientes.push(nombre);
    }
  });
  dibujarEtiquetas();
}

// Al pulsar "Añadir" o Enter
formularioIngredientes.addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue
  añadirIngredientes(campoIngrediente.value);
  campoIngrediente.value = "";
});

/* ===== 5. BUSCAR RECETAS EN LA API =====
   Unimos variantes de cada ingrediente, sin contar dos veces una receta.
   Tortilla y ensalada se aceptan como platos, no como ingredientes. */
async function buscarRecetas() {
  if (botonBuscar.disabled) return;
  if (campoIngrediente.value.trim()) {
    añadirIngredientes(campoIngrediente.value);
    campoIngrediente.value = "";
  }
  if (ingredientes.length === 0) {
    mensaje.textContent = "Añade al menos un ingrediente 🙂";
    listaRecetas.innerHTML = "";
    return;
  }
  const buscados = ingredientes.slice();
  botonBuscar.disabled = true;
  mensaje.textContent = "Buscando recetas...";
  listaRecetas.innerHTML = "";

  try {
    const respuestas = await Promise.all(buscados.map(recetasPara));
    // Si cambian las etiquetas mientras llega la API, no mostramos datos antiguos.
    if (JSON.stringify(buscados) !== JSON.stringify(ingredientes)) {
      mensaje.textContent = "Has cambiado la búsqueda. Pulsa Buscar recetas.";
      return;
    }
    const cuenta = new Map();
    respuestas.forEach(function (respuesta) {
      respuesta.recetas.forEach(function (receta) {
        if (!cuenta.has(receta.idMeal)) cuenta.set(receta.idMeal, { receta, coincidencias: 0 });
        cuenta.get(receta.idMeal).coincidencias++;
      });
    });
    const resultados = [...cuenta.values()].sort((a, b) =>
      b.coincidencias - a.coincidencias || a.receta.strMeal.localeCompare(b.receta.strMeal));
    const fallos = respuestas.reduce((n, r) => n + r.fallos, 0);
    if (!resultados.length) {
      mensaje.textContent = fallos
        ? "No se pudo completar la búsqueda. Comprueba tu conexión y vuelve a intentarlo."
        : "No encontré recetas para esa búsqueda. Prueba con otro ingrediente o plato.";
      return;
    }
    const sonPlatos = buscados.some(i => platos[claveIngrediente(i)]);
    mensaje.textContent = resultados.length + " recetas encontradas" +
      (resultados.length > 24 ? " · Mostrando las primeras 24." : ".") +
      (fallos ? " Algunos resultados no se pudieron cargar. Puedes reintentar." : "");
    dibujarRecetas(resultados.slice(0, 24), sonPlatos);
  } catch (error) {
    mensaje.textContent = "Algo falló al buscar. Revisa tu conexión e inténtalo otra vez.";
  } finally {
    botonBuscar.disabled = false;
  }
}

botonBuscar.addEventListener("click", buscarRecetas);

/* ===== 6. DIBUJAR LA LISTA DE RECETAS ===== */
function dibujarRecetas(resultados, sonPlatos = false) {
  listaRecetas.innerHTML = "";
  resultados.forEach(function (item) {
    const tarjeta = document.createElement("button");
    tarjeta.className = "tarjeta";
    tarjeta.type = "button";

    const foto = document.createElement("img");
    foto.className = "tarjeta-foto";
    foto.src = item.receta.strMealThumb + "/medium"; // versión ligera de la foto
    foto.alt = item.receta.strMeal;
    foto.loading = "lazy";

    const nombre = document.createElement("h3");
    nombre.className = "tarjeta-nombre";
    nombre.textContent = item.receta.strMeal;

    const coincidencias = document.createElement("p");
    coincidencias.className = "tarjeta-coincidencias";
    coincidencias.textContent = sonPlatos
      ? "Coincide con " + item.coincidencias + " de " + ingredientes.length + " términos"
      : "Usa " + item.coincidencias + " de " + ingredientes.length + " de tus ingredientes";

    tarjeta.append(foto, nombre, coincidencias);
    tarjeta.addEventListener("click", function () {
      verDetalle(item.receta.idMeal);
    });
    listaRecetas.appendChild(tarjeta);
  });
}

/* ===== 7. VER EL DETALLE DE UNA RECETA =====
   Usamos lookup.php?i=ID, que devuelve ingredientes e instrucciones. */
async function verDetalle(idReceta) {
  detalleReceta.innerHTML = "<p class='mensaje'>Cargando receta...</p>";
  abrirVentana();

  try {
    const respuesta = await fetch(URL_API + "lookup.php?i=" + idReceta);
    const datos = await respuesta.json();
    const receta = datos.meals[0];

    // La API da hasta 20 ingredientes en campos strIngredient1..20 y strMeasure1..20
    let htmlIngredientes = "";
    for (let i = 1; i <= 20; i++) {
      const ingrediente = receta["strIngredient" + i];
      const medida = receta["strMeasure" + i];
      if (ingrediente && ingrediente.trim()) {
        // ¿Es uno de los que tiene el usuario? Lo marcamos en verde
        const loTengo = ingredientes.some(function (mio) {
          return coincideIngrediente(ingrediente, mio);
        });
        htmlIngredientes += "<li" + (loTengo ? " class='lo-tengo'" : "") + ">" +
          escaparHtml((medida || "").trim() + " " + ingrediente.trim()) +
          (loTengo ? " ✓" : "") + "</li>";
      }
    }

    detalleReceta.innerHTML =
      "<img class='detalle-foto' src='" + receta.strMealThumb + "' alt='" + escaparHtml(receta.strMeal) + "'>" +
      "<div class='detalle-cuerpo'>" +
        "<h2>" + escaparHtml(receta.strMeal) + "</h2>" +
        "<p class='detalle-datos'>" + escaparHtml(receta.strCategory || "") + " · " + escaparHtml(receta.strArea || "") + "</p>" +
        "<h3>Ingredientes</h3>" +
        "<ul class='detalle-ingredientes'>" + htmlIngredientes + "</ul>" +
        "<h3>Preparación</h3>" +
        "<p class='detalle-instrucciones'>" + escaparHtml(receta.strInstructions) + "</p>" +
        "<p class='nota-idioma'>Las instrucciones vienen en inglés desde la API.</p>" +
      "</div>";
  } catch (error) {
    detalleReceta.innerHTML = "<p class='mensaje'>No se pudo cargar la receta.</p>";
  }
}

// Evita que un texto de la API rompa nuestro HTML (seguridad básica)
function escaparHtml(texto) {
  const auxiliar = document.createElement("div");
  auxiliar.textContent = texto;
  return auxiliar.innerHTML;
}

/* ===== 8. VENTANA: ABRIR Y CERRAR ===== */
function abrirVentana() {
  ventana.classList.remove("oculto");
  document.body.style.overflow = "hidden"; // bloquea el scroll del fondo
}
function cerrarVentana() {
  ventana.classList.add("oculto");
  document.body.style.overflow = "";
}
botonCerrar.addEventListener("click", cerrarVentana);
// Cerrar al tocar fuera de la caja blanca
ventana.addEventListener("click", function (evento) {
  if (evento.target === ventana) cerrarVentana();
});

/* ===== 9. ARRANQUE ===== */
mensaje.textContent = "Añade ingredientes y pulsa Buscar.";
