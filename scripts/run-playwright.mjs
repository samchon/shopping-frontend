import { spawnSync } from "node:child_process";

const mode = process.argv[2] ?? "e2e";
const port = process.env.PORT ?? "3000";

const env = {
  ...process.env,
  PORT: port,
};

if (mode !== "readme") {
  env.NEXT_PUBLIC_SHOPPING_API_SIMULATE = "true";
  env.SHOPPING_API_SIMULATE = "true";
}

const args =
  mode === "ui-review" || mode === "readme"
    ? ["exec", "playwright", "test", "--grep", "@ui-review"]
    : ["exec", "playwright", "test", "--grep-invert", "@ui-review"];

if (mode === "ui-review") {
  env.UI_REVIEW_TARGET = ".artifacts/ui-review";
}
if (mode === "readme") {
  env.UI_REVIEW_TARGET = "public/readme";
  env.README_SCREENSHOTS = "true";
}

run(["pnpm", "build"], env);
run(["pnpm", ...args], env);

function run(command, commandEnv) {
  const result = spawnSync(command.join(" "), {
    cwd: process.cwd(),
    env: commandEnv,
    shell: true,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
