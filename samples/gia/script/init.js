import designChange from "./designChange.js";
import displayChangeElem from "./displayChangeElem.js";
import authorization from "./common/authorization.js";
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

// 地図を動かせる範囲
const moveEnableExtent = {
    type: "extent",
    xmin: 122.93, // 西端 与那国島付近
    ymin: 20.42,  // 南端 沖ノ鳥島付近
    xmax: 153.99, // 東端 南鳥島付近
    ymax: 45.56,  // 北端 択捉島付近
    spatialReference: { wkid: 4326 }
}

// 必要な ArcGIS Maps SDK for JavaScript のモジュールをロード
const [
    VectorTileLayer,
    Basemap,
    LocalBasemapsSource,
    WebTileLayer,
    reactiveUtils,
    Collection,
    ActionButton
] = await $arcgis.import([
    "@arcgis/core/layers/VectorTileLayer.js",
    "@arcgis/core/Basemap.js",
    "@arcgis/core/widgets/BasemapGallery/support/LocalBasemapsSource.js",
    "@arcgis/core/layers/WebTileLayer.js",
    "@arcgis/core/core/reactiveUtils.js",
    "@arcgis/core/core/Collection.js",
    "@arcgis/core/support/actions/ActionButton.js"
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
        " | Zoom " + Math.floor(mapEl.view.zoom);
    coordsWidget.innerHTML = coords;
}

function showSceneCoordinates(pt) {
    let coords = "Center Lat/Lon " + pt.position.latitude.toFixed(3) + " " + pt.position.longitude.toFixed(3) + " " + pt.position.z.toFixed(3) +
        " | Tilt " + Math.floor(sceneEl.camera.tilt) +
        " | Heading " + Math.floor(sceneEl.camera.heading) +
        " | Fov " + Math.floor(sceneEl.camera.fov);
    coordsSceneWidget.innerHTML = coords;
}

mapEl.addEventListener("arcgisViewReadyChange", () => {
    mapEl.style.display = "none";
    reactiveUtils.watch(() => mapEl.view.stationary, function (event) {
        if (mapEl.zoom >= 15) {
            mapEl.constraints.snapToZoom = true
        } else {
            mapEl.constraints.snapToZoom = false
        }
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

    reactiveUtils.watch(() => [mapEl.map.layers.length, sceneEl.map.layers.length], function (event) {
        const viewEl = document.getElementById("mapScene-button").iconStart == "2d" ? mapEl : sceneEl;
        const iconDiv = document.getElementById("layer-icon");
        const nonLyrCrd = document.getElementById("non-layer-card");
        const layerView = document.getElementById("layer-list");
        if (viewEl.map.layers.length > 0) {
            iconDiv.style.display = "none";
            nonLyrCrd.style.display = "none";
            layerView.style.display = "block";
        } else {
            iconDiv.style.display = "block";
            nonLyrCrd.style.display = "block";
            layerView.style.display = "none";
        }
    });
    sceneEl.style.display = "block";
    sceneEl.map.ground.surfaceColor = [247, 247, 247, 1]
    sceneEl.view.environment.background = {
        type: "color",
        color: [247, 247, 247, 1]
    }
    sceneEl.view.environment.atmosphereEnabled = false;
    sceneEl.view.environment.starsEnabled = false;
    sceneEl.addEventListener("arcgisViewReadyChange", () => {
        mapEl.style.display = "block";
        reactiveUtils.watch(() => sceneEl.view.stationary, function (event) {
            showSceneCoordinates(sceneEl.camera);
        })

        sceneEl.style.display = "none";
        scrim.remove();
        loader.remove();
    });
});


await mapEl.componentOnReady();

const pointFlowItem = document.querySelector(`[data-flow-item-id="point"]`)
const lineFlowItem = document.querySelector(`[data-flow-item-id="line"]`)
const polygonFlowItem = document.querySelector(`[data-flow-item-id="polygon"]`)

// 日本地図の表示範囲のみ移動できるように設定
mapEl.constraints = {
    minZoom: 4,  // 最小ズームレベル
    maxZoom: 18, // 最大ズームレベル
    snapToZoom: false,
    geometry: moveEnableExtent
}

sceneEl.clippingArea = moveEnableExtent;
sceneEl.constraints = {
    ltitude: {    // 高度の最小/最大（単位: メートル）
        max: 6709500 // 例: 1,000km より上に行けない
    }

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
const mapSceneButton = document.getElementById("mapScene-button");

bmg.addEventListener("arcgisPropertyChange", event => {
    if (event.detail.name === "activeBasemap") {
        designChange(mapSceneButton.iconStart == "2d" ? mapEl : sceneEl);
    }
});

// サインイン処理
const authButton = document.getElementById("auth-button");
const menuSheet = document.getElementById("menu-sheet");
/**
 * サインイン
 */
authButton.addEventListener("click", () => {
    authorization().finally(() => {
        menuSheet.open = false;
    });
});

// レイヤー リスト オプション処理
const layerList = document.querySelector("arcgis-layer-list");
layerList.listItemCreatedFunction = (event) => {
    const { item } = event;
    const delTargetArray = [
        "feature",
        "group",
        "map-image",
        "wms",
        "wfs",
        "wmts",
        "wcs",
        "kml",
        "vector-tile",
        "ogc-feature",
        "tile",
        "imagery",
        "imagery-tile",
        "video",
        "media",
        "scene"
    ];

    if (delTargetArray.includes(item.layer.type)) {
        item.actionsSections = new Collection([
            new Collection([
                new ActionButton({
                    title: "レイヤーにズーム",
                    icon: "zoom-out-fixed",
                    id: "full-extent"
                }),
                new ActionButton({
                    title: "レイヤーの削除",
                    icon: "trash",
                    id: "trash"
                })
            ])
        ])
    }
}

layerList.addEventListener("arcgisTriggerAction", async event => {
    let act = event.detail.action;
    let lyr = event.detail.item.layer;
    if (act.id == "full-extent") {
        await mapEl.goTo(lyr.fullExtent)
    } else if (act.id == "trash") {
        if (lyr.parent) {
            lyr.parent.layers.items.forEach(element => {
                if (element.title == lyr.title) {
                    lyr.parent.remove(element);
                }
            });
        } else {
            if (mapSceneButton.iconStart == "2d") {
                mapEl.map.remove(lyr);
            } else if (mapSceneButton.iconStart == "3d") {
                sceneEl.map.remove(lyr);
            }
        }
    }
})