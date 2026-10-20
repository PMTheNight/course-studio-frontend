import { writeFileSync } from "node:fs";
const target = new URL(
  process.argv[2] || "https://replace-with-backend.vercel.app",
);
if (
  target.protocol !== "https:" ||
  target.pathname !== "/" ||
  target.username ||
  target.password ||
  target.search ||
  target.hash
)
  throw new Error(
    "Supply an HTTPS backend origin, without a path or credentials",
  );
writeFileSync(
  new URL("../vercel.json", import.meta.url),
  JSON.stringify(
    {
      framework: "vite",
      rewrites: [
        { source: "/api/:path*", destination: `${target.origin}/api/:path*` },
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log("Configured API proxy to", target.origin);
