// backend/src/server.ts
import app from "./app";
import { config } from "./config/config";
import os from "os";

const getLanIpv4Address = (): string | null => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const addrs = nets[name] || [];
    for (const addr of addrs) {
      if (addr && addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return null;
};

app.listen(config.port, "0.0.0.0", () => {
  const lanIp = getLanIpv4Address();
  console.log(`🚀 Server running on port ${config.port}`);
  if (lanIp) {
    console.log(`🌐 LAN Access available at: http://${lanIp}:${config.port}`);
  }
});
