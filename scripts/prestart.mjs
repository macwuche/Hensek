#!/usr/bin/env node
import { readFileSync, readdirSync, readlinkSync } from "node:fs";

const PORTS = [3001, 5000, 5001];

function listenersOnPorts(ports) {
  const wanted = new Set(ports.map((p) => p.toString(16).toUpperCase().padStart(4, "0")));
  const inodes = new Set();
  for (const path of ["/proc/net/tcp", "/proc/net/tcp6"]) {
    let raw;
    try {
      raw = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    const lines = raw.split("\n").slice(1);
    for (const line of lines) {
      const cols = line.trim().split(/\s+/);
      if (cols.length < 10) continue;
      const localHex = cols[1] || "";
      const state = cols[3];
      if (state !== "0A") continue;
      const portHex = localHex.split(":")[1];
      if (!portHex) continue;
      if (!wanted.has(portHex.toUpperCase())) continue;
      inodes.add(cols[9]);
    }
  }
  if (inodes.size === 0) return [];
  const pids = new Set();
  for (const pid of readdirSync("/proc")) {
    if (!/^\d+$/.test(pid)) continue;
    let entries;
    try {
      entries = readdirSync(`/proc/${pid}/fd`);
    } catch {
      continue;
    }
    for (const fd of entries) {
      let link;
      try {
        link = readlinkSync(`/proc/${pid}/fd/${fd}`);
      } catch {
        continue;
      }
      const m = link.match(/^socket:\[(\d+)\]$/);
      if (m && inodes.has(m[1])) {
        pids.add(Number(pid));
        break;
      }
    }
  }
  return [...pids];
}

const self = process.pid;
const pids = listenersOnPorts(PORTS).filter((p) => p !== self && p !== process.ppid);
if (pids.length === 0) {
  console.log(`[prestart] ports ${PORTS.join(", ")} clear`);
  process.exit(0);
}

console.log(`[prestart] killing stale listeners on ${PORTS.join(", ")}: pids=${pids.join(", ")}`);
for (const pid of pids) {
  try {
    process.kill(pid, "SIGTERM");
  } catch {}
}
await new Promise((r) => setTimeout(r, 600));
for (const pid of pids) {
  try {
    process.kill(pid, "SIGKILL");
  } catch {}
}
await new Promise((r) => setTimeout(r, 200));
console.log(`[prestart] done`);
