// Tiny front-matter reader: only the three keys skillshadow needs.

export interface Frontmatter {
  name?: string;
  userInvocable?: boolean;
  disableModelInvocation?: boolean;
}

function unquote(raw: string): string {
  const v = raw.trim();
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1);
  }
  // Unquoted value: drop a trailing " # comment".
  return v.replace(/\s+#.*$/, "");
}

function toBool(raw: string): boolean | undefined {
  const v = unquote(raw).toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

/** Parses the YAML-ish block between the first two `---` lines. Handles CRLF and a BOM. */
export function parseFrontmatter(text: string): Frontmatter {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return {};
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end === -1) return {};
  const out: Frontmatter = {};
  for (const line of lines.slice(1, end)) {
    const m = /^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1] as string;
    const value = m[2] as string;
    if (key === "name") {
      const n = unquote(value);
      if (n) out.name = n;
    } else if (key === "user-invocable") {
      const b = toBool(value);
      if (b !== undefined) out.userInvocable = b;
    } else if (key === "disable-model-invocation") {
      const b = toBool(value);
      if (b !== undefined) out.disableModelInvocation = b;
    }
  }
  return out;
}
