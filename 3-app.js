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

// Convierte "Tomate " en "tomatoes" (minúsculas, sin espacios sobrantes)
function traducirIngrediente(texto) {
  const limpio = texto.trim().toLowerCase();
  const traducido = diccionario[limpio] || limpio;
  return traducido.replace(/\s+/g, "_"); // la API usa guiones bajos
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
    if (nombre && !ingredientes.includes(nombre)) {
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
   La ruta gratuita filter.php?i= solo acepta UN ingrediente.
   Así que pedimos una lista por cada ingrediente y luego contamos
   en cuántas listas sale cada receta: las que más veces salen van primero. */
async function buscarRecetas() {
  // Si el usuario escribió algo y no pulsó "Añadir", lo añadimos ahora
  if (campoIngrediente.value.trim()) {
    añadirIngredientes(campoIngrediente.value);
    campoIngrediente.value = "";
  }
  if (ingredientes.length === 0) {
    mensaje.textContent = "Añade al menos un ingrediente 🙂";
    listaRecetas.innerHTML = "";
    return;
  }

  mensaje.textContent = "Buscando recetas...";
  listaRecetas.innerHTML = "";

  try {
    // Una petición por ingrediente, todas a la vez
    const respuestas = await Promise.all(
      ingredientes.map(function (nombre) {
        const url = URL_API + "filter.php?i=" + encodeURIComponent(traducirIngrediente(nombre));
        return fetch(url).then(function (r) { return r.json(); });
      })
    );

    // Contamos coincidencias por receta: { idReceta: {receta, coincidencias} }
    const cuenta = {};
    respuestas.forEach(function (respuesta) {
      (respuesta.meals || []).forEach(function (receta) {
        if (!cuenta[receta.idMeal]) {
          cuenta[receta.idMeal] = { receta: receta, coincidencias: 0 };
        }
        cuenta[receta.idMeal].coincidencias++;
      });
    });

    // Ordenamos: primero las que usan más ingredientes tuyos
    const resultados = Object.values(cuenta).sort(function (a, b) {
      return b.coincidencias - a.coincidencias;
    });

    if (resultados.length === 0) {
      mensaje.textContent = "No encontré recetas. Prueba con otros ingredientes (o en inglés).";
      return;
    }

    mensaje.textContent = "";
    dibujarRecetas(resultados.slice(0, 24)); // máximo 24 para que sea ligero
  } catch (error) {
    mensaje.textContent = "Algo falló al buscar. Revisa tu conexión e inténtalo otra vez.";
  }
}

botonBuscar.addEventListener("click", buscarRecetas);

/* ===== 6. DIBUJAR LA LISTA DE RECETAS ===== */
function dibujarRecetas(resultados) {
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
    coincidencias.textContent = "Usa " + item.coincidencias + " de " + ingredientes.length + " de tus ingredientes";

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
          const ingles = traducirIngrediente(mio).replace(/_/g, " ");
          return ingrediente.toLowerCase().includes(ingles.replace(/s$/, ""));
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
