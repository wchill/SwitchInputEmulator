const decoder = new Worker('/static/js/lib/h264bsd_worker.js');
const display = new H264bsdCanvas(myCanvasElement);

decoder.addEventListener('message', (e) => {
  const message = e.data;
  // if (!message.hasOwnProperty('type')) return;

  switch (message.type) {
    // Posted when onHeadersReady is called on the worker
    case 'pictureParams':
      {
        const croppingParams = message.croppingParams;
        if (croppingParams === null) {
          canvas.width = message.width;
          canvas.height = message.height;
        } else {
          canvas.width = croppingParams.width;
          canvas.height = croppingParams.height;
        }
      }
      break;

    // Posted when onPictureReady is called on the worker
    case 'pictureReady':
      display.drawNextOutputPicture(
        message.width,
        message.height,
        message.croppingParams,
        new Uint8Array(message.data));
      break;

    // Posted after all of the queued data has been decoded
    case 'noInput':
      break;

    // Posted after the worker creates and configures a decoder
    case 'decoderReady':
      break;

    // Error messages that line up with error codes returned by decode()
    case 'decodeError':
    case 'paramSetError':
    case 'memAllocError':
    default:
      break;
  }
});

// Queue input data.
// The queued data will be immediately decoded.
// Once all of the data has been decoded, a "noInput" message will be posted.
decoder.postMessage({ type: 'queueInput', data: myUint8Array.buffer }, [myUint8Array.buffer]);
