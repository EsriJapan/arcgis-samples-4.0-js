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
    for (let idx = 0; idx < path.length; idx++) {
        const tag = path[idx];
        const tgElem = elem.querySelector(`[data-block-id=${CSS.escape(tag)}]`);
        if (idx == 0) {
            if (!tgElem) {
                addBlockElm(elem, tag)
            }
        }
        if (idx + 1 == path.length) {
            let tgt = null;
            if (path.length == 1) {
                tgt = path[idx];
            } else {
                tgt = path[idx - 1];
            }
            const tgtElm = elem.querySelector(`[data-block-id=${CSS.escape(tgt)}]`);
            let tgtListElm = elem.querySelector(`[data-list-id=${CSS.escape(tgt)}]`);

            if (!tgtListElm) {
                const listElm = document.createElement("calcite-list");
                listElm.label = tgt;
                listElm.setAttribute("data-list-id", tgt);
                tgtElm.append(listElm)
                tgtListElm = listElm;
            }

            const listItemElm = document.createElement("calcite-list-item");
            listItemElm.label = path[idx];
            listItemElm.setAttribute("value", layer.id);
            listItemElm.setAttribute("data-list-item-id", layer.id);
            listItemElm.addEventListener("calciteListItemSelect", event => creatFlow(event, elem));
            listItemElm.maxzoom = layer.maxzoom;
            listItemElm.minzoom = layer.minzoom;
            const chkBox = document.createElement("calcite-checkbox");
            chkBox.checked = true;
            chkBox.slot = "content-start";
            chkBox.setAttribute("value", layer.id);
            chkBox.setAttribute("data-ckeckbox-id", layer.id);
            chkBox.addEventListener("click", e => e.stopPropagation())
            chkBox.addEventListener("calciteCheckboxChange", event => visibleLayer(event.target, elem));
            listItemElm.append(chkBox);
            tgtListElm.append(listItemElm);
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
                addBlockElm(prtElem, tag)
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
    block.append(chkBox)
    elem.append(block)
}

function visibleLayer(elem, baseElem) {
    vl.setStyleLayerVisibility(elem.value, elem.checked ? "visible" : "none");

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
        vl.setStyleLayerVisibility(item.value, visible)
    }
    const blocks = elem.querySelectorAll("calcite-block");
    for (let block of blocks) {
        block.firstElementChild.checked = checked;
    }
}

function creatFlow(event, elem) {
    const newFlowItem = document.createElement("calcite-flow-item");
    newFlowItem.addEventListener("calciteFlowItemBack", () => {
        newFlowItem.remove();
    });
    newFlowItem.heading = event.target.label;
    newFlowItem.description = elem.parentElement.parentElement.heading;
    const block1 = document.createElement("calcite-block");
    block1.heading = "スタイル"
    block1.collapsible = true;

    const block2 = document.createElement("calcite-block");
    block2.heading = "レイアウト"
    block2.collapsible = true;

    newFlowItem.append(block2);
    newFlowItem.append(block1);
    elem.parentElement.append(newFlowItem);
    const flowItems = elem.parentElement.querySelectorAll("calcite-flow-item");
    flowItems.forEach(item => item.selected = false);
    newFlowItem.selected = true;
    setPropertyFields(event.target.value, block1, block2);
}

function setPropertyFields(lyrId, block1, block2) {
    const obj = vl.getStyleLayer(lyrId);
    if (obj.type == "symbol") {
        console.log("point obj", obj)
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
        console.log("line obj", obj)
        setColorPicker(obj, lyrId, block1, "line-color", "");
        setNumElem(obj, lyrId, block1, "line-width", "ラインの幅", false, "paint");
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
        console.log("polygon obj", obj)
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
            changeLayoutVisualization(lyrId, setProp)
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
                    console.log("setProp", setProp)
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
    console.log("paint", paint)
    vl.setPaintProperties(lyrId, paint)
    vl.refresh();
}

function changeLayoutVisualization(lyrId, layout) {
    console.log("layout", layout)
    vl.setLayoutProperties(lyrId, layout);
    vl.refresh();
}

