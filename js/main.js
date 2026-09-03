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
if (selectedDates.length === 2) {
var fmt = function (d) { return instance.formatDate(d, "d.m.Y"); };
instance.altInput.value = fmt(selectedDates[0]) + " – " + fmt(selectedDates[1]);
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
var EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
var EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
var EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
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
