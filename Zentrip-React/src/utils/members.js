/**
 * Utilidades compartidas para normalizar y mostrar datos de miembros recientes.
 */

export const MAX_RECENT_MEMBERS = 8;

/**
 * Deduplica y normaliza una lista de miembros recientes.
 * - Excluye al usuario actual.
 * - Separa "nombre completo" en nombre + apellidos si aplica.
 * - Limpia datos legacy donde "nombre" era la parte local del email.
 */
export function normalizeRecentMembers(items = [], currentUserUid = '') {
  const seen = new Set();
  const seenEmails = new Set();
  const normalized = [];

  for (const item of items) {
    const uid = String(item?.uid || '').trim();
    const email = String(item?.email || '').trim().toLowerCase();
    if (!uid || uid === currentUserUid || seen.has(uid)) continue;
    if (email && seenEmails.has(email)) continue;

    const rawFirstName = String(item?.nombre || '').trim();
    const rawLastName = String(item?.apellidos || '').trim();
    const emailLocalPart = email.includes('@') ? email.split('@')[0] : '';

    // Limpia datos legacy donde "nombre" era la parte local del email.
    const cleanedFirstName = rawFirstName && rawFirstName !== emailLocalPart ? rawFirstName : '';

    // Si "nombre" es el nombre completo (tiene espacio) y "apellidos" está vacío, separar.
    let firstName = cleanedFirstName;
    let lastName = rawLastName;
    if (firstName && firstName.includes(' ') && !lastName) {
      const parts = firstName.split(/\s+/).filter(Boolean);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }

    seen.add(uid);
    if (email) seenEmails.add(email);
    normalized.push({
      id: uid,
      uid,
      nombre: firstName,
      apellidos: lastName,
      email,
      username: String(item?.username || '').trim(),
      avatar: item?.avatar || '',
    });

    if (normalized.length >= MAX_RECENT_MEMBERS) break;
  }

  return normalized;
}

/**
 * Divide los datos de un miembro reciente en firstName / lastName / fullName
 * para mostrarlo en la cuadrícula de recientes.
 */
export function getRecentNameParts(recentUser) {
  const rawFirstName = String(recentUser?.nombre || '').trim();
  const rawLastName = String(recentUser?.apellidos || '').trim();

  if (rawFirstName || rawLastName) {
    if (rawFirstName && !rawLastName && rawFirstName.includes(' ')) {
      const parts = rawFirstName.split(/\s+/).filter(Boolean);
      return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
        fullName: rawFirstName,
      };
    }

    return {
      firstName: rawFirstName || rawLastName,
      lastName: rawFirstName ? rawLastName : '',
      fullName: `${rawFirstName} ${rawLastName}`.trim(),
    };
  }

  const username = String(recentUser?.username || '').trim();
  return {
    firstName: username,
    lastName: '',
    fullName: username,
  };
}
