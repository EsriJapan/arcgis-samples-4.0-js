require([
    "esri/Map",
    "esri/Color",
    "esri/views/SceneView",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/symbols/PolygonSymbol3D",
    "esri/symbols/ExtrudeSymbol3DLayer",
    "esri/renderers/SimpleRenderer",

    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/tasks/Geoprocessor",
    "esri/tasks/support/LinearUnit",
    "esri/tasks/support/FeatureSet",

    "dojo/domReady!"
], function(Map, Color, SceneView, MapView, FeatureLayer, PolygonSymbol3D,
    ExtrudeSymbol3DLayer, SimpleRenderer,
    GraphicsLayer, Graphic, Point,
    SimpleMarkerSymbol, SimpleFillSymbol, Geoprocessor,
    LinearUnit, FeatureSet
    ) {

    var gpUrl = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Elevation/ESRI_Elevation_World/GPServer/Viewshed";

    var map1 = new Map({
        basemap: "hybrid",
        ground: "world-elevation"
    });
    
    var map2 = new Map({
        basemap: "hybrid",
        ground: "world-elevation"
    });

    var view1 = new MapView({
    container: "viewDiv1",
    map: map1,
    center: [7.59564, 46.06595],
    scale: 10000
    });
    
    var view2 = new SceneView({
    container: "viewDiv2",
    map: map2,
    camera: { // autocasts as new Camera()
        position: [7.59564, 46.06595, 5184],
        tilt: 70
    }
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
    var graphicsLayer1 = new GraphicsLayer();
    var graphicsLayer2 = new GraphicsLayer();
    
    map1.add(featureLayer1);
    map2.add(featureLayer2);
    map1.add(graphicsLayer1);
    map2.add(graphicsLayer2);

    var markerSymbol = new SimpleMarkerSymbol({
      color: [255, 0, 0],
      outline: { // autocasts as new SimpleLineSymbol()
        color: [255, 255, 255],
        width: 2
      }
    });

    var fillSymbol = new SimpleFillSymbol({
      color: [226, 119, 40, 0.75],
      outline: { // autocasts as new SimpleLineSymbol()
        color: [255, 255, 255],
        width: 1
      }
    });

    var gp = new Geoprocessor(gpUrl);
    gp.outSpatialReference = { // autocasts as new SpatialReference()
      wkid: 102100
    };
    view1.on("click", computeViewshed);
    view2.on("click", computeViewshed);

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

    function computeViewshed(evt) {
      graphicsLayer1.removeAll();
      graphicsLayer2.removeAll();

      var point = new Point({
        longitude: evt.mapPoint.longitude,
        latitude: evt.mapPoint.latitude
      });

      var inputGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol
      });

      graphicsLayer1.add(inputGraphic);
      graphicsLayer2.add(inputGraphic);

      var inputGraphicContainer = [];
      inputGraphicContainer.push(inputGraphic);
      var featureSet = new FeatureSet();
      featureSet.features = inputGraphicContainer;

      var vsDistance = new LinearUnit();
      vsDistance.distance = 5;
      vsDistance.units = "esriMiles";

      var params = {
        "Input_Observation_Point": featureSet,
        "Viewshed_Distance": vsDistance
      };

      gp.execute(params).then(drawResultData);
    }

    function drawResultData(result) {
      var resultFeatures = result.results[0].value.features;

      // Assign each resulting graphic a symbol
      var viewshedGraphics = resultFeatures.map(function(feature) {
        feature.symbol = fillSymbol;
        return feature;
      });

      // Add the resulting graphics to the graphics layer
      graphicsLayer1.addMany(viewshedGraphics);
      graphicsLayer2.addMany(viewshedGraphics);

      /********************************************************************    
       * Animate to the result. This is a temporary workaround
       * for animating to an array of graphics in a SceneView. In a future 
       * release, you will be able to replicate this behavior by passing
       * the graphics directly to the goTo function, like the following:
       *    
       * view.goTo(viewshedGraphics);
       ********************************************************************/
      view1.goTo({
        target: viewshedGraphics,
        tilt: 0
      });
      view2.goTo({
        target: viewshedGraphics,
        tilt: 0
      });
    }

});