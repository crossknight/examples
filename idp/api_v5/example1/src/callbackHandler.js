import EventEmitter from 'events';

import express from 'express';
import bodyParser from 'body-parser';

import * as API from './api';
import * as utils from './utils';
import * as db from './db';

import * as config from './config';

(async () => {
  for (;;) {
    try {
      await API.setCallbackUrls({
        incoming_request_url: `http://${config.ndidApiCallbackIp}:${
          config.ndidApiCallbackPort
        }/idp/request`,
        accessor_encrypt_url: `http://${config.ndidApiCallbackIp}:${
          config.ndidApiCallbackPort
        }/idp/accessor/encrypt`,
      });
      console.log('=== callback set OK ===');
      break;
    } catch (error) {
      console.error(
        'Error setting callback URL at NDID API, retrying...',
        error
      );
    }
    // simple wait
    await new Promise((resolve, reject) => setTimeout(resolve, 5000)); // wait for 5 seconds
  }
})();

export const eventEmitter = new EventEmitter();

const app = express();

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/idp/request', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log(
      'Received incoming request callback from NDID API:',
      JSON.stringify(callbackData, null, 2)
    );
    eventEmitter.emit('callback', callbackData);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post('/idp/identity', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log(
      'Received create identity callback from NDID API:',
      JSON.stringify(callbackData, null, 2)
    );
    eventEmitter.emit('callback', callbackData);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post('/idp/identity/accessor', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log(
      'Received add accessor callback from NDID API:',
      JSON.stringify(callbackData, null, 2)
    );
    eventEmitter.emit('callback', callbackData);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post('/idp/accessor/encrypt', async (req, res) => {
  try {
    let { accessor_id, request_message_padded_hash } = req.body;
    const { accessor_private_key } = db.getAccessor(accessor_id);
    res.status(200).json({
      signature: utils.createResponseSignature(
        accessor_private_key,
        request_message_padded_hash
      ),
    });
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.post('/idp/response', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log(
      'Received response result callback from NDID API:',
      JSON.stringify(callbackData, null, 2)
    );
    eventEmitter.emit('callback', callbackData);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.listen(config.ndidApiCallbackPort, () =>
  console.log(
    `Listening to NDID API callbacks on port ${config.ndidApiCallbackPort}`
  )
);
