/*
 * Электронное меню Fajr Coffee & Breakfast.
 * Всё работает прямо в браузере: язык, тема, «Мой заказ». Сервер не нужен.
 */
(function () {
	"use strict";

	const MENU = window.FAJR_MENU;
	const root = document.documentElement;
	const VARIANT = root.dataset.variant || "classic";
	const LANGS = ["ru", "en", "ar"];

	const UI = {
		ru: {
			title: "Fajr Coffee & Breakfast — меню",
			intro: "Выбирайте блюда — итог посчитается сам. Готовый список покажите официанту.",
			nav: "Разделы меню", myOrder: "Мой заказ",
			showWaiter: "Показать официанту", clear: "Очистить заказ", close: "Закрыть",
			empty: "Пока пусто — нажмите «+» рядом с блюдом",
			approx: "Блюда на вес: точная цена — после взвешивания",
			per100: "за 100 г", perPc: "за 1 шт.", portion: "порция", scoop: "шарик", g: "г",
			add: "Добавить", more: "Больше", less: "Меньше", new: "Новинка",
			toLight: "Светлая тема", toDark: "Тёмная тема", confirmClear: "Очистить весь заказ?",
			address: "Учкекен, ул. Ленина, 89А", hours: "Ежедневно 08:00–22:00",
			demo: "Демонстрационная версия меню. Цены взяты с печатного меню и могут отличаться.",
		},
		en: {
			title: "Fajr Coffee & Breakfast — menu",
			intro: "Pick your dishes — the total adds up by itself. Show the list to your waiter.",
			nav: "Menu sections", myOrder: "My order",
			showWaiter: "Show to waiter", clear: "Clear order", close: "Close",
			empty: "Nothing yet — tap “+” next to a dish",
			approx: "Dishes sold by weight: exact price after weighing",
			per100: "per 100 g", perPc: "each", portion: "portion", scoop: "scoop", g: "g",
			add: "Add", more: "More", less: "Less", new: "New",
			toLight: "Light theme", toDark: "Dark theme", confirmClear: "Clear the whole order?",
			address: "Uchkeken, 89A Lenina St.", hours: "Daily 08:00–22:00",
			demo: "Demo version of the menu. Prices are taken from the printed menu and may differ.",
		},
		ar: {
			title: "Fajr Coffee & Breakfast — القائمة",
			intro: "اختر الأطباق وسيُحسب المجموع تلقائيًا. اعرض القائمة الجاهزة على النادل.",
			nav: "أقسام القائمة", myOrder: "طلبي",
			showWaiter: "اعرضه على النادل", clear: "مسح الطلب", close: "إغلاق",
			empty: "القائمة فارغة — اضغط «+» بجانب الطبق",
			approx: "الأطباق بالوزن: يُحدَّد السعر الدقيق بعد الوزن",
			per100: "لكل 100 غ", perPc: "للقطعة", portion: "حصة", scoop: "كرة", g: "غ",
			add: "أضف", more: "زيادة", less: "نقصان", new: "جديد",
			toLight: "الوضع الفاتح", toDark: "الوضع الداكن", confirmClear: "مسح الطلب بالكامل؟",
			address: "أوتشكيكين، شارع لينين 89أ", hours: "يوميًا 08:00–22:00",
			demo: "نسخة تجريبية من القائمة. الأسعار مأخوذة من القائمة المطبوعة وقد تختلف.",
		},
	};

	const ICON = {
		plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
		minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
		sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
		moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
		bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
	};

	// ---------- хранилище: в приватном режиме может быть недоступно ----------
	const store = {
		get(key, fallback) {
			try {
				const raw = localStorage.getItem(`fajr-${VARIANT}-${key}`);
				return raw === null ? fallback : JSON.parse(raw);
			} catch (e) { return fallback; }
		},
		set(key, value) {
			try { localStorage.setItem(`fajr-${VARIANT}-${key}`, JSON.stringify(value)); } catch (e) { /* без сохранения */ }
		},
	};

	// ---------- все позиции, которые можно заказать ----------
	const lines = new Map(); // ключ строки заказа → { item, variant }
	for (const section of MENU.sections)
		for (const group of section.groups)
			for (const item of group.items)
				if (item.variants) for (const v of item.variants) lines.set(`${item.id}:${v.id}`, { item, variant: v });
				else lines.set(item.id, { item, variant: null });

	let lang = pickLanguage();
	let theme = store.get("theme", "light") === "dark" ? "dark" : "light";
	let order = sanitize(store.get("order", {}));

	function pickLanguage() {
		const saved = store.get("lang", null);
		if (LANGS.includes(saved)) return saved;
		for (const tag of navigator.languages || [navigator.language || ""]) {
			const code = String(tag).slice(0, 2).toLowerCase();
			if (LANGS.includes(code)) return code;
		}
		return "ru";
	}

	function sanitize(saved) {
		const clean = {};
		if (saved && typeof saved === "object")
			for (const [key, qty] of Object.entries(saved))
				if (lines.has(key) && Number.isFinite(qty) && qty > 0) clean[key] = Math.round(qty);
		return clean;
	}

	// ---------- помощники ----------
	const $ = (id) => document.getElementById(id);
	const t = (key) => UI[lang][key];
	const name = (field) => (field && (field[lang] || field.ru)) || "";   // название: запасной — русский
	const only = (field) => (field && field[lang]) || "";                // описание: без подмены языка
	const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
	const isWeight = (key) => lines.get(key).item.unit === "g100";

	function money(value, forLang = lang) {
		const nf = new Intl.NumberFormat(forLang === "ar" ? "ar-u-nu-latn" : forLang, { maximumFractionDigits: 0 });
		return `${nf.format(value)} ₽`;
	}

	function unitLabel(unit) {
		return { g100: t("per100"), pc: t("perPc"), portion: t("portion"), scoop: t("scoop") }[unit] || "";
	}

	function linePrice(key, qty = order[key]) {
		const { item, variant } = lines.get(key);
		const price = variant ? variant.price : item.price;
		return item.unit === "g100" ? (price * qty) / 100 : price * qty;
	}

	// ---------- изменение заказа ----------
	function change(key, dir) {
		const stepSize = isWeight(key) ? 100 : 1;
		const limit = isWeight(key) ? 3000 : 99;
		const next = (order[key] || 0) + dir * stepSize;
		if (next > 0) order[key] = Math.min(next, limit);
		else delete order[key];
		store.set("order", order);
		document.querySelectorAll(`#menu [data-key="${CSS.escape(key)}"]`).forEach((el) => { el.innerHTML = buyInner(key); });
		refreshOrder();
	}

	// ---------- отрисовка меню ----------
	function buyInner(key) {
		const { item, variant } = lines.get(key);
		const price = variant ? variant.price : item.price;
		const unit = unitLabel(item.unit);
		const qty = order[key] || 0;
		const label = esc(name(item.name) + (variant ? ` — ${name(variant.name)}` : ""));
		const priceHtml = `<span class="price" dir="ltr">${money(price)}</span>${unit ? `<span class="unit">${esc(unit)}</span>` : ""}`;

		if (!qty) {
			return `<span class="price-wrap">${priceHtml}</span>
				<button class="add" type="button" data-act="plus" aria-label="${t("add")}: ${label}">${ICON.plus}</button>`;
		}
		const amount = isWeight(key) ? `${qty} ${t("g")}` : String(qty);
		const approx = isWeight(key) ? `<span class="approx" dir="ltr">≈ ${money(linePrice(key, qty))}</span>` : "";
		return `<span class="price-wrap">${priceHtml}${approx}</span>
			<span class="stepper" role="group" aria-label="${label}">
				<button type="button" data-act="minus" aria-label="${t("less")}">${ICON.minus}</button>
				<output aria-live="polite">${amount}</output>
				<button type="button" data-act="plus" aria-label="${t("more")}">${ICON.plus}</button>
			</span>`;
	}

	function priceTag(key) {
		const { item, variant } = lines.get(key);
		const price = variant ? variant.price : item.price;
		const unit = unitLabel(item.unit);
		const qty = order[key] || 0;
		const approx = isWeight(key) && qty ? `<span class="approx" dir="ltr">≈ ${money(linePrice(key, qty))}</span>` : "";
		return `<span class="price-wrap"><span class="price" dir="ltr">${money(price)}</span>${unit ? `<span class="unit">${esc(unit)}</span>` : ""}${approx}</span>`;
	}

	const buy = (key) => `<div class="buy" data-key="${esc(key)}">${buyInner(key)}</div>`;

	function renderItem(item) {
		const photo = item.photo
			? `<img class="item-photo" src="images/dishes/${item.photo}.webp" alt="${esc(name(item.name))}" loading="lazy" decoding="async">`
			: "";
		const badge = item.badge === "new" ? ` <span class="badge">${t("new")}</span>` : "";
		const desc = only(item.desc);
		const body = item.variants
			? `<ul class="variants">${item.variants.map((v) =>
				`<li class="variant"><span class="variant-name">${esc(name(v.name))}</span>${buy(`${item.id}:${v.id}`)}</li>`).join("")}</ul>`
			: buy(item.id);
		return `<article class="item${item.photo ? " has-photo" : ""}${item.variants ? " has-variants" : ""}">
			${photo}
			<div class="item-body">
				<div class="item-text">
					<h4 class="item-name">${esc(name(item.name))}${badge}</h4>
					${desc ? `<p class="item-desc">${esc(desc)}</p>` : ""}
				</div>
				${body}
			</div>
		</article>`;
	}

	function renderGroup(group) {
		const hasPhotos = group.items.some((i) => i.photo);
		return `<div class="group ${hasPhotos ? "group--photos" : "group--list"}">
			${group.title ? `<h3 class="group-title">${esc(name(group.title))}</h3>` : ""}
			${group.cover ? `<img class="cover" src="images/covers/${group.cover}.webp" alt="" loading="lazy" decoding="async">` : ""}
			<div class="items">${group.items.map(renderItem).join("")}</div>
		</div>`;
	}

	function renderMenu() {
		$("nav").innerHTML = MENU.sections
			.map((s) => `<a href="#${s.id}" data-section="${s.id}">${esc(name(s.title))}</a>`).join("");
		$("menu").innerHTML = MENU.sections.map((s) => `
			<section class="section" id="${s.id}" aria-labelledby="h-${s.id}">
				<span class="section-mark" aria-hidden="true">${s.mark}</span>
				<header class="section-head">
					<h2 class="section-title" id="h-${s.id}">${esc(name(s.title))}</h2>
				</header>
				${s.groups.map(renderGroup).join("")}
			</section>`).join("");
		watchSections();
	}

	// ---------- подсветка текущего раздела в навигации ----------
	let observer = null;
	function watchSections() {
		if (observer) observer.disconnect();
		if (!("IntersectionObserver" in window)) return;
		const links = new Map([...$("nav").querySelectorAll("a")].map((a) => [a.dataset.section, a]));
		observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				links.forEach((a) => a.removeAttribute("aria-current"));
				const link = links.get(entry.target.id);
				if (link) {
					link.setAttribute("aria-current", "true");
					link.scrollIntoView({ block: "nearest", inline: "center" });
				}
			}
		}, { rootMargin: "-40% 0px -55% 0px" });
		document.querySelectorAll(".section").forEach((s) => observer.observe(s));
	}

	// ---------- «Мой заказ» ----------
	function refreshOrder() {
		const keys = Object.keys(order);
		const count = keys.reduce((n, key) => n + (isWeight(key) ? 1 : order[key]), 0);
		$("orderbar").hidden = keys.length === 0;
		$("bar-count").textContent = String(count);
		if ($("order-sheet").open) renderOrderLines();
	}

	function renderOrderLines() {
		const keys = Object.keys(order);
		const focused = document.activeElement && document.activeElement.closest("#order-lines [data-key]");
		const focusKey = focused && focused.dataset.key;
		const focusAct = document.activeElement && document.activeElement.dataset.act;

		$("order-lines").innerHTML = keys.length ? keys.map((key) => {
			const { item, variant } = lines.get(key);
			const qty = order[key];
			const amount = isWeight(key) ? `${qty} ${t("g")}` : String(qty);
			return `<div class="line" data-key="${esc(key)}">
				<div class="line-text">
					<span class="line-name">${esc(name(item.name))}</span>
					${variant ? `<span class="line-variant">${esc(name(variant.name))}</span>` : ""}
				</div>
				<span class="stepper" role="group" aria-label="${esc(name(item.name))}">
					<button type="button" data-act="minus" aria-label="${t("less")}">${ICON.minus}</button>
					<output>${amount}</output>
					<button type="button" data-act="plus" aria-label="${t("more")}">${ICON.plus}</button>
				</span>
				${priceTag(key)}
			</div>`;
		}).join("") : `<p class="empty">${t("empty")}</p>`;

		$("approx-note").hidden = !keys.some(isWeight);
		$("show-waiter").disabled = keys.length === 0;
		$("clear-order").hidden = keys.length === 0;

		if (focusKey) {
			const again = document.querySelector(`#order-lines [data-key="${CSS.escape(focusKey)}"] [data-act="${focusAct}"]`);
			if (again) again.focus();
		}
	}

	function openWaiter() {
		const keys = Object.keys(order);
		$("waiter-list").innerHTML = keys.map((key) => {
			const { item, variant } = lines.get(key);
			const qty = order[key];
			const amount = isWeight(key) ? `${qty} г` : `${qty} ×`;
			const ru = item.name.ru + (variant ? ` (${variant.name.ru})` : "");
			const local = lang !== "ru"
				? `<span class="w-local" lang="${lang}" dir="auto">${esc(name(item.name) + (variant ? ` (${name(variant.name)})` : ""))}</span>`
				: "";
			return `<li><span class="w-qty">${amount}</span><span class="w-name">${esc(ru)}${local}</span></li>`;
		}).join("");
		$("order-sheet").close();
		$("waiter").showModal();
	}

	// ---------- язык и тема ----------
	function applyLanguage() {
		root.lang = lang;
		root.dir = lang === "ar" ? "rtl" : "ltr";
		document.title = t("title");
		document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
		$("nav").setAttribute("aria-label", t("nav"));
		document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
		renderMenu();
		refreshOrder();
		applyTheme();
	}

	function applyTheme() {
		root.dataset.theme = theme;
		const btn = $("theme");
		btn.innerHTML = theme === "dark" ? ICON.sun : ICON.moon;
		btn.setAttribute("aria-label", theme === "dark" ? t("toLight") : t("toDark"));
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute("content", getComputedStyle(root).getPropertyValue("--bg").trim() || "#ffffff");
	}

	// ---------- события ----------
	document.addEventListener("click", (event) => {
		const act = event.target.closest("[data-act]");
		if (act) {
			const holder = act.closest("[data-key]");
			if (holder) change(holder.dataset.key, act.dataset.act === "plus" ? 1 : -1);
			return;
		}
		const langBtn = event.target.closest("[data-lang]");
		if (langBtn && langBtn.dataset.lang !== lang) {
			lang = langBtn.dataset.lang;
			store.set("lang", lang);
			applyLanguage();
			return;
		}
		const closeBtn = event.target.closest("[data-close]");
		if (closeBtn) { closeBtn.closest("dialog").close(); return; }
		// длинный состав в узкой карточке свёрнут — нажатие разворачивает его
		const desc = event.target.closest(".item-desc");
		if (desc) desc.classList.toggle("open");
	});

	$("theme").addEventListener("click", () => {
		theme = theme === "dark" ? "light" : "dark";
		store.set("theme", theme);
		applyTheme();
	});

	$("open-order").addEventListener("click", () => {
		renderOrderLines();
		$("order-sheet").showModal();
	});
	$("show-waiter").addEventListener("click", openWaiter);
	$("clear-order").addEventListener("click", () => {
		if (!window.confirm(t("confirmClear"))) return;
		order = {};
		store.set("order", order);
		renderMenu();
		refreshOrder();
		$("order-sheet").close();
	});

	// закрытие диалога нажатием на затемнённый фон
	document.querySelectorAll("dialog").forEach((dialog) => {
		dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
	});

	$("bar-icon").innerHTML = ICON.bag;
	applyLanguage();
})();
