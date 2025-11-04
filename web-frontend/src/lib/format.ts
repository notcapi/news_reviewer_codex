const numberFormatter = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("es-ES");

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
});

export function formatNumber(value: number, { decimals = false } = {}): string {
  if (decimals) {
    return numberFormatter.format(value);
  }
  return integerFormatter.format(value);
}

export function parseISODate(iso: string | null): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatDateTime(iso: string | null): string {
  const date = parseISODate(iso);
  if (!date) return "Fecha desconocida";
  return dateTimeFormatter.format(date);
}

export function formatDateOnly(iso: string | null): string {
  const date = parseISODate(iso);
  if (!date) return "Fecha desconocida";
  return dateFormatter.format(date);
}

export function truncate(text: string, max = 220): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}
