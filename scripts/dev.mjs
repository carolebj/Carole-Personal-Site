import { spawn } from "node:child_process";

const processes = [
  {
    name: "site",
    command: "npm",
    args: ["run", "-s", "dev:site", "--", "--host", "127.0.0.1"],
  },
  {
    name: "cms",
    command: "npm",
    args: ["run", "-s", "cms:dev", "--", "--host", "127.0.0.1"],
  },
];

const colors = {
  site: "\x1b[36m",
  cms: "\x1b[35m",
  reset: "\x1b[0m",
};

let shuttingDown = false;
const children = [];

const prefixOutput = (name, chunk) => {
  const color = colors[name] ?? "";
  const lines = chunk.toString().split(/\r?\n/);

  for (const line of lines) {
    if (line.trim().length === 0) continue;
    process.stdout.write(`${color}[${name}]${colors.reset} ${line}\n`);
  }
};

const stopAll = (signal = "SIGTERM") => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

console.log("Starting Carole Portfolio local workspace...");
console.log("Site:   http://127.0.0.1:5173/");
console.log("Studio: http://127.0.0.1:3333/admin/");
console.log("Tip: http://127.0.0.1:5173/admin redirects to the Studio while this command is running.\n");

for (const processConfig of processes) {
  const child = spawn(processConfig.command, processConfig.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.push(child);

  child.stdout.on("data", (chunk) => prefixOutput(processConfig.name, chunk));
  child.stderr.on("data", (chunk) => prefixOutput(processConfig.name, chunk));

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;

    if (code === 0 || signal) {
      stopAll();
      process.exit(code ?? 0);
      return;
    }

    console.error(`[${processConfig.name}] exited with code ${code}`);
    stopAll();
    process.exit(code ?? 1);
  });
}

process.on("SIGINT", () => {
  stopAll("SIGINT");
  process.exit(130);
});

process.on("SIGTERM", () => {
  stopAll("SIGTERM");
  process.exit(143);
});
