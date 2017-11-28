const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// web-push-libs の読み込み
const webpush = require('web-push');

// VAPID の生成
const vapidKeys = webpush.generateVAPIDKeys();

// VAPID の設定
webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.use(express.static('app'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// クライアントへ公開鍵を返す
app.get('/api/key', (req, res) => {
  res.send(vapidKeys.publicKey);
});

// プッシュ通知をプッシュ サーバーへ送信
app.post('/api/notification', (req, res) => {
  const pushSubscription = req.body.subscription;
  const payload = JSON.stringify(req.body.message);

  const options = {
    vapidDetails: {
      subject: 'http://localhost:3000/',
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey
    }
  }

  webpush.sendNotification(
    pushSubscription,
    payload,
    options
  );
});

app.listen(3000, () => {
  console.log('server starting...');
});
