import displayAlert from "./common/alert.js"
export default async function managedLayers() {

    const layerFlow = document.querySelector(`[data-flow-id="layer"]`)
    creatFlow(layerFlow)
}

const selOpt = {
    myContents: "マイ コンテンツ",
    group: "グループ",
    organization: "組織",
    livingAtlas: "Living Atlas",
    agol: "ArcGIS Online"
}

const targetTypes = [
    `type:"Map Service"`,
    `type:"Feature Service"`,
    `type:"Image Service"`,
    `type:"Vector Tile Service"`,
    `type:"OGCFeatureServer"`,
    `type:"WMS"`,
    `type:"WFS"`,
    `type:"WMTS"`,
    `type:"WCS"`,
    `type:"KML"`,
    `type:"Video Service"`,
    `type:"Media Layer"`,
    `type:"Group Layer"`,
    `type:"GeoJson"`
]

async function returnLayer(item) {
    let layer;
    const type = item.displayName.replace(" Layer", "");
    const [
        FeatureLayer,
        GroupLayer,
        MapImageLayer,
        WMSLayer,
        WFSLayer,
        WMTSLayer,
        WCSLayer,
        KMLLayer,
        VectorTileLayer,
        OGCFeatureLayer,
        TileLayer,
        ImageryLayer,
        ImageryTileLayer,
        VideoLayer,
        MediaLayer,
        SceneLayer,
    ] = await $arcgis.import([
        "@arcgis/core/layers/FeatureLayer.js",
        "@arcgis/core/layers/GroupLayer.js",
        "@arcgis/core/layers/MapImageLayer.js",
        "@arcgis/core/layers/WMSLayer.js",
        "@arcgis/core/layers/WFSLayer.js",
        "@arcgis/core/layers/WMTSLayer.js",
        "@arcgis/core/layers/WCSLayer.js",
        "@arcgis/core/layers/KMLLayer.js",
        "@arcgis/core/layers/VectorTileLayer.js",
        "@arcgis/core/layers/OGCFeatureLayer.js",
        "@arcgis/core/layers/TileLayer.js",
        "@arcgis/core/layers/ImageryLayer.js",
        "@arcgis/core/layers/ImageryTileLayer.js",
        "@arcgis/core/layers/VideoLayer.js",
        "@arcgis/core/layers/MediaLayer.js",
        "@arcgis/core/layers/SceneLayer.js",
    ]);
    switch (type) {
        case "Feature":
            layer = new FeatureLayer({
                portalItem: item
            });
            break;
        case "Group":
            layer = new GroupLayer({
                portalItem: item
            });
            break;
        case "Map Image":
            layer = new MapImageLayer({
                portalItem: item
            });
            break;
        case "WMS":
            layer = new WMSLayer({
                portalItem: item
            });
            break;
        case "WFS":
            layer = new WFSLayer({
                portalItem: item
            });
            break;
        case "WMTS":
            layer = new WMTSLayer({
                portalItem: item
            });
            break;
        case "WCS":
            layer = new WCSLayer({
                portalItem: item
            });
            break;
        case "KML":
            layer = new KMLLayer({
                portalItem: item
            });
            break;
        case "OGC Feature":
            layer = new OGCFeatureLayer ({
                portalItem: item
            });
            break;
        case "Tile":
            if (item.type == "Vector Tile Service") {
                layer = new VectorTileLayer ({
                    portalItem: item
                });
            } else if(item.type == "Map Service") {
                layer = new TileLayer({
                    portalItem: item
                });
            }
            break;
        case "Imagery":
            layer = new ImageryLayer({
                portalItem: item
            });
            break;
        case "Tiled Imagery":
            layer = new ImageryTileLayer({
                portalItem: item
            });
            break;
        case "Video":
            layer = new VideoLayer ({
                portalItem: item
            });
            break;
        case "Media":
            layer = new MediaLayer({
                portalItem: item
            });
            break;
        case "Scene":
            layer = new SceneLayer ({
                portalItem: item
            });
            break;
        case "":
            layer = new WCSLayer({
                portalItem: item
            });
            break;
        default:
            layer = null;
            break;
    }

    return layer;
}

async function addDelLayer() {
    const mapEl = document.getElementById("mapEl");
    const sceneEl = document.getElementById("sceneEl");
    const [
        PortalItem
    ] = await $arcgis.import([
        "@arcgis/core/portal/PortalItem.js"
    ]);
    const item = new PortalItem({
        id: this.name
    });
    await item.load();
    const mapSceneButton = document.getElementById("mapScene-button");
    if (this.innerText == "追加") {
        let layer = returnLayer(item);
        if (layer) {
            if (mapSceneButton.iconStart == "2d") {
                mapEl.map.add(layer);
            } else if (mapSceneButton.iconStart == "3d") {
                sceneEl.map.add(layer);
            }
            this.innerText = "削除";
            this.iconStart = "minus";
            this.kind = "inverse"
        } else {

        }
    } else {
        this.innerText = "追加";
        this.iconStart = "plus";
        this.kind = "neutral";
        let map;
        if (mapSceneButton.iconStart == "2d") {
            map = mapEl.map;
        } else if (mapSceneButton.iconStart == "3d") {
            map = sceneEl.map;
        }

        for (let layer of map.layers) {
            if (layer.portalItem.id == this.name) {
                map.remove(layer);
            }
        }
    }
}

function alreadyAddChecker(id, map) {
    let alreadyFlg = false;
    for (let layer of map.layers) {
        if (layer.portalItem.id == id) {
            alreadyFlg = true;
            break;
        }
    }

    return alreadyFlg;
}

async function getownerUsers(portalUrl, groupId) {
    const [esriRequest] = await $arcgis.import(["@arcgis/core/request.js"]);

    const url = `${portalUrl}/sharing/rest/community/groups/${groupId}/userList`;

    const res = await esriRequest(url, {
        query: { f: "json", num: 100 },
        responseType: "json"
    });
    return res.data.users;
}


async function changeSearchItemList(layerListDiv) {
    const [
        Portal,
        PortalQueryParams,
        Extent
    ] = await $arcgis.import([
        "@arcgis/core/portal/Portal.js",
        "@arcgis/core/portal/PortalQueryParams.js",
        "@arcgis/core/geometry/Extent.js"
    ]);

    while (layerListDiv.firstChild) {
        layerListDiv.removeChild(layerListDiv.firstChild)
    }

    const mapSceneButton = document.getElementById("mapScene-button");
    let map;
    if (mapSceneButton.iconStart == "2d") {
        map = mapEl.map;
        let targetIndex = targetTypes.indexOf(`type: "Scene Service"`);
        if (targetIndex !== -1) {
            targetTypes.splice(targetIndex, 1)
        }
    } else if (mapSceneButton.iconStart == "3d") {
        map = sceneEl.map;
        targetTypes.push(`type: "Scene Service"`)
    }

    const japanExtent = new Extent({
        xmin: 122.93, // 西端 与那国島付近
        ymin: 20.42,  // 南端 沖ノ鳥島付近
        xmax: 153.99, // 東端 南鳥島付近
        ymax: 45.56,  // 北端 択捉島付近
        spatialReference: { wkid: 4326 }
    })
    const portal = new Portal();
    await portal.load();
    const selItem = document.getElementById("item-search-select");
    const selWord = document.getElementById("item-serach-word");
    let query = "";
    let getType = `(` + targetTypes.join(" OR ") + `)`
    let ownerUsers = []
    if (selItem.value == "myContents") {
        query = `owner: ${portal.user.username}`
    } else if (selItem.value == "group") {
        const groups = await portal.user.fetchGroups();
        let groupWhere = "";
        let cnt = 0;
        for (let group of groups) {
            ownerUsers = ownerUsers.concat(await getownerUsers(portal.url, group.id));
            if (cnt == 0) {
                groupWhere = `group: (${group.id}`
            } else {
                groupWhere = groupWhere + ` OR ${group.id}`
            }
            cnt++;
        }
        ownerUsers = Array.from(new Set(ownerUsers));
        if (cnt != 0) {
            groupWhere = groupWhere + `)`
        }
        query = `${groupWhere}`
    } else if (selItem.value == "organization") {
        let orgWhere = `orgid: ${portal.id}`
        query = `${orgWhere}`
    } else if (selItem.value == "livingAtlas") {
        const groups = await portal.queryGroups(new PortalQueryParams({
            query: 'title:"LAW Search" AND owner:Esri_LivingAtlas',
            num: 100
        }))
        let cnt = 0;
        let groupWhere = "";
        for (let group of groups.results) {
            if (cnt == 0) {
                groupWhere = `group: (${group.id}`
            } else {
                groupWhere = groupWhere + ` OR ${group.id}`
            }
            cnt++;
        }
        if (cnt != 0) {
            groupWhere = groupWhere + `)`
        }
        let other = [
            'categories: /region/jp'
        ].join(" AND ")
        query = `${groupWhere} AND ${other}`
    } else if (selItem.value == "agol") {
        query = [
            'categories: /region/jp'
        ].join(" AND ")
    }

    if (selWord.value.trim().length > 0) {
        let selKeyWord = selWord.value;
        const wordWhere = ` AND (title: ${selKeyWord} OR tags: ${selKeyWord} OR description: ${selKeyWord} OR snippet: ${selKeyWord})`;
        query = query + wordWhere;
    }
    const pqp = new PortalQueryParams({
        query: query,
        filter: getType,
        extent: japanExtent,
        sortField: "title",
        sortOrder: "asc",
        num: 100,
    });

    let results;
    results = await portal.queryItems(pqp);
    results = results.results;
    if (ownerUsers.length == 0 && results.length > 0) {
        let ownerList = results.map(result => result.owner);
        ownerList = Array.from(new Set(ownerList));
        let filterWherer;
        let cnt = 0;
        for (let owner of ownerList) {
            if (cnt == 0) {
                filterWherer = `username: (${owner}`
            } else {
                filterWherer = filterWherer + ` OR ${owner}`
            }
            cnt++;
        }
        if (cnt != 0) {
            filterWherer = filterWherer + `)`
        }
        const ownerUserList = await portal.queryUsers(new PortalQueryParams({
            filter: filterWherer,
            num: 100,
        }));
        ownerUsers = ownerUserList.results;
    }
    let pageNumber = 1;
    let layerListPage;
    const pageSize = 20;
    if (results.length > 0) {
        for (let idx = 0; idx < results.length; idx++) {
            if (idx % pageSize == 0) {
                layerListPage = document.createElement("div");
                layerListPage.setAttribute("data-layer-list-page", pageNumber)
                layerListDiv.append(layerListPage);
                if (idx == 0) {
                    layerListPage.style.display = "block";
                } else {
                    layerListPage.style.display = "none";
                }
                pageNumber++;
            }
            const result = results[idx];
            let alreadyFlg = alreadyAddChecker(result.id, map)
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
            img.src = result.thumbnailUrl ? result.thumbnailUrl : "./images/no-image.png";
            figure.append(img)
            card.append(figure);
            const labelDiv = document.createElement("div");
            const inLabel = document.createElement("calcite-label");
            labelDiv.classList.add("card-bottom")
            labelDiv.slot = "footer-start";
            inLabel.classList.add("inLabel")
            inLabel.layout = "inline";
            const avator = document.createElement("calcite-avatar");
            const user = ownerUsers.find(user => user.username === result.owner);
            let fullName = user && user.fullName ? user.fullName : result.owner;
            avator.fullName = fullName;
            avator.scale = "s"
            inLabel.append(avator);
            const userName = document.createElement("span");
            userName.innerText = fullName;
            inLabel.append(userName);
            labelDiv.append(inLabel)
            card.append(labelDiv);
            const buttonDiv = document.createElement("div");
            buttonDiv.classList.add("card-bottom")
            buttonDiv.slot = "footer-end";
            const addButton = document.createElement("calcite-button");
            addButton.iconStart = alreadyFlg ? "minus" : "plus";
            addButton.kind = alreadyFlg ? "inverse" : "neutral";
            addButton.innerText = alreadyFlg ? "削除" : "追加";
            addButton.scale = "s"
            addButton.name = result.id;
            addButton.addEventListener("click", addDelLayer);
            buttonDiv.append(addButton)
            card.append(buttonDiv);

            layerListPage.append(card)
        }
    } else {
        const noneMessage = document.createElement("div");
        noneMessage.style.width = "100%;"
        noneMessage.style.textAlign = "center";
        noneMessage.innerText = "サービスが 1 件もヒットしませんでした。"
        layerListDiv.append(noneMessage);
    }

    if (results.length > pageSize) {
        const pagenation = document.createElement("calcite-pagination");
        pagenation.pageSize = pageSize;
        pagenation.totalItems = results.length;
        pagenation.style.textAlign = "center";
        layerListDiv.append(pagenation);
        pagenation.addEventListener("calcitePaginationChange", event => {
            const pageIdx = Math.floor(event.target.startItem / event.target.pageSize) + 1;
            const children = layerListDiv.childNodes;
            for (let child of children) {
                if (child.tagName == "DIV") {
                    if (child.getAttribute("data-layer-list-page") == pageIdx) {
                        child.style.display = "block";
                        layerListDiv.scrollTop = 0;
                    } else {
                        child.style.display = "none";
                    }
                }
            }
        });
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
    selElem.id = "item-search-select";
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
    searchArea.scale = "l";
    searchArea.id = "item-serach-word";
    searchArea.addEventListener("calciteInputTextChange", () => changeSearchItemList(layerListDiv).then())

    newFlowItem.append(searchArea)
    newFlowItem.append(layerListDiv)
    changeSearchItemList(layerListDiv).then();
    elem.append(newFlowItem);
    elem.childNodes.forEach(item => item.selected = false);
    newFlowItem.selected = true;
}