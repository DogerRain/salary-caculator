import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import uni from "@dcloudio/vite-plugin-uni";

function copySeoToH5(targetDir) {
  const root = process.cwd();
  const seoDir = path.join(root, "seo");
  if (!fs.existsSync(targetDir) || !fs.existsSync(seoDir)) return;
  for (const file of ["sitemap.xml", "robots.txt", "favicon.png"]) {
    const from = path.join(seoDir, file);
    const to = path.join(targetDir, file);
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, to);
    }
  }
}

/** Dev server has no dist/build/h5 copy — serve same files from seo/ so /sitemap.xml works locally. */
function serveSeoInDev() {
  const types = {
    "/sitemap.xml": ["sitemap.xml", "application/xml; charset=utf-8"],
    "/robots.txt": ["robots.txt", "text/plain; charset=utf-8"],
    "/favicon.png": ["favicon.png", "image/png"]
  };
  return {
    name: "serve-seo-dev",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const pathname = (req.url || "").split("?")[0];
        const entry = types[pathname];
        if (!entry) return next();
        const filePath = path.join(process.cwd(), "seo", entry[0]);
        if (!fs.existsSync(filePath)) return next();
        res.setHeader("Content-Type", entry[1]);
        if (req.method === "HEAD") {
          res.statusCode = 200;
          res.end();
          return;
        }
        fs.createReadStream(filePath).pipe(res);
      });
    }
  };
}

export default defineConfig({
  plugins: [
    serveSeoInDev(),
    uni(),
    {
      name: "copy-seo-to-h5",
      writeBundle(outputOptions) {
        const dir = outputOptions.dir;
        if (!dir) return;
        const normalized = dir.replace(/\\/g, "/");
        if (!normalized.includes("dist/build/h5")) return;
        copySeoToH5(dir);
      }
    }
  ]
});
