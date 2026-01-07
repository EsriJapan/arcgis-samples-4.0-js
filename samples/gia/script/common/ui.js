const mapEl = document.querySelector("arcgis-map");
const sceneEl = document.getElementById("sceneEl");
const startShellPanel = document.getElementById("shell-panel-start");
const endShellPanel = document.getElementById("shell-panel-end");
const styleButton = document.getElementById("style-button");
const mapSceneButton = document.getElementById("mapScene-button");
const headerImage = document.getElementById("header-title");
const bmg = document.querySelector("arcgis-basemap-gallery");

let activeWidgetList = {
    left: null,
    right: null
}

let clickExpand = false;
// サイド シェルの開閉処理
const handleActionBarClick = ({ target }) => {

    const parent = target.parentElement;
    if (target.tagName !== "CALCITE-ACTION") {
        if (!clickExpand) {
            if (target.id == "left-action-bar") {
                startShellPanel.collapsed = true;
                if (activeWidgetList.left) {
                    document.querySelector(`[data-action-id=${activeWidgetList.left}]`).active = false;
                    document.querySelector(`[data-panel-id=${activeWidgetList.left}]`).closed = true
                    activeWidgetList.left = null;
                }
            } else if (target.id == "right-action-bar") {
                endShellPanel.collapsed = true;
                if (activeWidgetList.right) {
                    document.querySelector(`[data-action-id=${activeWidgetList.right}]`).active = false;
                    document.querySelector(`[data-panel-id=${activeWidgetList.right}]`).closed = true
                    activeWidgetList.right = null;
                }
            }
        }
        clickExpand = false;
        return;
    }

    let shellPanel, activeWidget, targetShell;
    if (parent.id == "left-action-bar") {
        shellPanel = startShellPanel;
        activeWidget = activeWidgetList.left;
        targetShell = "left";
    } else if (parent.id == "right-action-bar") {
        shellPanel = endShellPanel;
        activeWidget = activeWidgetList.right;
        targetShell = "rigth";
    }

    shellPanel.collapsed = false;
    if (activeWidget) {
        document.querySelector(`[data-action-id=${activeWidget}]`).active = false;
        document.querySelector(`[data-panel-id=${activeWidget}]`).closed = true;
    }

    const nextWidget = target.dataset.actionId;
    if (nextWidget !== activeWidget) {
        document.querySelector(`[data-action-id=${nextWidget}]`).active = true;
        document.querySelector(`[data-panel-id=${nextWidget}]`).closed = false;
        if (targetShell == "left") {
            activeWidgetList.left = nextWidget;
        } else {
            activeWidgetList.right = nextWidget;
        }
        document.querySelector(`[data-panel-id=${nextWidget}]`).addEventListener("calcitePanelClose", ({ target }) => {
            const parent = target.parentElement;
            clickExpand = false;
            shellPanel.collapsed = true;
            if (parent.id == "shell-panel-start") {
                activeWidgetList.left = null;
            } else if (parent.id == "shell-panel-end") {
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

// アプリのスタイルを変更をする処理
function changeMapMode() {
    if (mapSceneButton.iconStart == "2d") {
        mapSceneButton.iconStart = "3d";
        mapSceneButton.innerText = "シーン";
        mapEl.style.display = "none";
        sceneEl.style.display = "block";
    } else {
        mapSceneButton.iconStart = "2d";
        mapSceneButton.innerText = "マップ";
        sceneEl.style.display = "none";
        mapEl.style.display = "block";
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