require([
  "dojo/_base/array",
  "dojo/json",
  "dojo/dom",
  "dojo/on",
  "esri/WebMap",
  "esri/views/MapView",
  "esri/widgets/Search",
  "esri/widgets/Home",
  "esri/widgets/Track",
  "esri/geometry/Point",
  "esri/tasks/QueryTask",
  "esri/tasks/support/Query",
  "geolocate",
  "dojo/text!./location.json",
  "dojo/domReady!"
], function(array, JSON, dom, on, WebMap, MapView, Search, Home, Track, Point, QueryTask, Query, geolocate, location){
  var targetLyr, home, track, swRegistration;
  var isSubscribed = false;
  var isSimulated = false;
  var watchId = null;
  var timer = null;
  var currentGeofence = null;
  var pushBtn = dom.byId("pushBtn");
  var simulationBtn = dom.byId("simulationBtn");

  // マップの作成
  var webmap = new WebMap({
    portalItem: {
      id: "05aded7657734f99bf31ac4be2153866"
    }
  });

  // ジオフェンスのエリアを定義したレイヤーを取得
  webmap.then(function(){
    targetLyr = webmap.layers.find(function(lyr){
      return lyr.id === "sampleShopList_5211";
    });
  });

  // view の作成
  var view = new MapView({
    container: "viewDiv",
    map: webmap
  });

  view.then(function(){
    // 検索ウィジェットの作成
    var searchWidget = new Search({
      view: view
    });

    // ホームウィジェットの作成
    home = new Home({
      view: view
    });

    // トラックウィジェットの作成
    track = new Track({
      view: view,
      goToLocationEnabled: false
    });

    // ウィジェットを UI に追加
    view.ui.add(searchWidget, {
      position: "top-left",
      index: 0
    });
    view.ui.add([home, track], "top-left");

    // Service Worker の登録
    initServiceWorker();

    // イベントの作成
    initEvent();
  });

  // Service Worker の登録
  function initServiceWorker() {
    // ブラウザーが各 API を対応しているか確認
    if ("serviceWorker" in navigator && "PushManager" in window && "geolocation" in navigator) {
      // Service Worker を登録
      navigator.serviceWorker.register("sw.js").then(function(swReg) {
        swRegistration = swReg;

        // Service Worker の現在の登録状況を確認
        swRegistration.pushManager.getSubscription().then(function(subscription) {
          isSubscribed = !(subscription === null);
          updateBtn();
        });
      }).catch(function(err) {
        console.error("Service Worker Error", err);
      });
    } else {
      console.log("API is not supported");
    }
  }

  // イベントを作成
  function initEvent() {
    // プッシュ通知ボタンのクリック イベント
    on(pushBtn, "click", function() {
      pushBtn.disabled = false;
      if (isSubscribed) {
        // 通知の購読をやめる
        unsubscribeUser();
      } else {
        // 通知を購読
        subscribeUser();
      }
    });

    // シミュレーション ボタンのクリック イベント
    on(simulationBtn, "click", function() {
      simulationBtn.disabled = false;
      if (isSimulated) {
        // シミュレーションを停止
        stopSimulation();
      } else {
        // シミュレーションを実行
        startSimulation();
      }
    });
  }

  // 通知を購読する
  function subscribeUser() {
    // サーバーから公開鍵を取得
    fetch("/api/key").then(function(res) {
      if (res.ok) {
        return res.text();
      } else {
        throw new Error();
      }
    }).then(function(applicationServerPublicKey) {
      // 公開鍵をエンコーディング
      var applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);

      // 公開鍵を渡して、プッシュ通知を購読する
      swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      }).then(function(subscription) {
        // ユーザーがプッシュ通知を許可した場合、通知をリクエスト
        var param = {
          subscription: subscription,
          message: {
            title: "いろは堂",
            body: "通知の登録ありがとうございます！お近くの店舗のお得な情報をお知らせします！"
          }
        }
        updateSubscriptionOnServer(param);

        isSubscribed = true;
        updateBtn();

        // 現在地を監視
        initWatchPosition();
      }).catch(function(err) {
        // ユーザーがプッシュ通知を許可しなかった場合、エラーを表示する
        console.log("Failed to subscribe the user: ", err);
        updateBtn();
      });
    });    
  }

  // 公開鍵のエンコーディング
  function urlB64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;    
  }

  // 通知の購読をやめる
  function unsubscribeUser() {
    swRegistration.pushManager.getSubscription().then(function(subscription) {
      if (subscription) {
        return subscription.unsubscribe();
      }
    }).catch(function(error) {
      console.log("Error unsubscribing", error);
    }).then(function() {
      var param = {
        subscribe: null
      };
      updateSubscriptionOnServer(param);
      isSubscribed = false;    
      updateBtn();

      if (isSimulated) {
        stopSimulation();
      }
    });
  }

  // 通知をリクエスト
  function updateSubscriptionOnServer(param) {
    fetch("/api/notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(param)
    }).then(function(response) {
      if (!response.ok) {
        throw new Error("Bad status code from server.");
      }
    }).then(function(responseData) {
      if (!(responseData.data && responseData.data.success)) {
        throw new Error("Bad response from server.");
      }
    });
  }

  // 現在地の監視
  function initWatchPosition() {
    // 既存の watchPosition() をクリア
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    // 現在地を監視し、現在地が更新されたらクエリを実行
    watchId = navigator.geolocation.watchPosition(function(position) {
      initQuery(position);
    }, function(err) {
      console.log("Geolocation Error", err);
    });
  }  

  // クエリの実行
  function initQuery(position) {
    // 現在地の緯度経度からポイントを作成
    var point = new Point({
      longitude: position.coords.longitude,
      latitude: position.coords.latitude
    });

    // クエリ パラメーターを作成
    var query = new Query();
    query.geometry = point;
    query.outFields = ["OBJECTID", "SHOP_NAME", "MESSAGE"];
    query.spatialRelationship = "intersects";

    // あらかじめ作成しておいた店舗から 200m のバッファー（ジオフェンス）に対してクエリを実行
    targetLyr.queryFeatures(query).then(function(result){
      // バッファー内にポイント（現在地）が含まれる場合
      if (result.features.length > 0) {
        // TODO：複数のジオフェンスへの対応
        var attr = result.features[0].attributes;
        var objId = attr.OBJECTID;

        // バッファー内のポイントが同じではないとき、プッシュ通知をリクエスト
        if (objId !== currentGeofence) {
          currentGeofence = objId;

          swRegistration.pushManager.getSubscription().then(function(subscription) {
            var param = {
              subscription: subscription,
              message: {
                title: "いろは堂 " + attr.SHOP_NAME,
                body: attr.MESSAGE
              }
            }
            updateSubscriptionOnServer(param);
          });
        }
      } else {
        currentGeofence = null;
      }
    }).otherwise(function(err){
      console.log(err);
    });
  }

  function startSimulation() {
    var coords = JSON.parse(location).coords;
    var currentCoordIndex = 0;

    geolocate.use();

    initWatchPosition();
    view.goTo({
      center: [139.7454, 35.6586],
      zoom: 15
    });
    track.start();

    timer = setInterval(function() {
      geolocate.change(coords[currentCoordIndex]);
      currentCoordIndex = (currentCoordIndex + 1) % coords.length;
    }, 2500);

    // TODO：シミュレーションの停止
    //simulationBtn.textContent = "シミュレーションを停止";
    //isSimulated = true;
    simulationBtn.disabled = true;
  }

  // TODO：シミュレーションの停止
  function stopSimulation() {
    console.log("TODO: stopSimulation");
    /*clearInterval(timer);
    geolocate.restore();
    track.stop();
    home.go();
    simulationBtn.textContent = "シミュレーションを実行";
    isSimulated = false;*/
  }

  // ボタンの更新
  function updateBtn() {
    if (Notification.permission === "denied") {
      pushBtn.textContent = "通知はブロックされました";
      pushBtn.disabled = true;
      var param = {
        subscribe: null
      };
      updateSubscriptionOnServer(param);
      return;
    }

    if (isSubscribed) {
      pushBtn.textContent = "プッシュ通知を無効化";
      simulationBtn.disabled = false;
    } else {
      pushBtn.textContent = "プッシュ通知を有効化";
      simulationBtn.disabled = true;
    }

    pushBtn.disabled = false;
  }  
});
