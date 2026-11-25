// Usage:  node build.mjs [https://your-site.com/]
// Reads people.json + template.html + three.min.js  ->  writes farewell.html + links.txt
// Each recipient's message is AES-GCM encrypted with a key derived (PBKDF2) from their link token,
// so "view source" shows only scrambled text. Only the right link can unlock the right message.
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto, randomBytes } from "node:crypto";

const base = (process.argv[2] || "https://YOUR-SITE/").replace(/#.*$/, "");
const cfg = JSON.parse(readFileSync("people.json", "utf8"));
const enc = new TextEncoder();
const ITER = 150000;
const b64 = (u8) => Buffer.from(u8).toString("base64");
const hex = (buf) => Buffer.from(buf).toString("hex");

const slug = (s) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
        .toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "ban";
const rand = () => randomBytes(8).toString("hex"); // 64 random bits, too many to guess

// Give every person a hard-to-guess token the first time; keep it stable afterwards.
let changed = false;
for (const p of cfg.people) {
    if (!p.token) { p.token = `${slug(p.name)}-${rand()}`; changed = true; }
    p.token = p.token.trim().toLowerCase();
}
if (changed) writeFileSync("people.json", JSON.stringify(cfg, null, 2) + "\n");

const k = b64(randomBytes(9));
const entries = [];
for (const p of cfg.people) {
    const salt = randomBytes(16), iv = randomBytes(12);
    const km = await crypto.subtle.importKey("raw", enc.encode(p.token), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, km,
        { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
    const payload = enc.encode(JSON.stringify({ name: p.name, p: p.paragraphs }));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
    const idx = hex(await crypto.subtle.digest("SHA-256", enc.encode(`${k}|idx|${p.token}`))).slice(0, 16);
    entries.push({ i: idx, s: b64(salt), v: b64(iv), c: b64(new Uint8Array(ct)) });
}

const data = {
    from: cfg.from, company: cfg.company, contact: cfg.contact, generic: cfg.generic,
    k, it: ITER, e: entries,
};
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
let html = readFileSync("template.html", "utf8");
html = html.replace("/*__DATA__*/null", () => safe(JSON.stringify(data)));
html = html.replace("/*__THREE__*/", () => safe(readFileSync("three.min.js", "utf8")));
writeFileSync("farewell.html", html);

const links = cfg.people.map((p) => `${p.name.padEnd(18)} ${base}#${p.token}`).join("\n");
writeFileSync("links.txt", links + "\n");
console.log(`Built farewell.html (${(html.length / 1024).toFixed(0)} KB) for ${cfg.people.length} people\n\n${links}`);