/** Formattazione date in italiano, ancorata al fuso Europe/Rome
 *  (così l'orario non slitta in base al fuso del server di build). */
const TZ = 'Europe/Rome';

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Solo il giorno: "11". */
export function eventDay(d: Date): string {
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', timeZone: TZ }).format(d);
}

/** Mese + ora: "Febbraio · ore 21:00". */
export function eventMonthTime(d: Date): string {
  const month = new Intl.DateTimeFormat('it-IT', { month: 'long', timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(d);
  return `${cap(month)} · ore ${time}`;
}

/** Data compatta per le liste: "11 feb". */
export function eventShort(d: Date): string {
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', timeZone: TZ }).format(d);
}

/** Data estesa per gli articoli: "10 marzo 2026". */
export function longDate(d: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  }).format(d);
}
