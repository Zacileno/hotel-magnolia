"use client";

import { useEffect } from "react";
import type { Lang } from "@/lib/content";

// Re-creates the behaviour of the old theme script (simonet.js), Easy FancyBox and Contact Form 7
// on top of the original page markup. Everything is plain DOM code because the page HTML is the
// original markup rendered as-is.

const MESSAGES: Record<Lang, Record<string, string>> = {
  cs: {
    sent: "Děkujeme za Vaši zprávu. Byla odeslána.",
    invalid: "Jedno nebo více polí obsahuje chybu. Zkontrolujte je prosím a zkuste to znovu.",
    failed: "Při pokusu o odeslání zprávy došlo k chybě. Zkuste to prosím později.",
    required: "Vyplňte prosím toto pole.",
    email: "Zadaná e-mailová adresa je neplatná.",
    tel: "Zadané telefonní číslo je neplatné.",
    quiz: "Odpověď na kvíz je nesprávná.",
  },
  en: {
    sent: "Thank you for your message. It has been sent.",
    invalid: "One or more fields have an error. Please check and try again.",
    failed: "There was an error trying to send your message. Please try again later.",
    required: "Please fill out this field.",
    email: "Please enter an email address.",
    tel: "Please enter a telephone number.",
    quiz: "The answer to the quiz is incorrect.",
  },
  de: {
    sent: "Vielen Dank für deine Nachricht. Sie wurde gesendet.",
    invalid: "Ein oder mehrere Felder sind fehlerhaft. Bitte überprüfe sie und versuche es erneut.",
    failed: "Beim Versuch, deine Nachricht zu senden, ist ein Fehler aufgetreten. Bitte versuche es später erneut.",
    required: "Bitte fülle dieses Feld aus.",
    email: "Bitte gib eine E-Mail-Adresse ein.",
    tel: "Bitte gib eine Telefonnummer ein.",
    quiz: "Die Antwort auf die Quizfrage ist falsch.",
  },
};

type Cleanup = () => void;

/* ---------- sticky menu + logo on scroll (simonet.js) ---------- */
function stickyMenu(): Cleanup {
  const menu = document.querySelector<HTMLElement>(".menu");
  const logo = document.querySelector<HTMLElement>(".logo");
  const links = () => document.querySelectorAll<HTMLElement>(".main-navigation li a");
  const subLinks = () => document.querySelectorAll<HTMLElement>(".main-navigation li li a");
  if (!menu) return () => {};
  const update = () => {
    const y = window.scrollY;
    const w = window.innerWidth;
    if (w < 1025) {
      if (y > 100) {
        menu.style.position = "fixed";
        menu.style.top = "0";
        if (logo) logo.style.display = "none";
      } else {
        menu.style.position = "absolute";
        menu.style.top = w < 616 ? "100px" : "125px";
        if (logo) logo.style.display = "inline-block";
      }
      links().forEach((a) => (a.style.color = "#222"));
    } else {
      if (logo) logo.style.display = "inline-block";
      menu.style.position = y > 100 ? "fixed" : "absolute";
      menu.style.top = y > 100 ? "0" : "initial";
      links().forEach((a) => (a.style.color = "#fff"));
      subLinks().forEach((a) => (a.style.color = "#222"));
    }
    // lets the mobile CSS give the stuck menu bar a background (globals.css)
    menu.classList.toggle("is-fixed", y > 100);
  };
  // the old script only reacted to scroll/resize, never on load — keep the CSS defaults until then
  const onScroll = () => update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

/* ---------- mobile menu (jQuery slideToggle('fast')) ---------- */
function mobileMenu(): Cleanup {
  const button = document.querySelector<HTMLElement>(".mobilemenu");
  const nav = document.querySelector<HTMLElement>(".main-navigation");
  if (!button || !nav) return () => {};
  const onClick = () => {
    const visible = getComputedStyle(nav).display !== "none";
    nav.style.overflow = "hidden";
    if (visible) {
      const h = nav.offsetHeight;
      nav.animate([{ height: h + "px" }, { height: "0px" }], { duration: 200 }).onfinish = () => {
        nav.style.display = "none";
        nav.style.overflow = "";
      };
    } else {
      nav.style.display = "block";
      const h = nav.offsetHeight;
      nav.animate([{ height: "0px" }, { height: h + "px" }], { duration: 200 }).onfinish = () => {
        nav.style.overflow = "";
      };
    }
  };
  button.addEventListener("click", onClick);
  return () => button.removeEventListener("click", onClick);
}

/* ---------- references slider on the homepage (simonet.js setMain2/startSimSlide2) ---------- */
function referenceSlider(): Cleanup {
  const list = document.querySelector<HTMLElement>(".slide-top-list2");
  const inner = document.querySelector<HTMLElement>(".slide-top-in2");
  if (!list || !inner) return () => {};
  let current = 1;
  let timer: number | undefined;

  const layout = () => {
    // The old script also tried to set the list height and the outer width, but those values
    // came out as NaN (it measured elements that don't exist), so jQuery ignored them and the
    // CSS sizes applied. Only the widths below were really set.
    const items = list.querySelectorAll<HTMLElement>(".slide-top-item2");
    const itemWidth = inner.offsetWidth;
    items.forEach((it) => (it.style.width = itemWidth + "px"));
    list.style.width = itemWidth * items.length + "px";
  };
  const step = () => {
    layout();
    const count = list.querySelectorAll(".slide-top-item2").length;
    const w = inner.offsetWidth;
    let left = 0;
    if (current < count) {
      current += 1;
      left = -(w * current - w);
    } else {
      current = 1;
    }
    list.animate([{ left: getComputedStyle(list).left }, { left: left + "px" }], { duration: 350, fill: "forwards" }).onfinish =
      () => (list.style.left = left + "px");
  };
  const start = () => (timer = window.setInterval(step, 5000));
  const onResize = () => {
    window.clearInterval(timer);
    layout();
    list.getAnimations().forEach((a) => a.cancel());
    list.style.left = "0px";
    current = 1;
    start();
  };
  layout();
  start();
  window.addEventListener("resize", onResize);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("resize", onResize);
  };
}

/* ---------- photo lightbox (Easy FancyBox 1.5.4, same markup so the original CSS applies) ---------- */
function lightbox(): Cleanup {
  const selector = 'a[href$=".jpg" i], a[href$=".jpeg" i], a[href$=".png" i], a[href$=".webp" i]';
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector)).filter(
    (a) => !a.classList.contains("nofancybox")
  );
  if (!anchors.length) return () => {};

  const overlay = document.createElement("div");
  overlay.id = "fancybox-overlay";
  const wrap = document.createElement("div");
  wrap.id = "fancybox-wrap";
  wrap.innerHTML =
    '<div id="fancybox-outer"><div id="fancybox-content"></div>' +
    '<a id="fancybox-close" title="Close"></a><div id="fancybox-title" class="fancybox-title-over"></div>' +
    '<a href="javascript:;" id="fancybox-prev" title="Previous"><span class="fancy-ico" id="fancybox-prev-ico"></span></a>' +
    '<a href="javascript:;" id="fancybox-next" title="Next"><span class="fancy-ico" id="fancybox-next-ico"></span></a></div>';
  document.body.append(overlay, wrap);
  const content = wrap.querySelector<HTMLElement>("#fancybox-content")!;
  const prev = wrap.querySelector<HTMLElement>("#fancybox-prev")!;
  const next = wrap.querySelector<HTMLElement>("#fancybox-next")!;

  let group: HTMLAnchorElement[] = [];
  let index = 0;
  const MARGIN = 20;

  const show = () => {
    const a = group[index];
    const img = new Image();
    img.id = "fancybox-img";
    img.alt = a.title || a.querySelector("img")?.alt || "";
    img.onload = () => {
      const maxW = window.innerWidth - MARGIN * 2;
      const maxH = window.innerHeight - MARGIN * 2;
      const ratio = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
      const w = Math.round(img.naturalWidth * ratio);
      const h = Math.round(img.naturalHeight * ratio);
      Object.assign(wrap.style, {
        width: w + "px",
        height: h + "px",
        left: Math.round((window.innerWidth - w) / 2) + window.scrollX + "px",
        top: Math.round((window.innerHeight - h) / 2) + window.scrollY + "px",
        display: "block",
      });
      content.replaceChildren(img);
      prev.style.display = index > 0 ? "block" : "none";
      next.style.display = index < group.length - 1 ? "block" : "none";
    };
    img.src = a.href;
  };
  const open = (a: HTMLAnchorElement) => {
    const rel = a.getAttribute("rel");
    group = rel ? anchors.filter((x) => x.getAttribute("rel") === rel) : [a];
    index = group.indexOf(a);
    overlay.style.display = "block";
    document.documentElement.classList.add("fancybox-active");
    show();
  };
  const close = () => {
    overlay.style.display = "none";
    wrap.style.display = "none";
    content.replaceChildren();
    document.documentElement.classList.remove("fancybox-active");
  };
  const onAnchor = (e: MouseEvent) => {
    e.preventDefault();
    open(e.currentTarget as HTMLAnchorElement);
  };
  const onKey = (e: KeyboardEvent) => {
    if (wrap.style.display !== "block") return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
  };
  const goPrev = () => {
    if (index > 0) {
      index--;
      show();
    }
  };
  const goNext = () => {
    if (index < group.length - 1) {
      index++;
      show();
    }
  };
  anchors.forEach((a) => a.addEventListener("click", onAnchor));
  overlay.addEventListener("click", close);
  wrap.querySelector("#fancybox-close")!.addEventListener("click", close);
  prev.addEventListener("click", goPrev);
  next.addEventListener("click", goNext);
  document.addEventListener("keydown", onKey);
  return () => {
    anchors.forEach((a) => a.removeEventListener("click", onAnchor));
    document.removeEventListener("keydown", onKey);
    overlay.remove();
    wrap.remove();
  };
}

/* ---------- "Vaše dotazy" form (Contact Form 7 markup) → /api/kontakt ---------- */
function contactForms(lang: Lang): Cleanup {
  const t = MESSAGES[lang];
  const forms = Array.from(document.querySelectorAll<HTMLFormElement>("form.wpcf7-form"));

  const clearErrors = (form: HTMLFormElement) => {
    form.querySelectorAll(".wpcf7-not-valid-tip").forEach((el) => el.remove());
    form.querySelectorAll(".wpcf7-not-valid").forEach((el) => {
      el.classList.remove("wpcf7-not-valid");
      el.setAttribute("aria-invalid", "false");
    });
  };
  const markError = (form: HTMLFormElement, name: string, message: string) => {
    const field = form.querySelector<HTMLElement>(`[name="${name}"]`);
    const wrap = field?.closest(".wpcf7-form-control-wrap");
    if (!field || !wrap) return;
    field.classList.add("wpcf7-not-valid");
    field.setAttribute("aria-invalid", "true");
    const tip = document.createElement("span");
    tip.className = "wpcf7-not-valid-tip";
    tip.setAttribute("aria-hidden", "true");
    tip.textContent = message;
    wrap.append(tip);
  };
  const setStatus = (form: HTMLFormElement, status: "sent" | "invalid" | "failed" | "submitting", text = "") => {
    form.classList.remove("init", "sent", "invalid", "failed", "submitting", "spam");
    form.classList.add(status);
    form.dataset.status = status;
    const out = form.querySelector<HTMLElement>(".wpcf7-response-output");
    if (out) {
      out.textContent = text;
      out.setAttribute("aria-hidden", text ? "false" : "true");
    }
  };

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    clearErrors(form);
    const value = (n: string) => (form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${n}"]`)?.value ?? "").trim();
    const consents = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name^="acceptance"]'));
    const data = {
      name: value("your-name"),
      email: value("your-email"),
      tel: value("tel"),
      message: value("your-message"),
      quizQuestion: form.querySelector(".wpcf7-quiz-label")?.textContent?.trim() ?? "",
      quizAnswer: value("quiz-424"),
      consents: consents.map((c) => c.checked),
      website: value("website"), // honeypot
      page: window.location.pathname,
      lang,
    };

    // same checks as on the server, for instant feedback
    const errors: [string, string][] = [];
    if (!data.name) errors.push(["your-name", t.required]);
    if (!data.email) errors.push(["your-email", t.required]);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push(["your-email", t.email]);
    if (!data.tel) errors.push(["tel", t.required]);
    else if (!/^[+0-9 ()\-./]{6,25}$/.test(data.tel)) errors.push(["tel", t.tel]);
    if (!data.quizAnswer) errors.push(["quiz-424", t.required]);
    if (errors.length) {
      errors.forEach(([n, m]) => markError(form, n, m));
      setStatus(form, "invalid", t.invalid);
      return;
    }

    setStatus(form, "submitting");
    try {
      const res = await fetch("/api/kontakt/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as { field?: string; error?: string };
      if (res.ok) {
        form.reset();
        setStatus(form, "sent", t.sent);
      } else if (res.status === 400 && body.field) {
        markError(form, body.field, body.error === "quiz" ? t.quiz : body.error === "email" ? t.email : body.error === "tel" ? t.tel : t.required);
        setStatus(form, "invalid", t.invalid);
      } else {
        setStatus(form, "failed", t.failed);
      }
    } catch {
      setStatus(form, "failed", t.failed);
    }
  };

  forms.forEach((form) => {
    form.setAttribute("novalidate", "novalidate");
    // honeypot field for spam bots (invisible for people)
    if (!form.querySelector('[name="website"]')) {
      const hp = document.createElement("input");
      hp.type = "text";
      hp.name = "website";
      hp.tabIndex = -1;
      hp.autocomplete = "off";
      hp.setAttribute("aria-hidden", "true");
      hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
      form.append(hp);
    }
    // Contact Form 7 placed a spinner right after the submit button (visible while sending)
    const submit = form.querySelector(".wpcf7-submit");
    if (submit && !submit.nextElementSibling?.classList.contains("ajax-loader")) {
      const loader = document.createElement("span");
      loader.className = "ajax-loader";
      submit.after(loader);
    }
    form.addEventListener("submit", onSubmit);
  });
  return () => forms.forEach((form) => form.removeEventListener("submit", onSubmit));
}

/* ---------- package order form on the wellness-package pages (simonet.js + its WP plugin) ---------- */
function packageForms(): Cleanup {
  const form = document.querySelector<HTMLFormElement>(".detailkurzu form");
  const box = document.querySelector<HTMLElement>(".objform");
  if (!form || !box) return () => {};
  const offs: Cleanup[] = [];
  const on = (el: Element | null, ev: string, fn: (e: Event) => void) => {
    if (!el) return;
    el.addEventListener(ev, fn);
    offs.push(() => el.removeEventListener(ev, fn));
  };
  const field = (n: string) => form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${n}"]`);
  const value = (n: string) => (field(n)?.value ?? "").trim();
  const checked = (n: string) => !!form.querySelector<HTMLInputElement>(`[name="${n}"]:checked`);

  // "CHCI REZERVOVAT" shows / hides the form
  on(form.querySelector(".chci_koupit"), "click", () => {
    const show = box.id === "formular_skryt";
    box.id = show ? "formular_zobrazen" : "formular_skryt";
    const hidden = form.querySelector<HTMLInputElement>(".formular_zobrazen");
    if (hidden) hidden.value = box.id;
  });

  // private person / company
  const osoba = form.querySelector<HTMLElement>(".osoba");
  const firma = form.querySelector<HTMLElement>(".firma");
  const choose = (company: boolean) => {
    if (osoba) osoba.style.display = company ? "none" : "block";
    if (firma) firma.style.display = company ? "block" : "none";
    form.querySelectorAll<HTMLInputElement>('input[name="vybervolbu"]').forEach((r) => (r.checked = (r.value === "2") === company));
  };
  on(form.querySelector(".vyberverzi .chec1"), "click", () => choose(false));
  on(form.querySelector(".vyberverzi .chec2"), "click", () => choose(true));

  // message box in the theme's own style (.error_item)
  const showBox = (html: string, ok: boolean) => {
    box.querySelector(".error_item")?.remove();
    const msg = document.createElement("div");
    msg.className = "error_item";
    if (ok) msg.style.cssText = "border-color:#46b450;color:#2e7d32";
    msg.innerHTML = html;
    box.prepend(msg);
    window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  };
  const label = (n: string) => {
    const el = field(n);
    // the label right before the field (e.g. "Adresa" sits after "Jméno a příjmení" in the same column)
    const prev = el?.previousElementSibling;
    const text =
      prev && (prev.tagName === "LABEL" || prev.classList.contains("sel_title"))
        ? prev.textContent
        : el?.closest(".obsah_block, .osoba_prava, .osoba_pata, .obsah_inline")?.querySelector("label, .sel_title")?.textContent;
    return (text || n).replace("*", "").trim();
  };

  on(form, "submit", async (e) => {
    e.preventDefault();
    const company = form.querySelector<HTMLInputElement>('input[name="vybervolbu"][value="2"]')?.checked ?? false;
    const required = company ? ["firma", "ic", "email2", "jmeno2", "adresa2", "mobil2"] : ["jmeno", "email", "mobil", "adresa"];
    const missing = required.filter((n) => !value(n));
    const emailName = company ? "email2" : "email";
    if (value(emailName) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value(emailName))) missing.push(emailName);
    if (!["10", "deset"].includes(value("ochrana").toLowerCase())) missing.push("ochrana");
    if (!checked("souhlas")) missing.push("souhlas");
    if (!checked("souhlas2")) missing.push("souhlas2");
    const consentLabel: Record<string, string> = {
      souhlas: "Souhlas s obchodními podmínkami",
      souhlas2: "Souhlas se zpracováním osobních údajů",
      ochrana: "Vypočtěte 5 + 5",
    };
    if (missing.length) {
      showBox(
        "Zkontrolujte prosím tyto údaje:<br>" +
          missing.map((n) => `<span>${(consentLabel[n] || label(n)).replace(/[<>&]/g, "")}</span>`).join(""),
        false
      );
      return;
    }
    const data: Record<string, unknown> = {};
    new FormData(form).forEach((v, k) => (data[k] = typeof v === "string" ? v : ""));
    data.souhlas = checked("souhlas");
    data.souhlas2 = checked("souhlas2");
    data.balicek = document.querySelector("h1.entry-title")?.textContent?.trim() ?? "";
    data.cena = document.getElementById("konecna_cena")?.textContent?.trim() ?? "";
    data.page = window.location.pathname;
    const submit = form.querySelector<HTMLInputElement>('input[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const res = await fetch("/api/objednavka/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        form.reset();
        choose(false);
        showBox("Děkujeme, Vaše objednávka byla odeslána. Brzy se Vám ozveme.", true);
      } else if (res.status === 400) {
        const body = (await res.json().catch(() => ({}))) as { field?: string };
        showBox(`Zkontrolujte prosím tyto údaje:<br><span>${body.field ? consentLabel[body.field] || label(body.field) : ""}</span>`, false);
      } else {
        showBox("Objednávku se nepodařilo odeslat. Zkuste to prosím později nebo nás kontaktujte telefonicky.", false);
      }
    } catch {
      showBox("Objednávku se nepodařilo odeslat. Zkuste to prosím později nebo nás kontaktujte telefonicky.", false);
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  // honeypot for bots
  const hp = document.createElement("input");
  hp.type = "text";
  hp.name = "website";
  hp.tabIndex = -1;
  hp.autocomplete = "off";
  hp.setAttribute("aria-hidden", "true");
  hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
  form.append(hp);
  offs.push(() => hp.remove());
  return () => offs.forEach((o) => o());
}

export default function SiteScripts({ lang }: { lang: Lang }) {
  useEffect(() => {
    document.documentElement.classList.remove("no-js");
    const cleanups = [stickyMenu(), mobileMenu(), referenceSlider(), lightbox(), contactForms(lang), packageForms()];
    return () => cleanups.forEach((c) => c());
  }, [lang]);
  return null;
}
