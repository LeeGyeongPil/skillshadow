// Language choice and message lookup.
import { en, type MessageKey } from "./locales/en.js";
import { ko } from "./locales/ko.js";

export type Lang = "en" | "ko";
export const LANGS: readonly Lang[] = ["en", "ko"];

const TABLES: Record<Lang, Record<MessageKey, string>> = { en, ko };

export function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v);
}

/** Precedence: --lang flag > SKILLSHADOW_LANG > LC_ALL > LC_MESSAGES > LANG. Not Korean means English. */
export function resolveLang(flag: string | undefined, env: NodeJS.ProcessEnv): Lang {
  if (flag !== undefined && isLang(flag)) return flag;
  const own = env.SKILLSHADOW_LANG?.trim().toLowerCase();
  if (own && isLang(own)) return own;
  for (const name of ["LC_ALL", "LC_MESSAGES", "LANG"] as const) {
    const v = env[name];
    if (v) return v.toLowerCase().startsWith("ko") ? "ko" : "en";
  }
  return "en";
}

export type Translate = (key: MessageKey, vars?: Record<string, string>) => string;

/** Returns a translate function for one language. `{name}` placeholders are replaced from vars. */
export function translator(lang: Lang): Translate {
  const table = TABLES[lang];
  return (key, vars = {}) => table[key].replace(/\{(\w+)\}/g, (_m, k: string) => vars[k] ?? "");
}

export function messageKeys(lang: Lang): string[] {
  return Object.keys(TABLES[lang]).sort();
}

export type { MessageKey };
