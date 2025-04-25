const os = require('os');

function getWiFiIPv4() {
  const interfaces = os.networkInterfaces();

  for (const [name, iface] of Object.entries(interfaces)) {
    if (name.includes('Wi-Fi')) {
      // Match Wi-Fi adapter
      for (const details of iface) {
        if (details.family === 'IPv4' && !details.internal) {
          console.log(`Wi-Fi IPv4 Address: ${details.address}`);
          return;
        }
      }
    }
  }

  console.log('Wi-Fi IPv4 Address not found');
}

getWiFiIPv4();
