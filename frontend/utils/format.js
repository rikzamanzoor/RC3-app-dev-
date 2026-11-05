/**
 * Format any number or numeric string as standard PKR with 2 decimal places.
 * Example: 1234.5 -> "PKR 1,234.50"
 */
export function formatPKR(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'PKR 0.00';
  }
  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  const parts = absNum.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const formatted = `PKR ${parts.join('.')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format date YYYY-MM-DD into a human-friendly label like "05 Nov 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${monthNames[monthIndex] || parts[1]} ${year}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function todayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

