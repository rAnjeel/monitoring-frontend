import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { enUS } from 'date-fns/locale/en-US'

// Configuration des formats par pays
const countryFormats = {
  FR: {
    locale: fr,
    pattern: 'dd/MM/yyyy HH:mm:ss' 
  },
  US: {
    locale: enUS,
    pattern: 'MM/dd/yyyy h:mm:ss a' 
  },
}

// Fonction principale
export function formatDate(date, country = 'FR', customPattern) {
  const config = countryFormats[country] || countryFormats.FR
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  return format(dateObj, customPattern || config.pattern, { 
    locale: config.locale 
  })
}

// Fonctions dédiées par pays
export function formatDateFR(date, pattern) {
  return formatDate(date, 'FR', pattern)
}

export function formatDateUS(date, pattern) {
  return formatDate(date, 'US', pattern)
}

