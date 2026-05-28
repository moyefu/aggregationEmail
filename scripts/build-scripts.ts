import * as esbuild from "esbuild";
import * as path from "path";
import * as fs from "fs";

const scriptsDir = path.resolve(__dirname, "../scripts");
const distDir = path.resolve(__dirname, "../dist/scripts");

const scripts = ["start-smtp.ts"];

fs.mkdirSync(distDir, { recursive: true });

for (const script of scripts) {
  const inputFile = path.join(scriptsDir, script);
  const outputFile = path.join(distDir, script.replace(".ts", ".js"));

  console.log(`Building ${script} -> ${path.basename(outputFile)}`);

  esbuild.build({
    entryPoints: [inputFile],
    outfile: outputFile,
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    external: ["@prisma/client", "prisma"],
    minify: true,
  });
}

console.log("Scripts built successfully");