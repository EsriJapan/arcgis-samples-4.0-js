export default async function displayChangeElem(mapEl, parentNode) {
    const listItemElmList = parentNode.querySelectorAll(`[data-list-item-id]`);

    for (let listItemElm of listItemElmList) {
        const parentNode = listItemElm.parentNode.parentNode;
        if (mapEl.zoom <= listItemElm.maxzoom && mapEl.zoom >= listItemElm.minzoom) {
            listItemElm.style.display = "block";
            if (parentNode.style.display == "none") {
                parentNode.style.display = "block";
            }
        } else {
            listItemElm.style.display = "none";
        }
    }

    const blockNodes = parentNode.querySelectorAll(`[data-block-id]`);
    const reverseBlockNodes = Array.from(blockNodes).reverse();
    for (let block of reverseBlockNodes) {
        let noneFlg = true;
        for (let blockChild of block.children) {
            if (blockChild.tagName == "CALCITE-LIST") {
                for (let child of blockChild.children) {
                    if (child.tagName == "CALCITE-LIST-ITEM") {
                        if (child.style.display == "block") {
                            noneFlg = false;
                            break;
                        }
                    }
                }
            } else if (blockChild.tagName == "CALCITE-BLOCK") {
                if (blockChild.style.display == "block") noneFlg = false;
            }
        }
        if (noneFlg) {
            block.style.display = "none";
        } else {
            block.style.display = "block";
        }
    }
}