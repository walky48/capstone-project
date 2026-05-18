import { useContext } from 'react'
import { LanguageContext } from '../contexts/LanguageContext'

export function useLang() {
  return useContext(LanguageContext)
}
