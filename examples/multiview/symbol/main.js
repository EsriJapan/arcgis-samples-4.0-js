require([
    "esri/Map",
    "esri/Color",
    "esri/views/SceneView",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/symbols/PolygonSymbol3D",
    "esri/symbols/ExtrudeSymbol3DLayer",
    "esri/renderers/SimpleRenderer",
    "dojo/domReady!"
], function(Map, Color, SceneView, MapView, FeatureLayer, PolygonSymbol3D,
    ExtrudeSymbol3DLayer, SimpleRenderer) {

    var map1 = new Map({
    basemap: "streets"
    });
    
    var map2 = new Map({
    basemap: "streets"
    });

    var view1 = new MapView({
    container: "viewDiv1",
    map: map1,
    center: [139.7661, 35.6814],
    scale: 10000
    });
    
    var view2 = new SceneView({
    container: "viewDiv2",
    map: map2,
    center: [139.7661, 35.6814],
    scale: 10000
    });

    var featureLayer1 = new FeatureLayer({
    url: "http://services.arcgis.com/wlVTGRSYTzAbjjiC/arcgis/rest/services/TYO%E9%A7%85%E5%91%A8%E8%BE%BA%E5%BB%BA%E7%89%A92/FeatureServer/0"
    });
    var featureLayer2 = new FeatureLayer({
    url: "http://services.arcgis.com/wlVTGRSYTzAbjjiC/arcgis/rest/services/TYO%E9%A7%85%E5%91%A8%E8%BE%BA%E5%BB%BA%E7%89%A92/FeatureServer/0",
    elevationInfo: {
        mode: "absoluteHeight"
    }
    });
    
    map1.add(featureLayer1);
    map2.add(featureLayer2);

    // グラフィックの 3D 立ち上げ
    var extrudePolygonRenderer = new SimpleRenderer({
    symbol: new PolygonSymbol3D({
        symbolLayers: [new ExtrudeSymbol3DLayer()]
    }),
    visualVariables: [{
        type: "size",
        field: "HEIGHT",
        minSize: 0,
        maxSize: 100,
        minDataValue: 0,
        maxDataValue: 1000
    }, {
        type: "color",
        field: "HEIGHT",
        minDataValue: 1,
        maxDataValue: 1000,
        colors: [
        new Color("white"),
        new Color("red")
        ]
    }]
    });

    featureLayer2.renderer = extrudePolygonRenderer;
});