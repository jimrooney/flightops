import { spawn, spawnSync } from "node:child_process";

const MOCK_PORT = process.env.MOCK_SUPPLIER_PORT || `${4300 + Math.floor(Math.random() * 200)}`;
const API_PORT = process.env.OPS_API_PORT || `${4500 + Math.floor(Math.random() * 200)}`;

function npmCommand(args) {
  if (process.platform === "win32") {
    return { cmd: "cmd.exe", cmdArgs: ["/d", "/s", "/c", `npm ${args.join(" ")}`] };
  }
  return { cmd: "npm", cmdArgs: args };
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: false });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function start(cmd, args, name, env = {}) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ...env },
  });
  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      // eslint-disable-next-line no-console
      console.error(`${name} exited with code ${code}`);
    }
  });
  return child;
}

async function waitFor(url, timeoutMs = 20000) {
  const startAt = Date.now();
  while (Date.now() - startAt < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  // Build only what's required for this smoke test.
  const buildAdapters = npmCommand(["run", "build", "-w", "@flightops/adapters"]);
  run(buildAdapters.cmd, buildAdapters.cmdArgs);
  const buildMock = npmCommand(["run", "build", "-w", "@flightops/supplier-mock"]);
  run(buildMock.cmd, buildMock.cmdArgs);
  const buildApi = npmCommand(["run", "build", "-w", "@flightops/ops-api"]);
  run(buildApi.cmd, buildApi.cmdArgs);

  const startMock = npmCommand(["run", "start", "-w", "@flightops/supplier-mock"]);
  const mock = start(startMock.cmd, startMock.cmdArgs, "supplier-mock", {
    MOCK_SUPPLIER_PORT: MOCK_PORT,
  });
  const startApi = npmCommand(["run", "start", "-w", "@flightops/ops-api"]);
  const api = start(startApi.cmd, startApi.cmdArgs, "ops-api", {
    OPS_API_PORT: API_PORT,
    REZDY_API_BASE_URL: `http://localhost:${MOCK_PORT}`,
    REZDY_API_KEY: "mock-api-key",
  });

  try {
    await waitFor(`http://localhost:${MOCK_PORT}/healthz`);
    await waitFor(`http://localhost:${API_PORT}/healthz`);

    const url = `http://localhost:${API_PORT}/sync/rezdy/bookings`;
    const res = await fetch(url);
    assert(res.ok, `Sync endpoint failed with status ${res.status}`);
    const body = await res.json();

    assert(body.ok === true, "Expected ok=true");
    assert(Array.isArray(body.bookings), "Expected bookings[]");
    assert(body.count >= 1, "Expected at least one booking");

    const first = body.bookings[0];
    assert(first.supplier === "rezdy", "Expected supplier=rezdy");
    assert(typeof first.supplierBookingId === "string", "Expected supplierBookingId");
    assert(typeof first.startTimeIso === "string", "Expected startTimeIso");
    assert(Array.isArray(first.passengers), "Expected passengers[]");

    // eslint-disable-next-line no-console
    console.log("sync-smoke: PASS");
  } finally {
    api.kill();
    mock.kill();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`sync-smoke: FAIL - ${err instanceof Error ? err.message : "unknown error"}`);
  process.exitCode = 1;
});
