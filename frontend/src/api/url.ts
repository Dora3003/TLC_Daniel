export function urlDaApi(): string {
  const configurada = import.meta.env.VITE_API_URL;
  if (typeof configurada === 'string' && configurada.trim() !== '') {
    return configurada.replace(/\/$/, '');
  }
  return 'https://tlc-daniel-xgxb.onrender.com';
}
