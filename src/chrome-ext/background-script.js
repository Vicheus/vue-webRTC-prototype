chrome.runtime.onConnect.addListener((port) => {
  function onResponse(sourceId) {
    if (!sourceId || !sourceId.length) {
      port.postMessage('PermissionDeniedError');
    } else {
      port.postMessage({ sourceId });
    }
  }

  function onMessage(msg) {
    if (msg !== 'requestScreenSourceId') {
      return;
    }
    chrome.desktopCapture.chooseDesktopMedia(
      ['screen', 'window'],
      port.sender.tab,
      onResponse,
    );
  }

  port.onMessage.addListener(onMessage);
});
