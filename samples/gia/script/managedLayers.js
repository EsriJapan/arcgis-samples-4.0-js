import displayAlert from "./common/alert.js"
export default async function managedLayers() {

    const layerFlow = document.querySelector(`[data-flow-id="layer"]`)
    // initSymbolList(layerFlow);
    creatFlow(layerFlow)
    // setLayerIist(layerFlow);
}

const selOpt = {
    myContents: "マイ コンテンツ",
    group: "グループ",
    organization: "組織",
    livingAtlas: "Living Atlas",
    agol: "ArcGIS Online"
}

function initSymbolList(elem) {
    // 初期化
    for (let idx = elem.childNodes.length; idx > 1; idx--) {
        let child = elem.childNodes[idx - 1];
        elem.remove(child);
    }
}

async function addDelLayer() {
    const mapEl = document.getElementById("mapEl");
    const sceneEl = document.getElementById("sceneEl");
    const [
        PortalItem,
        esriRequest,
        FeatureLayer,
        GroupLayer
    ] = await $arcgis.import([
        "@arcgis/core/portal/PortalItem.js",
        "@arcgis/core/request.js",
        "@arcgis/core/layers/FeatureLayer.js",
        "@arcgis/core/layers/GroupLayer.js"
    ]);
    const item = new PortalItem({
        id: this.name
    })
    await item.load();

    const { data } = await esriRequest(item.url, {
        query: { f: "json" },
        responseType: "json"
    });
    const layers = (data.layers ?? []);

    if (this.innerText == "追加") {
        let layer;
        if (layers.length == 1) {
            layer = new FeatureLayer({
                portalItem: {
                    id: this.name
                }
            });
            mapEl.map.add(layer);
        } else {
            layer = new GroupLayer({
                portalItem: {
                    id: this.name
                }
            })
        }
        const mapSceneButton = document.getElementById("mapScene-button");
        if (mapSceneButton.iconStart == "2d") {
            mapEl.map.add(layer);
        } else if (mapSceneButton.iconStart == "3d") {
            sceneEl.map.add(layer);
        }
        this.innerText = "削除";
    } else {
        this.innerText = "追加";
    }
}

async function changeSearchItemList(layerListDiv) {
    const [
        Portal,
        PortalQueryParams
    ] = await $arcgis.import([
        "@arcgis/core/portal/Portal.js",
        "@arcgis/core/portal/PortalQueryParams.js"
    ]);

    while (layerListDiv.firstChild) {
        layerListDiv.removeChild(layerListDiv.firstChild)
    }

    const portal = new Portal();
    await portal.load();
    const pqp = new PortalQueryParams({
        // filter: 'owner:' + portal.user.username + ' AND type: "Feature Layer"',
        query: `owner: ${portal.user.username} AND type: "Feature Service"`,
        sortField: "title",
        sortOrder: "asc",
        num: 100,
    });

    let results = await portal.queryItems(pqp);
    results = results.results;
    for (let idx = 0; idx < results.length; idx++) {
        const result = results[idx];
        const card = document.createElement("calcite-card")
        card.thumbnailPosition = "inline-end";
        const layerTitle = document.createElement("span");
        layerTitle.slot = "heading";
        layerTitle.innerText = result.title;
        layerTitle.classList.add("card-content");
        card.append(layerTitle);
        const serviceName = document.createElement("span");
        serviceName.slot = "description";
        serviceName.innerText = result.displayName;
        serviceName.classList.add("card-content");
        card.append(serviceName);
        const figure = document.createElement("figure");
        figure.classList.add("item-browser-card__thumbnail");
        figure.slot = "thumbnail";
        const img = document.createElement("img");
        img.classList.add("thumbnail");
        img.src = result.thumbnailUrl;
        figure.append(img)
        card.append(figure);
        const labelDiv = document.createElement("div");
        const inLabel = document.createElement("calcite-label");
        labelDiv.classList.add("card-bottom")
        labelDiv.slot = "footer-start";
        inLabel.classList.add("inLabel")
        inLabel.layout = "inline";
        const avator = document.createElement("calcite-avatar");
        avator.fullName = result.portal.user.fullName;
        avator.scale = "s"
        inLabel.append(avator);
        const userName = document.createElement("span");
        userName.innerText = result.portal.user.fullName;
        inLabel.append(userName);
        labelDiv.append(inLabel)
        card.append(labelDiv);
        const buttonDiv = document.createElement("div");
        buttonDiv.classList.add("card-bottom")
        buttonDiv.slot = "footer-end";
        const addButton = document.createElement("calcite-button");
        addButton.iconStart = "plus";
        addButton.kind = "inverse";
        addButton.innerText = "追加";
        addButton.scale = "s"
        addButton.name = result.id;
        addButton.addEventListener("click", addDelLayer);
        buttonDiv.append(addButton)
        card.append(buttonDiv);

        layerListDiv.append(card)
    }
}

function creatFlow(elem) {
    const newFlowItem = document.createElement("calcite-flow-item");
    newFlowItem.addEventListener("calciteFlowItemBack", () => {
        newFlowItem.remove();
    });
    newFlowItem.heading = "レイヤーの追加";

    const selAreaDiv = document.createElement("div");
    selAreaDiv.classList.add("text-center");
    selAreaDiv.classList.add("select-area-div");
    const layerListDiv = document.createElement("div");
    layerListDiv.classList.add("layer-list-area");
    const selElem = document.createElement("calcite-select");
    selElem.scale = "l"
    selElem.addEventListener("calciteSelectChange", () => changeSearchItemList(layerListDiv).then());

    for (let key of Object.keys(selOpt)) {
        const option = document.createElement("calcite-option");
        if (selElem.childNodes.length == 0) option.selected = true;
        option.value = key;
        option.label = selOpt[key];
        selElem.append(option)
    }
    selAreaDiv.append(selElem)
    newFlowItem.append(selAreaDiv);

    const searchArea = document.createElement("calcite-input-text");
    searchArea.placeholder = "検索";
    searchArea.clearable = true;
    searchArea.icon = "search";
    searchArea.scale = "l"
    searchArea.addEventListener("calciteInputTextChange", () => changeSearchItemList(layerListDiv).then())

    newFlowItem.append(searchArea)
    newFlowItem.append(layerListDiv)
    changeSearchItemList(layerListDiv).then();
    elem.append(newFlowItem);
    elem.childNodes.forEach(item => item.selected = false);
    newFlowItem.selected = true;
}