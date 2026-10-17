import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spec = JSON.parse(await readFile(path.join(root, "contracts/openapi.json"), "utf8"));
const outputPath = path.join(root, "src/lib/api/generated/contracts.ts");

function typeFor(schema) {
  if (schema.$ref) return schema.$ref.split("/").at(-1);
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const mapped = types.map((type) => {
    if (type === "array") return `Array<${typeFor(schema.items)}>`;
    if (type === "object") return "Record<string, unknown>";
    return ({ string: "string", number: "number", integer: "number", boolean: "boolean", null: "null" })[type] ?? "unknown";
  });
  return [...new Set(mapped)].join(" | ");
}

const names = Object.keys(spec.components.schemas).sort();
const lines = ["/* Generated from contracts/openapi.json. Do not edit by hand. */", ""];
for (const name of names) {
  const schema = spec.components.schemas[name];
  if (schema.type !== "object") continue;
  const required = new Set(schema.required ?? []);
  lines.push(`export interface ${name} {`);
  for (const [property, propertySchema] of Object.entries(schema.properties ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`  ${property}${required.has(property) ? "" : "?"}: ${typeFor(propertySchema)};`);
  }
  lines.push("}", "");
}
const generated = `${lines.join("\n").trimEnd()}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== generated) {
    console.error("API contracts are out of date. Run pnpm api:contracts:generate and commit the generated file.");
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, generated);
}
