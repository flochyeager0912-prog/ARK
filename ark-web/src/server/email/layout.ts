import "server-only";
import type { SiteContent } from "@/content/site";
import { escapeHtml } from "@/lib/utils";
import { siteUrl } from "@/lib/env";

export type EmailBlock =
  | { type: "p"; text: string }
  | { type: "kv"; rows: [string, string][] }
  | { type: "button"; label: string; href: string }
  | { type: "img"; cid: string; alt: string }
  | { type: "note"; text: string };

/** Renders a simple, client-safe HTML email plus a plain-text alternative. */
export function renderEmail(site: SiteContent, opts: { preheader: string; heading: string; greeting?: string; blocks: EmailBlock[] }) {
  const parts: string[] = [];
  const text: string[] = [opts.heading, ""];
  if (opts.greeting) {
    parts.push(`<p style="margin:0 0 16px">${escapeHtml(opts.greeting)}</p>`);
    text.push(opts.greeting, "");
  }
  for (const b of opts.blocks) {
    switch (b.type) {
      case "p":
        parts.push(`<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(b.text)}</p>`);
        text.push(b.text, "");
        break;
      case "note":
        parts.push(`<p style="margin:0 0 16px;font-size:13px;color:#5b6478;line-height:1.5">${escapeHtml(b.text)}</p>`);
        text.push(b.text, "");
        break;
      case "kv":
        parts.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border-collapse:collapse">${b.rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:8px 12px 8px 0;color:#5b6478;font-size:14px;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:8px 0;font-weight:600;font-size:14px">${escapeHtml(v)}</td></tr>`,
            )
            .join("")}</table>`,
        );
        for (const [k, v] of b.rows) text.push(`${k}: ${v}`);
        text.push("");
        break;
      case "button":
        parts.push(
          `<p style="margin:0 0 20px"><a href="${escapeHtml(b.href)}" style="display:inline-block;background:#1f3fae;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${escapeHtml(b.label)}</a></p>`,
        );
        text.push(`${b.label}: ${b.href}`, "");
        break;
      case "img":
        parts.push(`<p style="margin:0 0 20px"><img src="cid:${escapeHtml(b.cid)}" alt="${escapeHtml(b.alt)}" width="180" height="180" style="display:block"/></p>`);
        break;
    }
  }
  const footer = `${site.name} · ${site.address.full} · ${site.contact.phoneDisplay} · ${site.contact.email}`;
  text.push("—", footer, siteUrl("/"));

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(opts.heading)}</title></head>
<body style="margin:0;background:#f3f5fb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0b1430">
<span style="display:none!important;opacity:0;height:0;width:0;overflow:hidden">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#050b2e;padding:22px 28px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.02em">${escapeHtml(site.name.toUpperCase())}<div style="font-size:12px;font-weight:400;opacity:.75;margin-top:2px">${escapeHtml(site.tagline.toLowerCase())}</div></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3">${escapeHtml(opts.heading)}</h1>
${parts.join("\n")}
</td></tr>
<tr><td style="padding:18px 28px;background:#f8f9fd;font-size:12px;color:#5b6478;line-height:1.5">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`;

  return { html, text: text.join("\n") };
}
