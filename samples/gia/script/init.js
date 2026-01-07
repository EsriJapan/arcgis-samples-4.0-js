import designChange from "./designChange.js";
import displayChangeElem from "./displayChangeElem.js";
// 地理院地図のベクタータイル情報のオブジェクトの配列を設定
const gsis = [
    {
        type: "vector",
        url: "https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/std.json",
        title: "標準地図",
        id: "std",
        thumbnailUrl: "https://cyberjapandata.gsi.go.jp/xyz/std/9/454/201.png"
    },
    {
        type: "vector",
        url: "https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/std_vertical.json",
        title: "標準地図 注記あり",
        id: "std_vertical",
        thumbnailUrl: "https://cyberjapandata.gsi.go.jp/xyz/std/9/454/201.png"
    },
    {
        type: "vector",
        url: "https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/pale.json",
        title: "淡色地図",
        id: "pale",
        thumbnailUrl: "https://cyberjapandata.gsi.go.jp/xyz/pale/9/454/201.png"
    },
    {
        type: "vector",
        url: "https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/blank.json",
        title: "白地図",
        id: "blank",
        thumbnailUrl: "https://cyberjapandata.gsi.go.jp/xyz/blank/9/454/201.png"
    },
    {
        type: "raster",
        url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
        title: "衛星地図",
        id: "satelite",
        thumbnailUrl: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/2/3/1.jpg"
    }
]

// 必要な ArcGIS Maps SDK for JavaScript のモジュールをロード
const [
    VectorTileLayer,
    Basemap,
    LocalBasemapsSource,
    WebTileLayer
] = await $arcgis.import([
    "@arcgis/core/layers/VectorTileLayer.js",
    "@arcgis/core/Basemap.js",
    "@arcgis/core/widgets/BasemapGallery/support/LocalBasemapsSource.js",
    "@arcgis/core/layers/WebTileLayer.js"
]);

// arcgis-map のコンポーネントを取得とコンポーネントの準備を待つ
const mapEl = document.querySelector("arcgis-map");
const scrim = document.querySelector("calcite-scrim");
const sceneEl = document.getElementById("sceneEl");
const loader = document.createElement("calcite-loader");

loader.label = "loading";
loader.text = "loading...";
document.body.appendChild(loader);

const coordsWidget = document.getElementById("coordsWidget")
const coordsSceneWidget = document.getElementById("coordsSceneWidget")
function showMapCoordinates(pt) {
    let coords = "Center Lat/Lon " + pt.latitude.toFixed(3) + " " + pt.longitude.toFixed(3) +
        " | Scale 1:" + Math.round(mapEl.view.scale * 1) / 1 +
        " | Zoom " + mapEl.view.zoom;
    coordsWidget.innerHTML = coords;
}

function showSceneCoordinates(pt) {
    let coords = "Center Lat/Lon " + pt.latitude.toFixed(3) + " " + pt.longitude.toFixed(3) +
        " | Scale 1:" + Math.round(sceneEl.view.scale * 1) / 1 +
        " | Zoom " + Math.floor(sceneEl.view.zoom);
    coordsSceneWidget.innerHTML = coords;
}

mapEl.addEventListener("arcgisViewReadyChange", () => {
    mapEl.style.display = "none";
    mapEl.view.watch(["stationary"], function (event) {
        showMapCoordinates(mapEl.view.center);

        if ((pointFlowItem.children.length > 0 ||
            lineFlowItem.children.length > 0 ||
            polygonFlowItem.children.length > 0) &&
            event) {
            displayChangeElem(mapEl, pointFlowItem);
            displayChangeElem(mapEl, lineFlowItem);
            displayChangeElem(mapEl, polygonFlowItem);
        }
    });
    sceneEl.style.display = "block";
    sceneEl.addEventListener("arcgisViewReadyChange", () => {
        mapEl.style.display = "block";
        sceneEl.view.watch(["stationary"], function (event) {
            showSceneCoordinates(sceneEl.view.center);
        });
        sceneEl.style.display = "none";
        scrim.remove();
        loader.remove();
    })
});
await mapEl.componentOnReady();

const pointFlowItem = document.querySelector(`[data-flow-item-id="point"]`)
const lineFlowItem = document.querySelector(`[data-flow-item-id="line"]`)
const polygonFlowItem = document.querySelector(`[data-flow-item-id="polygon"]`)

// 日本地図の表示範囲のみ移動できるように設定
mapEl.constraints = {
    minZoom: 4,  // 最小ズームレベル
    maxZoom: 18, // 最大ズームレベル
    geometry: {
        type: "extent",
        xmin: 122.93, // 西端 与那国島付近
        ymin: 20.42,  // 南端 沖ノ鳥島付近
        xmax: 153.99, // 東端 南鳥島付近
        ymax: 45.56,  // 北端 択捉島付近
        spatialReference: { wkid: 4326 }
    }
}

sceneEl.clippingArea = {
    type: "extent",
    xmin: 122.93, // 西端 与那国島付近
    ymin: 20.42,  // 南端 沖ノ鳥島付近
    xmax: 153.99, // 東端 南鳥島付近
    ymax: 45.56,  // 北端 択捉島付近
    spatialReference: { wkid: 4326 }
}

const lbs = new LocalBasemapsSource();

// 地理院地図をベースマップとして設定
for (let idx = 0; idx < gsis.length; idx++) {
    let layer = null;
    if (gsis[idx].type == "vector") {
        layer = new VectorTileLayer({
            url: gsis[idx].url,
            copyright: "<a href=\"https://maps.gsi.go.jp/vector/\" target=\"_blank\">地理院地図Vector</a>"
        })
    } else {
        layer = new WebTileLayer({
            urlTemplate: gsis[idx].url
        })
    }
    const bm = new Basemap({
        baseLayers: [
            layer
        ],
        title: gsis[idx].title,
        id: gsis[idx].id,
        thumbnailUrl: gsis[idx].thumbnailUrl
    })
    lbs.basemaps.add(bm);
}

// ベースマップ ギャラリーを設定
const bmg = document.querySelector("arcgis-basemap-gallery");
bmg.source = lbs;

// マップにローカル ベースマップ ソースに設定した先頭のベースマップを設定
mapEl.basemap = lbs.basemaps.getItemAt(0);
sceneEl.basemap = lbs.basemaps.getItemAt(0);

bmg.addEventListener("arcgisPropertyChange", event => {
    if (event.detail.name === "activeBasemap") {
        designChange(mapEl);
    }
});