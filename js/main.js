// Feyerlin Apartments — shared behaviour

document.addEventListener("DOMContentLoaded", function () {
// Mobile nav toggle
var toggle = document.querySelector(".nav-toggle");
var nav = document.querySelector("nav.main-nav");
if (toggle && nav) {
toggle.addEventListener("click", function () {
nav.classList.toggle("open");
});
}

// Header shadow once the page is scrolled
var header = document.querySelector(".site-header");
if (header) {
var onScroll = function () {
header.classList.toggle("scrolled", window.scrollY > 10);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
}

// Fade/slide elements in as they scroll into view
var revealEls = document.querySelectorAll(".reveal");
if (revealEls.length) {
if ("IntersectionObserver" in window) {
var observer = new IntersectionObserver(
function (entries) {
entries.forEach(function (entry) {
if (entry.isIntersecting) {
entry.target.classList.add("in-view");
observer.unobserve(entry.target);
}
});
},
{ threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
revealEls.forEach(function (el) { observer.observe(el); });
} else {
// No IntersectionObserver support — just show everything
revealEls.forEach(function (el) { el.classList.add("in-view"); });
}
}

// Season price list 2026 (must stay in sync with the table on
// buchungsanfrage.html). Prices are per apartment, per night.
var PRICE_SEASONS = [
{ start: "2026-02-21", end: "2026-03-27", era: 67, zra: 77 },
{ start: "2026-03-28", end: "2026-04-10", era: 84, zra: 94 },
{ start: "2026-04-11", end: "2026-04-30", era: 78, zra: 88 },
{ start: "2026-05-01", end: "2026-05-22", era: 83, zra: 93 },
{ start: "2026-05-23", end: "2026-06-05", era: 96, zra: 106 },
{ start: "2026-06-06", end: "2026-07-10", era: 94, zra: 104 },
{ start: "2026-07-11", end: "2026-08-21", era: 99, zra: 114 },
{ start: "2026-08-22", end: "2026-09-11", era: 99, zra: 114 },
{ start: "2026-09-12", end: "2026-10-02", era: 96, zra: 106 },
{ start: "2026-10-03", end: "2026-10-16", era: 83, zra: 93 },
{ start: "2026-10-17", end: "2026-11-07", era: 78, zra: 88 }
];
var ENDREINIGUNG = 47;
var MIN_NIGHTS = 3;

function priceForNight(dateStr) {
for (var i = 0; i < PRICE_SEASONS.length; i++) {
var s = PRICE_SEASONS[i];
if (dateStr >= s.start && dateStr <= s.end) return s;
}
return null;
}

function toISODate(d) {
return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function resetApartmentPrices() {
var era = document.getElementById("price-era");
var zra = document.getElementById("price-zra");
if (era) era.innerHTML = "ab 67 &euro;";
if (zra) zra.innerHTML = "ab 77 &euro;";
}

function renderPricePreview(checkIn, checkOut) {
var era = document.getElementById("price-era");
var zra = document.getElementById("price-zra");
if (!era || !zra) return;

var nights = Math.round((checkOut - checkIn) / 86400000);
if (nights <= 0) { resetApartmentPrices(); return; }
if (nights < MIN_NIGHTS) {
era.innerHTML = "Preis auf Anfrage";
zra.innerHTML = "Preis auf Anfrage";
return;
}

var eraTotal = 0, zraTotal = 0, missing = false;
var cursor = new Date(checkIn);
for (var n = 0; n < nights; n++) {
var season = priceForNight(toISODate(cursor));
if (!season) { missing = true; break; }
eraTotal += season.era;
zraTotal += season.zra;
cursor.setDate(cursor.getDate() + 1);
}

if (missing) {
era.innerHTML = "Preis auf Anfrage";
zra.innerHTML = "Preis auf Anfrage";
return;
}

var nightsLabel = nights + " " + (nights === 1 ? "Nacht" : "Nächte");
era.innerHTML = eraTotal + " &euro; <span class=\"apartment-price-note\">für " + nightsLabel + " + " + ENDREINIGUNG + " &euro; Endreinigung</span>";
zra.innerHTML = zraTotal + " &euro; <span class=\"apartment-price-note\">für " + nightsLabel + " + " + ENDREINIGUNG + " &euro; Endreinigung</span>";
}

// Date-range calendar for the booking form (Flatpickr)
var datesInput = document.getElementById("dates");
if (datesInput && window.flatpickr) {
if (window.flatpickr.l10ns && window.flatpickr.l10ns.de) {
window.flatpickr.localize(window.flatpickr.l10ns.de);
}
flatpickr(datesInput, {
mode: "range",
dateFormat: "d.m.Y",
altInput: true,
altFormat: "d.m.Y",
minDate: "today",
showMonths: 2,
locale: "de",
altInputClass: "date-input",
onChange: function (selectedDates, dateStr, instance) {
if (selectedDates.length === 1) {
// Block the first (MIN_NIGHTS - 1) days after the chosen arrival
// date, so an end date can't be picked that gives too short a stay.
var blocked = [];
for (var i = 1; i < MIN_NIGHTS; i++) {
var d = new Date(selectedDates[0]);
d.setDate(d.getDate() + i);
blocked.push(d);
}
instance.set("disable", blocked);
resetApartmentPrices();
} else if (selectedDates.length === 2) {
instance.set("disable", []);
var fmt = function (d) { return instance.formatDate(d, "d.m.Y"); };
instance.altInput.value = fmt(selectedDates[0]) + " – " + fmt(selectedDates[1]);
renderPricePreview(selectedDates[0], selectedDates[1]);
} else {
instance.set("disable", []);
resetApartmentPrices();
}
}
});
}

// Booking form handling (EmailJS)
var form = document.getElementById("booking-form");
if (form) {
// --- EmailJS setup -------------------------------------------------
// 1. Create a free account at https://www.emailjs.com/
// 2. Add an "Email Service" (e.g. Gmail) and a template with fields
// matching the names below (from_name, from_email, phone, dates,
// adults, children, apartments, message).
// 3. Replace the three placeholders below with your own IDs/keys.
var EMAILJS_PUBLIC_KEY = "ATO50gbUk02CNmd3V";
var EMAILJS_SERVICE_ID = "service_2fbvu14";
var EMAILJS_TEMPLATE_ID = "template_l7974p1";
// Where booking requests are sent right now (test address).
// Change to your real address once you're ready to go live.
var NOTIFY_EMAIL = "kilaz.hackintosh@gmail.com";

if (window.emailjs && EMAILJS_PUBLIC_KEY.indexOf("YOUR_") !== 0) {
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

form.addEventListener("submit", function (e) {
e.preventDefault();
var statusEl = document.getElementById("form-status");

var apartments = Array.prototype.slice
.call(form.querySelectorAll('input[name="apartment"]:checked'))
.map(function (cb) { return cb.value; });

if (apartments.length === 0) {
showStatus(statusEl, "err", "Bitte wählen Sie mindestens ein Apartment aus.");
return;
}

var data = {
to_email: NOTIFY_EMAIL,
from_name: form.firstname.value + " " + form.lastname.value,
from_email: form.email.value,
phone: form.phone.value,
language: form.language.value,
dates: form.dates.value,
adults: form.adults.value,
children: form.children.value || "0",
apartments: apartments.join(", "),
message: form.message.value || "(keine Bemerkung)"
};

var submitBtn = form.querySelector('button[type="submit"]');
submitBtn.disabled = true;
submitBtn.textContent = "Wird gesendet …";

var restoreButton = function () {
submitBtn.disabled = false;
submitBtn.textContent = "Einreichen";
};

if (window.emailjs && EMAILJS_PUBLIC_KEY.indexOf("YOUR_") !== 0) {
emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, data).then(
function () {
showStatus(statusEl, "ok", "Danke! Ihre Buchungsanfrage wurde gesendet. Wir melden uns in Kürze bei Ihnen.");
form.reset();
restoreButton();
},
function (err) {
console.error("EmailJS error:", err);
showStatus(statusEl, "err", "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt eine E-Mail.");
restoreButton();
}
);
} else {
// EmailJS not configured yet — fall back to a mailto draft so the
// form still "works" for testing purposes.
console.warn("EmailJS is not configured yet (see js/main.js). Falling back to mailto:.");
var subject = encodeURIComponent("Buchungsanfrage Feyerlin Apartments");
var body = encodeURIComponent(
"Name: " + data.from_name + "\n" +
"E-Mail: " + data.from_email + "\n" +
"Telefon: " + data.phone + "\n" +
"Sprache: " + data.language + "\n" +
"Zeitraum: " + data.dates + "\n" +
"Erwachsene: " + data.adults + " / Kinder: " + data.children + "\n" +
"Apartment(s): " + data.apartments + "\n\n" +
"Bemerkung:\n" + data.message
);
window.location.href = "mailto:" + NOTIFY_EMAIL + "?subject=" + subject + "&body=" + body;
showStatus(statusEl, "ok", "EmailJS ist noch nicht eingerichtet — es wurde stattdessen ein E-Mail-Entwurf geöffnet.");
restoreButton();
}
});
}
});

function showStatus(el, kind, text) {
if (!el) return;
el.className = kind;
el.textContent = text;
}
