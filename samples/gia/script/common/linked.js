const mapEl = document.getElementById("mapEl");
const sceneEl = document.getElementById("sceneEl");
const bookmark = document.querySelector("arcgis-bookmarks");
let bmf = false;
const [
    reactiveUtils
] = await $arcgis.import([
    "@arcgis/core/core/reactiveUtils.js"
]);
await mapEl.viewOnReady();
await sceneEl.viewOnReady();
reactiveUtils.watch(() => mapEl.basemap, () => {
    sceneEl.basemap = mapEl.basemap
});


const views = [mapEl.view, sceneEl.view];
let active;

const sync = (source) => {
    if (!active || !active.viewpoint || active !== source) {
        return;
    }

    for (const view of views) {
        if (view !== active) {
            // Clone current viewpoint
            const activeViewpoint = active.viewpoint.clone();

            // Adjust scale by cosine of latitude to account for distance distortion as latitude moves away from the equator
            const latitude = active.center.latitude;
            const scaleConversionFactor = Math.cos((latitude * Math.PI) / 180.0);
            if (active.type === "3d") {
                activeViewpoint.scale /= scaleConversionFactor;
            } else {
                activeViewpoint.scale *= scaleConversionFactor;
            }

            // Sync viewpoint to other view
            view.viewpoint = activeViewpoint;
        }
    }
};

for (const view of views) {
    const handle = reactiveUtils.watch(
        () => [view.interacting, view.viewpoint],
        ([interacting, viewpoint]) => {
            // Only print the new zoom value when the view is stationary
            if (interacting) {
                active = view;
                sync(active);
            }
            if (viewpoint) {
                sync(view);
            }
        },
    );
}