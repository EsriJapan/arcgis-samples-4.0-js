let vl;
export default async function designChange(mapEl) {
    const layer = mapEl.basemap
    const pointFlowItem = document.querySelector(`[data-flow-item-id="point"]`)
    const lineFlowItem = document.querySelector(`[data-flow-item-id="line"]`)
    const polygonFlowItem = document.querySelector(`[data-flow-item-id="polygon"]`)

    initSymbolList(pointFlowItem)
    initSymbolList(lineFlowItem)
    initSymbolList(polygonFlowItem)
    // レイヤー判定
    if (layer.id !== "satelite") {
        const vtlayers = layer.baseLayers.getItemAt(0)
        await vtlayers.loadStyle()
        vl = vtlayers;
        const styleLayers = vtlayers.currentStyleInfo.style.layers;
        for (let sl of styleLayers) {
            if (sl.type === "symbol") {
                setSymbolList(sl, pointFlowItem)
            } else if (sl.type === "line") {
                setSymbolList(sl, lineFlowItem)
            } else if (sl.type === "fill") {
                setSymbolList(sl, polygonFlowItem)
            }
        }
    } else {
        console.log("ラスター")
        return;
    }
}

function initSymbolList(elem) {
    // 初期化
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
}

function setSymbolList(layer, elem) {
    const path = layer.metadata.path.split("-");
    let parentElem = elem;
    for (let idx = 0; idx < path.length; idx++) {
        const tag = path[idx];
        if (idx == 0) {
            parentElem = elem;
        } else {
            let pElem = elem;
            for (let subIdx = 0; subIdx < idx; subIdx++) {
                pElem = pElem.querySelector(`[data-block-id=${CSS.escape(path[subIdx])}]`);
            }
            parentElem = pElem;
        }
        let tgElem = parentElem.querySelector(`[data-block-id=${CSS.escape(tag)}]`);
        if (idx == 0) {
            if (!tgElem) {
                tgElem = addBlockElm(parentElem, tag)
            }
        }
        if (idx + 1 == path.length) {
            let tgt = null;
            if (path.length == 1) {
                tgt = tag;
            } else {
                tgt = path[idx - 1];
            }
            const tgtElm = parentElem;
            let tgtListElm = parentElem.querySelector(`[data-list-id=${CSS.escape(tgt)}]`);

            if (!tgtListElm) {
                const listElm = document.createElement("calcite-list");
                listElm.label = tgt;
                listElm.setAttribute("data-list-id", tgt);
                parentElem.prepend(listElm)
                tgtListElm = listElm;
            }

            let listItemElm = parentElem.querySelector(`[data-list-item-id=${CSS.escape(tag)}]`);
            if (listItemElm) {
                if (listItemElm.maxzoom < layer.maxzoom) listItemElm.maxzoom = layer.maxzoom;
                if (listItemElm.minzoom > layer.minzoom) listItemElm.minzoom = layer.minzoom;
                const idArray = JSON.parse(listItemElm.getAttribute("data-list-item-array"))
                idArray.push(layer.id);
                listItemElm.setAttribute("data-list-item-array", JSON.stringify(idArray));
                const chkBox = listItemElm.querySelector("calcite-checkbox");
                chkBox.setAttribute("data-checkbox-array", JSON.stringify(idArray));
            } else {
                listItemElm = document.createElement("calcite-list-item");
                listItemElm.label = tag;
                listItemElm.setAttribute("data-list-item-id", tag);
                listItemElm.setAttribute("data-list-item-array", `["${layer.id}"]`);
                listItemElm.addEventListener("calciteListItemSelect", async event => await creatFlow(event, elem));
                listItemElm.maxzoom = layer.maxzoom;
                listItemElm.minzoom = layer.minzoom;
                const chkBox = document.createElement("calcite-checkbox");
                chkBox.checked = true;
                chkBox.slot = "content-start";
                chkBox.setAttribute("data-checkbox-array", `["${layer.id}"]`);
                chkBox.addEventListener("click", e => e.stopPropagation())
                chkBox.addEventListener("calciteCheckboxChange", event => visibleLayer(event.target, elem));
                listItemElm.prepend(chkBox);
                tgtListElm.prepend(listItemElm);
            }
            if (mapEl.zoom <= listItemElm.maxzoom && mapEl.zoom >= listItemElm.minzoom) {
                listItemElm.style.display = "block";
                if (tgtElm.style.display === "none") {
                    tgtElm.style.display = "block";
                }
            } else {
                listItemElm.style.display = "none";
            }
        } else if (idx > 0) {
            if (!tgElem) {
                const bfTag = path[idx - 1];
                const prtElem = elem.querySelector(`[data-block-id=${CSS.escape(bfTag)}]`);
                tgElem = addBlockElm(prtElem, tag)
            }
        }
    }
}

function addBlockElm(elem, heading) {
    const block = document.createElement("calcite-block");
    block.setAttribute("data-block-id", heading);
    block.heading = heading;
    block.collapsible = true;
    block.style.display = "none";
    const chkBox = document.createElement("calcite-checkbox");
    chkBox.checked = true;
    chkBox.setAttribute("data-checkbox-id", heading);
    chkBox.slot = "content-start";
    chkBox.addEventListener("calciteCheckboxChange", event => visibleGroupe(event.target, block));
    chkBox.addEventListener("click", e => e.stopPropagation())
    block.prepend(chkBox)
    elem.prepend(block)
    return block;
}

function visibleLayer(elem, baseElem) {
    const idArray = JSON.parse(elem.getAttribute("data-checkbox-array"))
    for (let id of idArray) {
        vl.setStyleLayerVisibility(id, elem.checked ? "visible" : "none");
    }

    let pEl = elem.parentElement.parentElement;
    while (pEl && pEl.tagName !== baseElem.tagName) {
        const gpEl = pEl.parentElement;
        if (gpEl.tagName === "CALCITE-BLOCK") {
            if (elem.checked) {
                if (!gpEl.firstElementChild.checked) {
                    gpEl.firstElementChild.checked = true;
                }
            } else {
                const cli = gpEl.querySelectorAll(`calcite-list-item`);
                let chkFlg = false;
                for (let item of cli) {
                    if (item.firstElementChild.checked) {
                        chkFlg = true;
                    }
                }
                if (!chkFlg) {
                    gpEl.firstElementChild.checked = false;
                }
            }
        }
        pEl = gpEl;
    }
}

function visibleGroupe(target, elem) {
    const checked = target.checked;
    const lists = elem.querySelectorAll(`calcite-list-item`);
    for (let item of lists) {
        let visible;
        if (checked) {
            item.firstElementChild.checked = true;
            visible = "visible";
        } else {
            item.firstElementChild.checked = false;
            visible = "none"
        }
        const idArray = JSON.parse(item.getAttribute("data-list-item-array"))
        for (let id of idArray) {
            vl.setStyleLayerVisibility(id, visible);
        }
    }
    const blocks = elem.querySelectorAll("calcite-block");
    for (let block of blocks) {
        block.firstElementChild.checked = checked;
    }
}

async function creatFlow(event, elem) {
    const [
        reactiveUtils
    ] = await $arcgis.import([
        "@arcgis/core/core/reactiveUtils.js"
    ]);
    const newFlowItem = document.createElement("calcite-flow-item");
    newFlowItem.addEventListener("calciteFlowItemBack", () => {
        newFlowItem.remove();
    });
    newFlowItem.heading = event.target.label;
    newFlowItem.description = elem.parentElement.parentElement.heading;

    const tabs = document.createElement("calcite-tabs");
    newFlowItem.append(tabs);
    const tabNav = document.createElement("calcite-tab-nav");
    tabs.append(tabNav);
    const idArray = JSON.parse(event.target.getAttribute("data-list-item-array"));
    let idx = 1;
    for (let id of idArray) {
        const tabTitle = document.createElement("calcite-tab-title");
        tabTitle.innerText = event.target.label + idx;
        tabTitle.setAttribute("data-tab-title-id", id);
        tabTitle.style.display = "none";
        tabNav.append(tabTitle);
        tabNav.slot = "title-group";

        const tab = document.createElement("calcite-tab");
        const block1 = document.createElement("calcite-block");
        block1.heading = "スタイル"
        block1.collapsible = true;
        block1.expanded = true;

        const block2 = document.createElement("calcite-block");
        block2.heading = "レイアウト"
        block2.collapsible = true;
        block2.expanded = true;

        if (idx == 1) tab.selected = true;
        tab.append(block1);
        tab.append(block2);
        tabs.append(tab)
        setPropertyFields(id, block1, block2);
        idx++;
    }
    const flowItems = elem.parentElement.querySelectorAll("calcite-flow-item");
    flowItems.forEach(item => item.selected = false);
    elem.parentElement.append(newFlowItem);
    newFlowItem.selected = true;
    changeFlowTabItem(tabNav, newFlowItem.parentElement);

    const mapEl = document.querySelector("arcgis-map");
    reactiveUtils.watch(() => mapEl.view.stationary, function (event) {
        changeFlowTabItem(tabNav, newFlowItem.parentElement);
    });
}

function changeFlowTabItem(tabNav, flow) {
    let dispCnt = 0;
    const mapEl = document.querySelector("arcgis-map");
    let firstFlg = true;
    for (let tabTitle of tabNav.children) {
        const id = tabTitle.getAttribute("data-tab-title-id");
        const obj = vl.getStyleLayer(id);
        if (obj.minzoom <= mapEl.zoom && obj.maxzoom >= mapEl.zoom) {
            if (firstFlg && tabTitle.style.display == "none") tabTitle.selected = true;
            tabTitle.style.display = "block";
            firstFlg = false;
            dispCnt++;
        } else {
            tabTitle.style.display = "none";
        }
    }

    if (dispCnt == 0) {
        if (flow) {
            flow.back();
        }
    }
}

function setPropertyFields(lyrId, block1, block2) {
    const obj = vl.getStyleLayer(lyrId);
    if (obj.type == "symbol") {
        setMultiPatternElem(obj, lyrId, block2, "icon-size", "アイコンの倍率", false, "layout", ["ズーム", "倍率"]);
        const ipaOpt = [
            { auto: "自動" },
            { viewport: "ビューポイント" },
            { map: "平面" }
        ]
        setSelectElem(obj, lyrId, block2, "icon-pitch-alignment", "マップを傾けたときのアイコンの向き", ipaOpt, "layout")
        const iraOpt = [
            { auto: "自動" },
            { viewport: "ビューポイント" },
            { map: "平面" }
        ]
        setSelectElem(obj, lyrId, block2, "icon-rotation-alignment", "アイコンの回転", iraOpt, "layout");
        const iaOpt = [
            { center: "中央" },
            { left: "左" },
            { right: "右" },
            { top: "上" },
            { bottom: "下" },
            { "top-left": "左上" },
            { "top-right": "右上" },
            { "bottom-left": "左下" },
            { "bottom-right": "右下" }
        ]
        setSelectElem(obj, lyrId, block2, "icon-anchor", "アイコンの表示位置", iaOpt, "layout");
        setCheckBox(obj, lyrId, block2, "icon-allow-overlap", "シンボルが他のレイヤーと競合した場合に表示する。", "layout");
        setNumElem(obj, lyrId, block2, "text-max-width", "折り返しの行幅", false, "layout");
        setCheckBox(obj, lyrId, block2, "text-allow-overlap", "テキストが他のレイヤーと競合した場合に表示する。", "layout");
        if (obj.paint) {
            setColorPicker(obj, lyrId, block1, "text-color", "文字の");
            setColorPicker(obj, lyrId, block1, "text-halo-color", "文字枠の");
            setNumElem(obj, lyrId, block1, "text-halo-width", "文字枠の太さ", false, "paint");
            setMultiPatternElem(obj, lyrId, block2, "text-size", "テキストの大きさ", false, "layout", ["ズーム", "サイズ"]);
            const twmOpt = [
                { horizontal: "横" },
                { vertical: "縦" }
            ]
            setSelectElem(obj, lyrId, block2, "text-writing-mode", "縦横表示モード", twmOpt, "layout")
            const tpaOpt = [
                { auto: "自動" },
                { viewport: "ビューポイント" },
                { map: "平面" }
            ]
            setSelectElem(obj, lyrId, block2, "text-pitch-alignment", "マップを傾けたときのアイコンの向き", tpaOpt, "layout")
            const iraOpt = [
                { auto: "自動" },
                { viewport: "ビューポイント" },
                { map: "平面" }
            ]
            setSelectElem(obj, lyrId, block2, "text-rotation-alignment", "テキストの回転", iraOpt, "layout");
            const iaOpt = [
                { center: "中央" },
                { left: "左" },
                { right: "右" },
                { top: "上" },
                { bottom: "下" },
                { "top-left": "左上" },
                { "top-right": "右上" },
                { "bottom-left": "左下" },
                { "bottom-right": "右下" }
            ]
            setSelectElem(obj, lyrId, block2, "text-anchor", "テキストの表示位置", iaOpt, "layout");
        }
    } else if (obj.type == "line") {
        setColorPicker(obj, lyrId, block1, "line-color", "");
        setMultiPatternElem(obj, lyrId, block1, "line-width", "ラインの幅", false, "paint", ["ズーム", "幅"]);
        const capOpt = [
            { butt: "終端なし" },
            { round: "半円" },
            { square: "線の幅の半分" }
        ]
        setSelectElem(obj, lyrId, block2, "line-cap", "線の終端の形状", capOpt, "layout")
        const joinOpt = [
            { bevel: "はみ出しなし" },
            { round: "交差する地点が中心で半径が線幅の半分となる円" },
            { miter: "外側の縁を延長してできる三角形" }
        ]
        setSelectElem(obj, lyrId, block2, "line-join", "線の接続部の形状", joinOpt, "layout");
        const olOpt = [
            { outline: "アウトライン" }
        ]
        setSelectElem(obj, lyrId, block2, "line-join", "線の接続部の形状", olOpt, "layout");
        setNumArrayText(obj, lyrId, block1, "line-dasharray", "線の破線", "paint");
    } else if (obj.type == "fill") {
        block2.style.display = "none"
        setColorPicker(obj, lyrId, block1, "fill-color", "塗りつぶしの")
    }
}

function setColorPicker(obj, lyrId, block, colorPropName, discription) {
    const colorLabel = document.createElement("calcite-label");
    colorLabel.innerText = discription + "カラー ピッカー";
    const colorPicker = document.createElement("calcite-color-picker")
    colorPicker.value = obj.paint[colorPropName];
    colorPicker.savedDisabled = false;
    colorPicker.addEventListener("calciteColorPickerChange", event => {
        const setProp = obj.paint;
        setProp[colorPropName] = event.target.value;
        changePaintVisualization(lyrId, setProp)
    })
    colorLabel.append(colorPicker);
    block.append(colorLabel)
}

function setNumElem(obj, lyrId, block, propName, discription, intFlg, paintLayout) {
    const numLabel = document.createElement("calcite-label");
    numLabel.innerText = discription;
    numLabel.layout = "inline";
    const numElem = document.createElement("calcite-input-number");
    numElem.integer = intFlg;
    if (obj[paintLayout][propName]) {
        numElem.value = obj[paintLayout][propName].toString();
    }

    numElem.min = 0
    numLabel.append(numElem)
    numElem.addEventListener("calciteInputNumberChange", event => {
        const setProp = obj[paintLayout];
        setProp[propName] = event.target.value;
        if (paintLayout == "paint") {
            changePaintVisualization(lyrId, setProp)
        } else {
            if (obj.type == "symbol" && !obj.paint) {
                recreateLayoutVisualization(lyrId, setProp);
            } else {
                changeLayoutVisualization(lyrId, setProp)
            }
        }
    })
    block.append(numLabel);
}

function setSelectElem(obj, lyrId, block, propName, discription, options, paintLayout) {
    const selLabel = document.createElement("calcite-label");
    selLabel.innerText = discription + "リスト";
    const selElem = document.createElement("calcite-select");
    const nullCo = document.createElement("calcite-option");
    nullCo.value = null;
    selElem.append(nullCo);
    for (let option of options) {
        for (let key of Object.keys(option)) {
            const co = document.createElement("calcite-option");
            co.value = key;
            co.innerText = option[key];
            selElem.append(co);
        }
    }
    if (obj[paintLayout][propName]) selElem.value = obj[paintLayout][propName];
    selElem.addEventListener("calciteSelectChange", event => {
        const setProp = obj[paintLayout];
        setProp[propName] = event.target.value;
        if (paintLayout == "paint") {
            changePaintVisualization(lyrId, setProp)
        } else {
            changeLayoutVisualization(lyrId, setProp)
        }
    });

    selLabel.append(selElem)
    block.append(selLabel);
}

function setCheckBox(obj, lyrId, block, propName, discription, paintLayout) {
    const cbLabel = document.createElement("calcite-label");
    cbLabel.layout = "inline";
    const cbElem = document.createElement("calcite-checkbox");
    cbElem.checked = true;
    if (obj[paintLayout][propName] && obj[paintLayout][propName] == "none") {
        cbElem.checked = false;
    }
    cbElem.addEventListener("calciteCheckboxChange", event => {
        const setProp = obj[paintLayout];
        setProp[propName] = event.target.checked ? "visible" : "none";
        if (paintLayout == "paint") {
            changePaintVisualization(lyrId, setProp)
        } else {
            changeLayoutVisualization(lyrId, setProp)
        }
    })
    cbLabel.innerText = discription;
    cbLabel.append(cbElem);
    block.append(cbLabel)
}

function setMultiPatternElem(obj, lyrId, block, propName, discription, intFlg, paintLayout, label) {
    const target = obj[paintLayout][propName];
    if (target && target.stops) {
        setMultiNumTable(obj, lyrId, block, propName, discription, intFlg, paintLayout, label);
    } else {
        setNumElem(obj, lyrId, block, propName, discription, intFlg, paintLayout);
    }
}

function setMultiNumTable(obj, lyrId, block, propName, discription, intFlg, paintLayout, label) {
    const stops = obj[paintLayout][propName].stops;
    const tableLabel = document.createElement("calcite-label");
    tableLabel.innerText = discription;
    const table = document.createElement("calcite-table");
    table.style.width = "100%";
    table.caption = discription;
    const headTableRow = document.createElement("calcite-table-row");
    table.append(headTableRow);
    for (let head of label) {
        const headCell = document.createElement("calcite-table-header");
        headCell.heading = head;
        headTableRow.append(headCell);
    }

    let count = 0;
    for (let stop of stops) {
        const tableRow = document.createElement("calcite-table-row");
        table.append(tableRow);
        for (let cell of stop) {
            const cellElm = document.createElement("calcite-table-cell");
            tableRow.append(cellElm);
            if (tableRow.children.length == 1) {
                const tag = document.createElement("div");
                tag.innerText = cell;
                tag.style.width = "100%";
                tag.style.textAlign = "center";
                cellElm.append(tag);
            } else if (tableRow.children.length == 2) {
                const numElem = document.createElement("calcite-input-number");
                numElem.integer = intFlg;
                numElem.value = cell.toString();
                numElem.min = 0;
                numElem.rowNum = count;
                cellElm.append(numElem)
                numElem.addEventListener("calciteInputNumberChange", event => {
                    const setProp = obj[paintLayout];
                    const rowNum = event.target.rowNum;
                    setProp[propName].stops[rowNum][1] = Number(event.target.value);
                    if (paintLayout == "paint") {
                        changePaintVisualization(lyrId, setProp)
                    } else {
                        changeLayoutVisualization(lyrId, setProp)
                    }
                })
            }
        }
        count++;
    }
    tableLabel.append(table);
    block.append(tableLabel)
}

function setNumArrayText(obj, lyrId, block, propName, discription, paintLayout) {
    const inputLabel = document.createElement("calcite-label");
    inputLabel.layout = "inline";
    inputLabel.innerText = discription;
    const inputElem = document.createElement("calcite-input");
    inputElem.placeholder = "ラインを破線にする場合は破線の感覚をカンマ区切りで入力してください。";
    if (obj[paintLayout][propName]) {
        let txt = "";
        for (let len of obj[paintLayout][propName]) {
            if (txt.length > 0) txt += ", ";
            txt += len;
        }
        inputElem.value = txt;
    }
    inputElem.addEventListener("calciteInputChange", event => {
        const setProp = obj[paintLayout];
        let setValue = [];
        const separateList = event.target.value.trim().split(",");
        for (let sepVal of separateList) {
            if (sepVal && !/^[.]+$/.test(sepVal.substr(-1))) {
                setValue.push(Number(sepVal));
            }
        }
        setProp[propName] = setValue;
        if (paintLayout == "paint") {
            changePaintVisualization(lyrId, setProp)
        } else {
            changeLayoutVisualization(lyrId, setProp)
        }
    });
    inputElem.addEventListener("calciteInputInput", event => {
        if (!inputRestrictions(event.target.value)) {
            event.target.value = event.target.value.slice(0, -1)
        }
    });
    inputLabel.append(inputElem)
    block.append(inputLabel);
}

function inputRestrictions(inputValue) {
    if (/^[0-9.,\s]+$/.test(inputValue.substr(-1))) {
        return true;
    } else {
        return false;
    }
}

function changePaintVisualization(lyrId, paint) {
    vl.setPaintProperties(lyrId, paint)
    vl.loadStyle().then(() => {
        vl.refresh()
    })
}

function changeLayoutVisualization(lyrId, layout) {
    vl.setLayoutProperties(lyrId, layout);
    vl.loadStyle().then(() => {
        vl.refresh()
    })
}

function recreateLayoutVisualization(lyrId, layout) {
    const lyrIdx = vl.getStyleLayerIndex(lyrId);
    const layer = JSON.parse(JSON.stringify(vl.getStyleLayer(lyrId)));
    layer.layout = layout;
    vl.deleteStyleLayer(lyrId);
    vl.setStyleLayer(layer, lyrIdx);

    vl.loadStyle().then(() => {
        vl.refresh()
    })
}