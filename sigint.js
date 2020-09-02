const SIGNALS = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15,
}

module.exports = function registerShutdown(cb) {
  // Create a listener for each of the signals that we want to handle
  Object.keys(SIGNALS).forEach((signal) => {
    process.on(signal, () => {
      console.log(`process received a ${signal} signal`);
      cb(signal, SIGNALS[signal]);
    });
  });
}
