// Whole numbers with thousands separators, without Intl: the first Intl call on a page can
// take tens of milliseconds while the browser loads its formatting data, which shows up as a
// dropped frame when it happens mid-interaction.
export const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
