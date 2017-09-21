const port = chrome.runtime.connect();

port.onMessage.addListener(message => window.postMessage(message, '*'));

window.addEventListener('message', (event) => {
  console.log(event);
  if (event.data === 'check-addon-installed') {
    window.postMessage('addon-installed', '*');
  } else {
    port.postMessage(event.data);
  }
});
