const { argv } = process;

// extract ports from process arguments
export function extractPeersAndMyPort() {
  return {
    me: argv[2],
    peers: argv.slice(3, argv.length)
  };
}

//['4000', '4001'] -> ['127.0.0.1:4000', '127.0.0.1:4001']
export function getPeerIps(ports: string[]) {
  return ports.map(port => toLocalIp(port));
}

//'4000' -> '127.0.0.1:4000'
export function toLocalIp(port: string) {
  return `127.0.0.1:${port}`;
}

//'127.0.0.1:4000' -> '4000'
export function extractPortFromIp(ipWithPort: string) {
  return ipWithPort.toString().slice(ipWithPort.length - 4, ipWithPort.length);
}

export function extractMessage(jsonMsg: string) {
  try {
    return JSON.parse(jsonMsg.trim());
  } catch {
    // invalid json msg
    return null;
  }
}

export function formatMessage(msg: unknown) {
  return JSON.stringify(msg);
}
