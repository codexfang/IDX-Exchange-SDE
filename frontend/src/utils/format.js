export function formatPrice(value) {
  if (value === null || value === undefined) return "Price unavailable";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Price unavailable";
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return number.toLocaleString("en-US");
}

export function formatBaths(value) {
  const baths = Number(value);
  if (!Number.isFinite(baths)) return null;
  return Number.isInteger(baths) ? String(baths) : baths.toFixed(1);
}

// OpenHouseDate comes back from MySQL as a DATE, so mysql2 hands us a timestamp
// at local midnight. Reading only the date part keeps the calendar day stable
// regardless of the machine's timezone.
export function formatOpenHouseDate(value) {
  if (!value) return "";

  let year;
  let month;
  let day;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    year = value.getFullYear();
    month = value.getMonth();
    day = value.getDate();
  } else {
    const text = String(value);
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return text;
    year = Number(match[1]);
    month = Number(match[2]) - 1;
    day = Number(match[3]);
  }

  const date = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatClockTime(value) {
  if (value === null || value === undefined || value === "") return "";

  const text = typeof value === "string" ? value : String(value);
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return text;

  const hours = Number(match[1]);
  const minutes = match[2];
  if (hours > 23) return text;

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes} ${suffix}`;
}

export function formatTimeRange(start, end) {
  const from = formatClockTime(start);
  const to = formatClockTime(end);

  if (from && to) return `${from} – ${to}`;
  return from || to;
}
