// プッシュ通知のイベントハンドラー
self.addEventListener('push', function(e) {
  // サーバーが送信した情報を取得
  var json = e.data.json();

  // タイトルとオプションを設定
  var title = json.title;
  var options = {
    body: json.body,
    icon: 'images/icon.png',
    badge: 'images/badge.png'
  };

  // プッシュ通知を表示
  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});
