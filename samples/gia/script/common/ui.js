import designChange from "../designChange.js";
import managedLayers from "../managedLayers.js";

const mapEl = document.querySelector("arcgis-map");
const sceneEl = document.getElementById("sceneEl");
const startShellPanel = document.getElementById("shell-panel-start");
const endShellPanel = document.getElementById("shell-panel-end");
const styleButton = document.getElementById("style-button");
const mapSceneButton = document.getElementById("mapScene-button");
const headerImage = document.getElementById("header-title");
const addLayerBtn = document.getElementById("add-layer");
const layerList = document.querySelector("arcgis-layer-list")
const legend = document.querySelector("arcgis-legend")

let activeWidgetList = {
    left: null,
    right: null
}

let clickExpand = false;
// サイド シェルの開閉処理
const handleActionBarClick = ({ target }) => {

    const parent = target.parentElement;
    let shellPanel, activeWidget, targetShell, itemName;
    if (parent.id == "left-action-bar") {
        targetShell = "left";
        itemName = "flow"
    } else if (parent.id == "right-action-bar") {
        targetShell = "rigth";
        itemName = "panel"
    }

    if (target.tagName !== "CALCITE-ACTION") {
        if (!clickExpand) {
            if (targetShell == "left") {
                startShellPanel.collapsed = true;
                if (activeWidgetList.left) {
                    document.querySelector(`[data-action-id=${activeWidgetList.left}]`).active = false;
                    let flowElem = document.querySelector(`[data-${itemName}-id=${activeWidgetList.left}]`);
                    for (let idx = 1; idx < flowElem.childNodes.length; idx++) {
                        if (flowElem.firstElementChild !== flowElem.lastElementChild) {
                            flowElem.removeChild(flowElem.lastElementChild);
                        }
                    }
                    flowElem.firstElementChild.closed = true;
                    activeWidgetList.left = null;
                }
            } else if (targetShell == "right") {
                endShellPanel.collapsed = true;
                if (activeWidgetList.right) {
                    document.querySelector(`[data-action-id=${activeWidgetList.right}]`).active = false;
                    document.querySelector(`[data-${itemName}-id=${activeWidgetList.right}]`).closed = true
                    activeWidgetList.right = null;
                }
            }
        }
        clickExpand = false;
        return;
    }

    if (targetShell == "left") {
        shellPanel = startShellPanel;
        activeWidget = activeWidgetList.left;
    } else if (targetShell == "rigth") {
        shellPanel = endShellPanel;
        activeWidget = activeWidgetList.right;
    }
    shellPanel.collapsed = false;
    let activeElem = document.querySelector(`[data-${itemName}-id=${activeWidget}]`);
    if (activeWidget) {
        document.querySelector(`[data-action-id=${activeWidget}]`).active = false;
        if (targetShell == "left") {
            for (let idx = 1; idx < activeElem.childNodes.length; idx++) {
                if (activeElem.firstElementChild !== activeElem.lastElementChild) {
                    activeElem.removeChild(activeElem.lastElementChild);
                }
            }
            activeElem.firstElementChild.closed = true;
        } else {
            activeElem.closed = true;
        }
    }

    const nextWidget = target.dataset.actionId;
    const itemElem = document.querySelector(`[data-${itemName}-id=${nextWidget}]`);
    if (nextWidget !== activeWidget) {
        document.querySelector(`[data-action-id=${nextWidget}]`).active = true;
        let addEveElem;
        if (targetShell == "left") {
            activeWidgetList.left = nextWidget;
            itemElem.firstElementChild.closed = false;
            addEveElem = itemElem.firstElementChild;
        } else {
            activeWidgetList.right = nextWidget;
            itemElem.closed = false;
            addEveElem = itemElem;
        }
        addEveElem.addEventListener(itemName == "panel" ? "calcitePanelClose" : "calciteFlowItemClose", ({ target }) => {
            const parent = target.parentElement;
            clickExpand = false;
            shellPanel.collapsed = true;
            if (targetShell == "left") {
                document.querySelector(`[data-action-id=${activeWidgetList.left}]`).active = false;
                activeWidgetList.left = null;
            } else if (parent.id == "shell-panel-end") {
                document.querySelector(`[data-action-id=${activeWidgetList.right}]`).active = false;
                activeWidgetList.right = null;
            }
        })
    } else {
        if (targetShell == "left") {
            activeWidgetList.left = null;
        } else {
            activeWidgetList.right = null;
        }
        shellPanel.collapsed = true;
    }
};

// アプリのスタイルを変更をする処理
function changeStyleMode() {
    if (styleButton.iconStart == "brightness") {
        styleButton.iconStart = "moon";
        styleButton.innerText = "ダーク モード";
        document.body.classList.toggle("calcite-mode-dark");
        headerImage.thumbnail = "./images/ej-logo-dark.svg";
    } else {
        styleButton.iconStart = "brightness";
        styleButton.innerText = "ライト モード";
        document.body.classList.remove("calcite-mode-dark");
        headerImage.thumbnail = "./images/ej-logo-light.svg";
    }
}

const printPanelItem = document.querySelector(`[data-action-id="print"]`)
// アプリのスタイルを変更をする処理
function changeMapMode() {
    if (mapSceneButton.iconStart == "2d") {
        mapSceneButton.iconStart = "3d";
        mapSceneButton.innerText = "シーン";
        printPanelItem.style.display = "none";
        mapEl.style.display = "none";
        sceneEl.style.display = "block";
        layerList.referenceElement = "sceneEl"
        legend.referenceElement = "sceneEl"
        designChange(sceneEl);
    } else {
        mapSceneButton.iconStart = "2d";
        mapSceneButton.innerText = "マップ";
        printPanelItem.style.display = "block";
        sceneEl.style.display = "none";
        mapEl.style.display = "block";
        layerList.referenceElement = "mapEl"
        legend.referenceElement = "mapEl"
        designChange(mapEl);
    }
}

// メニュー用シートを開く処理
function opneSheet() {
    document.querySelector("calcite-sheet").open = true;
    document.getElementById("menu-panel").closed = false;
}

// メニュー内のパネルが閉じられた時の処理
document.getElementById("menu-panel").addEventListener("calcitePanelClose", () => {
    document.querySelector("calcite-sheet").open = false
})

// 左右のアクションバーがクリックされた時のイベントを設定
document.querySelectorAll("calcite-action-bar").forEach(elm => {
    elm.addEventListener("calciteActionBarToggle", () => clickExpand = true)
    elm.addEventListener("click", handleActionBarClick);
});

// メニューのボタンがクリックされた時のイベントを設定
document.getElementById("menu-fab").addEventListener("click", opneSheet);

// スタイル変更ボタンがクリックされた時のイベントを設定
styleButton.addEventListener("click", changeStyleMode);

// マップのスタイル変更ボタンがクリックされた時のイベントを設定
mapSceneButton.addEventListener("click", changeMapMode);

addLayerBtn.addEventListener("click", managedLayers);