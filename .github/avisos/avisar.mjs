// Avisa al equipo, en Telegram y Discord, cada cambio que alguien sube al repositorio.
// Lo corre GitHub Actions (ver .github/workflows/avisos.yml). No es parte de la app.
//
// Modos:
//   node .github/avisos/avisar.mjs cambio   -> aviso de un push (usa el evento de GitHub)
//   node .github/avisos/avisar.mjs semana   -> resumen de los últimos 7 días
//   PRUEBA=1 ...                            -> no envía nada, solo imprime el mensaje
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const MODO = process.argv[2] || "cambio";
const PRUEBA = process.env.PRUEBA === "1";
const REPO = process.env.GITHUB_REPOSITORY || "";
const URL_REPO = `https://github.com/${REPO}`;
const equipo = JSON.parse(fs.readFileSync(new URL("./equipo.json", import.meta.url), "utf8"));

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 20e6 }).trim();

// ---------- Quién es quién ----------
function persona(nombre, correo) {
  const clave = (correo || "").toLowerCase();
  const encontrado = equipo.integrantes.find(
    (p) => (p.correos || []).some((c) => c.toLowerCase() === clave) || (p.alias || []).includes(nombre),
  );
  return encontrado?.nombre || nombre || "Alguien";
}

// ---------- IA opcional ----------
// Sirve cualquier servicio compatible con OpenAI (Gemini, Groq, OpenAI, etc.).
// Se configura con tres secretos del repo: IA_URL, IA_KEY e IA_MODELO.
// Sin ellos, el aviso usa las frases fijas de PARTES (abajo), que no necesitan IA.
async function explicarConIA(instruccion, contenido) {
  const { IA_URL, IA_KEY, IA_MODELO } = process.env;
  if (!IA_URL || !IA_KEY || !IA_MODELO) return null;
  try {
    const r = await fetch(IA_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${IA_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: IA_MODELO,
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          { role: "system", content: equipo.contexto + "\n\n" + instruccion },
          { role: "user", content: contenido },
        ],
      }),
    });
    const texto = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${texto.slice(0, 120)}`);
    return JSON.parse(texto).choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.log(`La IA no respondió, se usa el aviso sin IA. ${error.message}`);
    return null;
  }
}

// ---------- Aviso sin IA: qué es cada archivo, en palabras simples ----------
const PARTES = [
  [/^datos\/reportes\.json$/, "los registros de campo", "Analista de campo"],
  [/^datos\/vias\.json$/, "las cuadras de la zona y su tipo de vía", "Analista de campo"],
  [/^fotos\//, "las fotos pixeladas", "Analista de campo"],
  [/^datos\/criterios\.json$/, "los pesos y niveles de la criticidad", "Ingeniero de lógica"],
  [/^criticidad\.js$/, "el cálculo de la criticidad", "Ingeniero de lógica"],
  [/^cuadras\.js$/, "cómo se asigna la cuadra a cada reporte", "Ingeniero de lógica"],
  [/^filtros\.js$/, "los filtros del tablero", "Ingeniero de lógica"],
  [/^resumen\.js$/, "el resumen operativo (top 5 de cuadras y recomendaciones)", "Ingeniero de lógica"],
  [/^mapa\.js$/, "el mapa y el mapa de calor", "Integrador del mapa"],
  [/^captura\.js$/, "el formulario de reporte y el tablero", "Diseñador de interfaz"],
  [/^index\.html$/, "la estructura de las pantallas", "Diseñador de interfaz"],
  [/^styles\.css$/, "los colores y el diseño", "Diseñador de interfaz"],
  [/^README\.md$/, "el README", "Documentador"],
  [/^documentos\//, "los documentos de entrega", "Documentador"],
  [/^\.github\//, "los avisos automáticos del equipo", "Apoyo técnico"],
];

function describirArchivos(archivos) {
  const partes = new Map();
  for (const archivo of archivos) {
    const [, que, rol] = PARTES.find(([patron]) => patron.test(archivo)) ?? [null, archivo, "Sin rol"];
    if (!partes.has(que)) partes.set(que, rol);
  }
  return [...partes.entries()].map(([que, rol]) => `• ${que} (${rol})`).join("\n");
}

// ---------- Envío ----------
const escaparHTML = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function enviar({ titulo, cuerpo, enlace, textoEnlace }) {
  const telegram = `<b>${escaparHTML(titulo)}</b>\n\n${escaparHTML(cuerpo)}\n\n<a href="${enlace}">${escaparHTML(textoEnlace)}</a>`;
  const discord = `**${titulo}**\n\n${cuerpo}\n\n[${textoEnlace}](<${enlace}>)`;

  if (PRUEBA) {
    console.log("---- Telegram ----\n" + telegram + "\n---- Discord ----\n" + discord);
    return;
  }

  let enviados = 0;
  const { TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, DISCORD_WEBHOOK } = process.env;
  if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: telegram.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true }),
    });
    console.log(`Telegram: ${r.status}`);
    enviados += r.ok ? 1 : 0;
  }
  if (DISCORD_WEBHOOK) {
    const r = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Avisos del equipo", content: discord.slice(0, 1990) }),
    });
    console.log(`Discord: ${r.status}`);
    enviados += r.ok ? 1 : 0;
  }
  if (!TELEGRAM_TOKEN && !DISCORD_WEBHOOK) {
    console.log("No hay canales configurados (faltan los secretos). Mensaje que se habría enviado:\n" + discord);
  }
  return enviados;
}

// ---------- Aviso de un cambio ----------
async function avisarCambio() {
  const evento = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const commits = (evento.commits || []).filter((c) => c.distinct !== false);
  if (commits.length === 0) return console.log("Push sin commits nuevos.");

  const antes = /^0+$/.test(evento.before || "") ? `${evento.after}~${commits.length}` : evento.before;
  let archivos = "", diff = "";
  try {
    archivos = git("diff", "--stat=100", antes, evento.after);
    diff = git("diff", "--unified=2", antes, evento.after, "--", ".", ":(exclude)*.png", ":(exclude)*.ico", ":(exclude)*.jpg");
  } catch (error) {
    console.log("No se pudo leer el diff:", error.message);
  }

  const autores = [...new Set(commits.map((c) => persona(c.author?.name, c.author?.email)))];
  const mensajes = commits.map((c) => `- ${c.message.split("\n")[0]}`).join("\n");

  const explicacion = await explicarConIA(
    `Explica este cambio para estudiantes de 16 a 19 años que no saben programar.
Escribe en español de Colombia, tuteando, en 2 a 4 frases cortas y sin palabras técnicas.
Di qué cambió en la app o en los documentos y para qué sirve, no cómo está programado.
Si el cambio afecta un requerimiento del reto (RF-01 a RF-06, casos de uso o entregables), agrega una línea que empiece con "⚠️" diciendo cuál y por qué.
Termina con una línea "Rol: ..." con el rol del equipo al que le toca esa parte.
No inventes nada que no esté en el cambio.`,
    `Mensajes de los commits:\n${mensajes}\n\nArchivos:\n${archivos}\n\nCambios (puede estar recortado):\n${diff.slice(0, 14000)}`,
  );

  let nombres = [];
  try {
    nombres = git("diff", "--name-only", antes, evento.after).split("\n").filter(Boolean);
  } catch {}
  const cuerpo =
    explicacion ||
    `Lo que dice el cambio:\n${mensajes}\n\nPartes del proyecto que tocó:\n${describirArchivos(nombres) || "no se pudo leer"}`;
  const plural = commits.length === 1 ? "un cambio" : `${commits.length} cambios`;
  await enviar({
    titulo: `🔔 ${autores.join(" y ")} subió ${plural} al proyecto`,
    cuerpo,
    enlace: evento.compare || `${URL_REPO}/commit/${evento.after}`,
    textoEnlace: "Ver el cambio en GitHub",
  });
}

// ---------- Resumen de la semana ----------
async function resumirSemana() {
  const registro = git("log", "--since=7 days ago", "--no-merges", "--format=%an|%ae|%ad|%s", "--date=format:%a %d %b");
  const lineas = registro ? registro.split("\n") : [];
  const porPersona = new Map();
  for (const linea of lineas) {
    const [nombre, correo, fecha, ...resto] = linea.split("|");
    const quien = persona(nombre, correo);
    if (!porPersona.has(quien)) porPersona.set(quien, []);
    porPersona.get(quien).push(`${fecha}: ${resto.join("|")}`);
  }

  const conteo = [...porPersona.entries()].map(([quien, lista]) => `• ${quien}: ${lista.length} cambio(s)`).join("\n");
  const sinAportes = equipo.integrantes.map((p) => p.nombre).filter((n) => !porPersona.has(n));

  const explicacion = lineas.length
    ? await explicarConIA(
        `Haz el resumen semanal del proyecto para estudiantes de 16 a 19 años, en español sencillo de Colombia.
Máximo 6 frases: qué avanzó esta semana y qué parece faltar según los requisitos del reto.
No pongas nombres de archivos ni palabras técnicas. No inventes avances.`,
        [...porPersona.entries()].map(([q, l]) => `${q}:\n${l.join("\n")}`).join("\n\n"),
      )
    : null;

  const cuerpo = [
    lineas.length ? conteo : "Esta semana nadie subió cambios al repositorio.",
    sinAportes.length ? `Sin cambios esta semana: ${sinAportes.join(", ")}. Recuerden que el profesor revisa el historial de cada uno.` : "",
    explicacion || "",
  ].filter(Boolean).join("\n\n");

  await enviar({ titulo: "📋 Resumen de la semana", cuerpo, enlace: `${URL_REPO}/commits/main`, textoEnlace: "Ver todo el historial" });
}

await (MODO === "semana" ? resumirSemana() : avisarCambio());
