const STEP_META = [
  ["Tu contexto", "Paso 1 de 6"],
  ["Barrera y biotipo", "Paso 2 de 6"],
  ["Tono y respuesta solar", "Paso 3 de 6"],
  ["Colorimetría", "Paso 4 de 6"],
  ["Sensibilidades", "Paso 5 de 6"],
  ["Objetivo de rutina", "Paso 6 de 6"]
];

const SENSITIVITY_TERMS = {
  fragrance: ["fragrance", "parfum", "perfume", "fragancia", "linalool", "limonene", "citral", "eugenol"],
  preservatives: ["methylisothiazolinone", "methylchloroisothiazolinone", "mit", "mci", "dmdm", "formaldehyde", "formaldehido", "quaternium-15"],
  dyes: ["ppd", "p-phenylenediamine", "colorante", "tinte"],
  latex: ["latex", "caucho"],
  nickel: ["nickel", "níquel"],
  botanicals: ["aceite esencial", "essential oil", "extracto", "limonene", "linalool"]
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  }[character]));
}

function normalise(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function selectedValue(root, name, fallback = "") {
  return root.querySelector(`input[name="${name}"]:checked`)?.value || fallback;
}

function selectedValues(root, name) {
  return [...root.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function productText(product) {
  return normalise([
    product.name,
    product.line,
    product.label,
    product.description,
    product.use,
    ...(product.ingredients || []),
    product.inci || "",
    ...(product.benefits || [])
  ].join(" "));
}

function hasDeclaredSensitivity(product, sensitivities) {
  const text = productText(product);
  return sensitivities.some((sensitivity) => (SENSITIVITY_TERMS[sensitivity] || []).some((term) => text.includes(normalise(term))));
}

function scoreProduct(product, profile) {
  const text = productText(product);
  let score = 0;
  const goals = {
    hidratacion: ["hidrat", "hialuron", "urea", "pantenol"],
    luminosidad: ["luminos", "antioxid", "kombucha", "vitamina"],
    textura: ["retinol", "bakuchiol", "regener", "repar"],
    limpieza: ["limpieza", "higiene", "micelar"],
    barrera: ["suave", "pantenol", "hidrat", "repar"],
    ojos: ["pestana", "ceja", "ojo"]
  };
  const skinSignals = {
    seca: ["hidrat", "urea", "seca", "repar"],
    mixta: ["limpieza", "equilibr", "liger"],
    grasa: ["limpieza", "liger", "higiene"],
    reactiva: ["suave", "limpieza", "pantenol"],
    nosegura: []
  };

  (goals[profile.goal] || []).forEach((term) => { if (text.includes(term)) score += 3; });
  (skinSignals[profile.skin] || []).forEach((term) => { if (text.includes(term)) score += 1; });
  if (product.line === "Green Line" && ["reactiva", "mixta", "grasa"].includes(profile.skin)) score += 1;
  if (product.line === "Hydra 10" && profile.skin === "seca") score += 2;
  return score;
}

function getProfile(root) {
  return {
    skin: selectedValue(root, "dermoSkin", "nosegura"),
    sunResponse: selectedValue(root, "dermoSun", "no-se"),
    tone: selectedValue(root, "dermoTone", "tono-5"),
    undertone: selectedValue(root, "dermoUndertone", "no-se"),
    sensitivities: selectedValues(root, "dermoSensitivity"),
    hasRedFlag: Boolean(root.querySelector("#dermoRedFlag")?.checked),
    goal: selectedValue(root, "dermoGoal", "barrera"),
    saveLocal: Boolean(root.querySelector("#dermoSaveLocal")?.checked)
  };
}

function productCards(products, profile) {
  const candidates = products
    .filter((product) => {
      if (!profile.sensitivities.length) return true;
      return Boolean(product.inci) && !hasDeclaredSensitivity(product, profile.sensitivities);
    })
    .map((product) => ({ product, score: scoreProduct(product, profile) }))
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, 4);

  if (!candidates.length) {
    return '<p class="rounded-[0.25rem] border border-brand-border bg-brand-light p-4 text-xs text-brand-muted">No hay coincidencias para mostrar. Ajusta tus preferencias o pide orientación profesional.</p>';
  }

  return candidates.map(({ product }) => `
    <article class="rounded-[0.5rem] border border-brand-border bg-white p-4 shadow-card">
      <div class="flex items-start gap-3">
        <img class="h-16 w-16 shrink-0 rounded-[0.25rem] border border-brand-border bg-[#fafafa] object-contain p-1" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        <div class="min-w-0">
          <span class="text-[10px] font-bold uppercase tracking-wider text-brand-copper">${escapeHtml(product.line)}</span>
          <h3 class="mt-0.5 text-sm font-bold text-brand-black">${escapeHtml(product.name)}</h3>
          <p class="mt-1 text-[11px] text-brand-muted">${product.inci ? "INCI completo verificado en la ficha oficial." : "El INCI completo aún no está disponible en nuestro catálogo."} Antes de usarlo, realiza una prueba de uso gradual.</p>
          ${product.inciSource ? `<a class="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider text-brand-copper underline" href="${escapeHtml(product.inciSource)}" target="_blank" rel="noopener noreferrer">Ver INCI oficial ↗</a>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

export function mountDermoAssessment({ products, onApplyToStore }) {
  const root = document.querySelector("#view-diagnostico");
  if (!root) return;

  root.innerHTML = `
    <div class="mx-auto w-[min(960px,calc(100%-32px))] px-2 py-10 sm:px-4 sm:py-16">
      <div class="mb-7 rounded-[0.5rem] border border-brand-border bg-brand-light p-4 text-xs leading-relaxed text-brand-muted sm:p-5">
        <p class="font-bold text-brand-black">Evaluación dermocosmética guiada — no sustituye atención médica.</p>
        <p class="mt-1">Este recorrido organiza preferencias de piel, maquillaje y sensibilidades declaradas. No diagnostica alergias ni confirma que un producto sea seguro: para una alergia de contacto se necesita evaluación y patch testing con dermatología.</p>
      </div>

      <div id="dermoProgress" class="mb-8 space-y-2">
        <div class="flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-wider text-brand-subtle">
          <span id="dermoStepCounter">Paso 1 de 6</span>
          <span id="dermoStepName" class="text-right text-brand-copper">Tu contexto</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-brand-border"><div id="dermoProgressBar" class="h-full w-[16.666%] bg-brand-black transition-all duration-500"></div></div>
      </div>

      <div class="rounded-[0.5rem] border border-brand-border bg-white p-5 shadow-card sm:p-10">
        <section id="dermoStep1" class="dermo-step space-y-6">
          <div class="space-y-3">
            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-copper">Tu piel merece contexto</p>
            <h1 class="serif text-3xl font-medium leading-tight text-brand-black sm:text-4xl">Diseñemos una rutina que te escuche antes de recomendarte algo.</h1>
            <p class="max-w-2xl text-sm leading-relaxed text-brand-muted">Exploraremos barrera cutánea, tono, subtono, respuesta solar y sensibilidades. Tú eliges qué guardar en este dispositivo.</p>
          </div>
          <label class="flex items-start gap-3 rounded-[0.25rem] border border-brand-border bg-brand-light p-4 text-xs text-brand-dark">
            <input id="dermoSaveLocal" class="mt-0.5 h-4 w-4 accent-[#111827]" type="checkbox" checked>
            <span><strong>Guardar mi perfil cosmético en este dispositivo.</strong><br>Se usa para recordar tus filtros; no guarda fotografías ni sustituye una ficha médica.</span>
          </label>
        </section>

        <section id="dermoStep2" class="dermo-step hidden space-y-6">
          <div><p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-copper">Barrera y biotipo</p><h2 class="serif mt-1 text-3xl font-medium text-brand-black">¿Qué necesita tu piel la mayor parte de las semanas?</h2><p class="mt-2 text-sm text-brand-muted">No buscamos encasillarte: elige la descripción que más se parece a tu piel hoy.</p></div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="dermo-choice cursor-pointer rounded-[0.5rem] border-2 border-brand-black bg-brand-light p-5"><input class="sr-only" type="radio" name="dermoSkin" value="seca" checked><i data-lucide="droplets" class="text-2xl text-brand-copper"></i><strong class="mt-2 block text-sm text-brand-black">Seca o con barrera frágil</strong><span class="mt-1 block text-xs text-brand-muted">Tirantez, descamación o necesidad de confort.</span></label>
            <label class="dermo-choice cursor-pointer rounded-[0.5rem] border border-brand-border p-5"><input class="sr-only" type="radio" name="dermoSkin" value="mixta"><i data-lucide="scale" class="text-2xl text-brand-copper"></i><strong class="mt-2 block text-sm text-brand-black">Mixta o cambiante</strong><span class="mt-1 block text-xs text-brand-muted">Zonas con brillo y otras equilibradas.</span></label>
            <label class="dermo-choice cursor-pointer rounded-[0.5rem] border border-brand-border p-5"><input class="sr-only" type="radio" name="dermoSkin" value="grasa"><i data-lucide="sparkles" class="text-2xl text-brand-copper"></i><strong class="mt-2 block text-sm text-brand-black">Grasa o con brillo persistente</strong><span class="mt-1 block text-xs text-brand-muted">Prefieres texturas ligeras y limpieza suave.</span></label>
            <label class="dermo-choice cursor-pointer rounded-[0.5rem] border border-brand-border p-5"><input class="sr-only" type="radio" name="dermoSkin" value="reactiva"><i data-lucide="heart-handshake" class="text-2xl text-brand-copper"></i><strong class="mt-2 block text-sm text-brand-black">Reactiva o muy sensible</strong><span class="mt-1 block text-xs text-brand-muted">Ardor, enrojecimiento o molestias con facilidad.</span></label>
          </div>
        </section>

        <section id="dermoStep3" class="dermo-step hidden space-y-6">
          <div><p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-copper">Tono y respuesta solar</p><h2 class="serif mt-1 text-3xl font-medium text-brand-black">Tu tono se observa; tu fototipo se pregunta.</h2><p class="mt-2 text-sm text-brand-muted">La respuesta solar es más útil que el color para orientar protección. El tono visual ayuda a conversar de maquillaje, no define salud ni origen.</p></div>
          <fieldset class="space-y-3"><legend class="text-xs font-bold uppercase tracking-wider text-brand-dark">Cuando te expones al sol sin protección, normalmente…</legend><div class="grid gap-3 sm:grid-cols-3">
            <label class="dermo-choice cursor-pointer rounded-[0.25rem] border-2 border-brand-black bg-brand-light p-4"><input class="sr-only" type="radio" name="dermoSun" value="I-II" checked><strong class="block text-sm text-brand-black">Me quemo con facilidad</strong><span class="mt-1 block text-xs text-brand-muted">Respuesta solar I–II aprox.</span></label>
            <label class="dermo-choice cursor-pointer rounded-[0.25rem] border border-brand-border p-4"><input class="sr-only" type="radio" name="dermoSun" value="III-IV"><strong class="block text-sm text-brand-black">A veces me quemo, a veces me bronceo</strong><span class="mt-1 block text-xs text-brand-muted">Respuesta solar III–IV aprox.</span></label>
            <label class="dermo-choice cursor-pointer rounded-[0.25rem] border border-brand-border p-4"><input class="sr-only" type="radio" name="dermoSun" value="V-VI"><strong class="block text-sm text-brand-black">Rara vez me quemo</strong><span class="mt-1 block text-xs text-brand-muted">Respuesta solar V–VI aprox.</span></label>
          </div></fieldset>
          <fieldset class="space-y-3"><legend class="text-xs font-bold uppercase tracking-wider text-brand-dark">Elige el rango visual que más se acerca a tu tono sin maquillaje</legend><div class="grid grid-cols-5 gap-2 sm:grid-cols-10">
            ${["#f5d7c2", "#edc5a6", "#dca37f", "#c88a68", "#ae7053", "#935941", "#784330", "#603324", "#48241a", "#30170f"].map((colour, index) => `<label class="dermo-tone-choice cursor-pointer rounded-[0.25rem] border-2 ${index === 4 ? "border-brand-black ring-2 ring-brand-light" : "border-transparent"} p-1"><input class="sr-only" type="radio" name="dermoTone" value="tono-${index + 1}" ${index === 4 ? "checked" : ""}><span class="block aspect-square rounded-[0.125rem]" style="background:${colour}" aria-label="Rango de tono ${index + 1}"></span></label>`).join("")}
          </div></fieldset>
        </section>

        <section id="dermoStep4" class="dermo-step hidden space-y-6">
          <div><p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-copper">Colorimetría amable</p><h2 class="serif mt-1 text-3xl font-medium text-brand-black">¿Qué familia te hace sentir más iluminada?</h2><p class="mt-2 text-sm text-brand-muted">Es una brújula estética, no una regla. Selecciona lo que ves en luz natural o lo que te resulta más armonioso.</p></div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="dermo-choice cursor-pointer rounded-[0.5rem] border-2 border-brand-black bg-brand-light p-5"><input class="sr-only" type="radio" name="dermoUndertone" value="frio" checked><span class="h-3 w-full rounded-full bg-gradient-to-r from-sky-300 via-violet-300 to-rose-300 block"></span><strong class="mt-3 block text-sm text-brand-black">Frío</strong><span class="mt-1 block text-xs text-brand-muted">Rosados, malvas, azules o plata suelen gustarte.</span></label>
            <label class="dermo-choice cursor-pointer rounded-[0.5rem] border border-brand-border p-5"><input class="sr-only" type="radio" name="dermoUndertone" value="calido"><span class="h-3 w-full rounded-full bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300 block"></span><strong class="mt-3 block text-sm text-brand-black">Cálido</strong><span class="mt-1 block text-xs text-brand-muted">Duraznos, dorados, terracotas u oro te favorecen.</span></label>
            <label class="dermo-choice cursor-pointer rounded-[0.5rem] border border-brand-border p-5"><input class="sr-only" type="radio" name="dermoUndertone" value="neutro"><span class="h-3 w-full rounded-full bg-gradient-to-r from-slate-300 via-rose-200 to-amber-200 block"></span><strong class="mt-3 block text-sm text-brand-black">Neutro</strong><span class="mt-1 block text-xs text-brand-muted">Encuentras armonía en familias cálidas y frías.</span></label>
            <label class="dermo-choice cursor-pointer rounded-[0.5rem] border border-brand-border p-5"><input class="sr-only" type="radio" name="dermoUndertone" value="oliva"><span class="block h-3 w-full rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-[#8f8a50]"></span><strong class="mt-3 block text-sm text-brand-black">Oliva</strong><span class="mt-1 block text-xs text-brand-muted">Percibes un matiz verdoso-dorado o apagado.</span></label>
          </div>
        </section>

        <section id="dermoStep5" class="dermo-step hidden space-y-6">
          <div><p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-copper">Seguridad antes de comprar</p><h2 class="serif mt-1 text-3xl font-medium text-brand-black">¿Qué ingredientes o categorías prefieres evitar?</h2><p class="mt-2 text-sm text-brand-muted">Marca solo sensibilidades conocidas o sospechadas. Estas preferencias excluyen coincidencias declaradas; si el catálogo no tiene INCI completo, el sistema pedirá revisarlo, no asumirá seguridad.</p></div>
          <div class="grid gap-2 sm:grid-cols-2">
            ${[["fragrance", "flower-2", "Fragancias, parfum o aceites perfumados"], ["preservatives", "flask-conical", "Conservantes como MI/MCI o liberadores de formaldehído"], ["dyes", "palette", "Tintes/colorantes o PPD (especialmente tintura capilar)"], ["latex", "hand", "Látex o caucho"], ["nickel", "atom", "Níquel o metales"], ["botanicals", "leaf", "Extractos botánicos o aceites esenciales"]].map(([value, icon, label]) => `<label class="flex cursor-pointer items-center gap-3 rounded-[0.25rem] border border-brand-border p-3 text-xs text-brand-dark hover:bg-brand-light"><input class="h-4 w-4 accent-[#111827]" type="checkbox" name="dermoSensitivity" value="${value}"><i data-lucide="${icon}" class="text-brand-copper"></i><span>${label}</span></label>`).join("")}
          </div>
          <label class="flex items-start gap-3 rounded-[0.25rem] border border-red-200 bg-red-50 p-4 text-xs text-red-700"><input id="dermoRedFlag" class="mt-0.5 h-4 w-4 accent-red-700" type="checkbox"><span><strong>He tenido hinchazón facial/ocular, urticaria extensa, silbidos al respirar o dificultad respiratoria tras un producto.</strong><br>Si esto ocurre ahora o reaparece, no continúes probando cosméticos: busca atención médica urgente.</span></label>
        </section>

        <section id="dermoStep6" class="dermo-step hidden space-y-6">
          <div><p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-copper">Tu intención de hoy</p><h2 class="serif mt-1 text-3xl font-medium text-brand-black">¿Qué te gustaría que tu rutina te ayudara a sentir?</h2><p class="mt-2 text-sm text-brand-muted">Usaremos esto para priorizar productos del catálogo que luego debes verificar por INCI.</p></div>
          <div class="grid gap-3 sm:grid-cols-2">
            ${[["hidratacion", "droplets", "Confort e hidratación"], ["luminosidad", "sparkles", "Luminosidad y tono uniforme"], ["textura", "moon-star", "Textura y renovación"], ["limpieza", "waves", "Limpieza suave"], ["barrera", "shield-check", "Calmar y cuidar la barrera"], ["ojos", "eye", "Mirada, pestañas y cejas"]].map(([value, icon, label], index) => `<label class="dermo-choice cursor-pointer rounded-[0.5rem] border ${index === 0 ? "border-2 border-brand-black bg-brand-light" : "border-brand-border"} p-4"><input class="sr-only" type="radio" name="dermoGoal" value="${value}" ${index === 0 ? "checked" : ""}><strong class="flex items-center gap-2 text-sm text-brand-black"><i data-lucide="${icon}" class="text-brand-copper"></i>${label}</strong></label>`).join("")}
          </div>
        </section>

        <section id="dermoResult" class="dermo-step hidden space-y-6" aria-live="polite">
          <div id="dermoUrgentNotice" class="hidden rounded-[0.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong>Prioriza atención médica antes de probar o comprar productos.</strong><p class="mt-1">Los síntomas respiratorios o la hinchazón pueden ser graves. Este test no puede evaluar esa reacción.</p></div>
          <div class="rounded-[0.5rem] bg-brand-black p-6 text-white sm:p-8"><p class="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">Tu pasaporte dermocosmético</p><h2 class="serif mt-1 text-3xl font-medium">Una guía para elegir con más calma.</h2><div id="dermoPassport" class="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4"></div></div>
          <div class="rounded-[0.5rem] border border-amber-200 bg-amber-50 p-5 text-xs leading-relaxed text-amber-900"><strong>Tu lista de sensibilidades no equivale a una prueba de alergia.</strong> Para confirmar dermatitis de contacto, dermatología puede indicar patch testing. Al estrenar un cosmético, sigue las instrucciones y prueba primero en una zona pequeña durante 7–10 días; suspende si hay reacción.</div>
          <div><div class="mb-3 flex items-center justify-between gap-3"><div><p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-copper">Selección para revisar</p><h3 class="serif text-2xl font-medium text-brand-black">Fórmulas alineadas con tu objetivo</h3></div><span id="dermoInciCoverage" class="rounded-[0.25rem] bg-brand-light px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">INCI en revisión</span></div><div id="dermoProductReviewList" class="grid gap-3 sm:grid-cols-2"></div></div>
          <div class="flex flex-wrap gap-3"><button id="dermoApplyStore" class="inline-flex items-center gap-2 min-h-[46px] rounded-[0.25rem] bg-brand-black px-6 text-xs font-bold uppercase tracking-wider text-white shadow-card">Filtrar tienda con mi perfil<i data-lucide="arrow-right"></i></button><button id="dermoRestart" class="min-h-[46px] rounded-[0.25rem] border border-brand-border bg-white px-6 text-xs font-bold uppercase tracking-wider text-brand-black">Revisar mis respuestas</button></div>
        </section>

        <div id="dermoControls" class="mt-8 flex justify-between border-t border-brand-border pt-6"><button id="dermoPrev" class="hidden inline-flex items-center gap-2 min-h-[44px] rounded-[0.25rem] border border-brand-border bg-white px-5 text-xs font-bold uppercase tracking-wider text-brand-black"><i data-lucide="arrow-left"></i>Anterior</button><span></span><button id="dermoNext" class="inline-flex items-center gap-2 min-h-[46px] rounded-[0.25rem] bg-brand-black px-7 text-xs font-bold uppercase tracking-wider text-white shadow-card">Comenzar<i data-lucide="arrow-right"></i></button></div>
      </div>
    </div>
  `;

  let step = 1;
  const totalSteps = STEP_META.length;
  const next = root.querySelector("#dermoNext");
  const previous = root.querySelector("#dermoPrev");
  const progress = root.querySelector("#dermoProgress");

  function updateChoiceStyles() {
    root.querySelectorAll(".dermo-choice").forEach((choice) => {
      const checked = choice.querySelector("input")?.checked;
      choice.classList.toggle("border-2", checked);
      choice.classList.toggle("border-brand-black", checked);
      choice.classList.toggle("bg-brand-light", checked);
      choice.classList.toggle("border", !checked);
      choice.classList.toggle("border-brand-border", !checked);
    });
    root.querySelectorAll(".dermo-tone-choice").forEach((choice) => {
      const checked = choice.querySelector("input")?.checked;
      choice.classList.toggle("border-brand-black", checked);
      choice.classList.toggle("ring-2", checked);
      choice.classList.toggle("ring-brand-light", checked);
      choice.classList.toggle("border-transparent", !checked);
    });
  }

  function renderResult() {
    const profile = getProfile(root);
    const labels = {
      seca: "Seca / barrera frágil", mixta: "Mixta", grasa: "Grasa", reactiva: "Reactiva",
      frio: "Frío", calido: "Cálido", neutro: "Neutro", oliva: "Oliva",
      hidratacion: "Hidratación", luminosidad: "Luminosidad", textura: "Textura", limpieza: "Limpieza", barrera: "Barrera", ojos: "Mirada"
    };
    root.querySelector("#dermoPassport").innerHTML = [
      ["Biotipo", labels[profile.skin] || "Por explorar"],
      ["Respuesta solar", profile.sunResponse === "no-se" ? "Por explorar" : `Rango ${profile.sunResponse}`],
      ["Subtono", labels[profile.undertone] || "Por explorar"],
      ["Objetivo", labels[profile.goal] || "Rutina" ]
    ].map(([label, value]) => `<div class="rounded-[0.25rem] bg-white/10 p-3"><span class="block text-[10px] font-bold uppercase text-white/70">${escapeHtml(label)}</span><strong class="mt-1 block text-sm">${escapeHtml(value)}</strong></div>`).join("");
    root.querySelector("#dermoUrgentNotice").classList.toggle("hidden", !profile.hasRedFlag);
    root.querySelector("#dermoProductReviewList").innerHTML = productCards(products, profile);
    const verifiedProducts = products.filter((product) => product.inci).length;
    const coverage = root.querySelector("#dermoInciCoverage");
    coverage.textContent = `${verifiedProducts} INCI verificados`;

    if (profile.saveLocal) {
      const localProfile = {
        skin: profile.skin,
        sunResponse: profile.sunResponse,
        tone: profile.tone,
        undertone: profile.undertone,
        sensitivities: profile.sensitivities,
        goal: profile.goal,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem("exel_dermo_profile_v2", JSON.stringify(localProfile));
    }

    root.querySelector("#dermoApplyStore").onclick = () => {
      if (profile.hasRedFlag) return;
      onApplyToStore(profile);
    };
  }

  function update() {
    root.querySelectorAll(".dermo-step").forEach((section) => section.classList.add("hidden"));
    const showingResult = step > totalSteps;
    if (showingResult) {
      root.querySelector("#dermoResult").classList.remove("hidden");
      progress.classList.add("hidden");
      root.querySelector("#dermoControls").classList.add("hidden");
      renderResult();
      return;
    }

    root.querySelector(`#dermoStep${step}`).classList.remove("hidden");
    progress.classList.remove("hidden");
    root.querySelector("#dermoControls").classList.remove("hidden");
    root.querySelector("#dermoStepCounter").textContent = STEP_META[step - 1][1];
    root.querySelector("#dermoStepName").textContent = STEP_META[step - 1][0];
    root.querySelector("#dermoProgressBar").style.width = `${(step / totalSteps) * 100}%`;
    previous.classList.toggle("hidden", step === 1);
    const nextLabel = step === 1 ? "Comenzar" : step === totalSteps ? "Ver mi pasaporte" : "Siguiente paso";
    next.innerHTML = `${nextLabel}<i data-lucide="arrow-right"></i>`;
  }

  root.querySelectorAll(".dermo-choice input, .dermo-tone-choice input").forEach((input) => input.addEventListener("change", updateChoiceStyles));
  next.addEventListener("click", () => { step += 1; update(); root.scrollIntoView({ behavior: "smooth", block: "start" }); });
  previous.addEventListener("click", () => { step = Math.max(1, step - 1); update(); });
  root.querySelector("#dermoRestart").addEventListener("click", () => { step = 1; update(); root.scrollIntoView({ behavior: "smooth", block: "start" }); });
  updateChoiceStyles();
  update();
}
