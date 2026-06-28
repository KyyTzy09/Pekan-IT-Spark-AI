import { expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";

test("app icon exists and is a valid PNG", () => {
  const iconPath = path.join(process.cwd(), "public", "icon.png");
  expect(fs.existsSync(iconPath)).toBe(true);

  const stats = fs.statSync(iconPath);
  expect(stats.size).toBeGreaterThan(0);

  const buffer = fs.readFileSync(iconPath);
  expect(buffer[0]).toBe(0x89);
  expect(buffer[1]).toBe(0x50);
  expect(buffer[2]).toBe(0x4e);
  expect(buffer[3]).toBe(0x47);
});
