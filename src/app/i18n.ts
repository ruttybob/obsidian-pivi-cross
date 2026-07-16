import { createI18n } from '@yapi/yapi-react';

export const appI18n = createI18n();

export const t = appI18n.t;
export const setLocale = appI18n.setLocale;
export const getLocale = appI18n.getLocale;
export const getAvailableLocales = appI18n.getAvailableLocales;
export const getLocaleDisplayName = appI18n.getLocaleDisplayName;

export type {
  I18n,
  Locale,
  LocaleInfo,
  TFunction,
  TranslationKey,
  TranslationParams,
} from '@yapi/yapi-react';
export {
  DEFAULT_LOCALE,
  getLocaleDisplayString,
  getLocaleInfo,
  SUPPORTED_LOCALES,
} from '@yapi/yapi-react';
