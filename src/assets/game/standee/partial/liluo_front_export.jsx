#target photoshop

(function () {
  if (!app.documents.length) {
    alert("请先打开 liluo_front.psd，再运行这个脚本。");
    return;
  }

  var sourceDoc = app.activeDocument;
  var outputFolder = sourceDoc.fullName.parent;
  var doc = sourceDoc.duplicate(sourceDoc.name + "_export_temp", false);
  var exportedCount = 0;

  function sanitizeFileName(name) {
    return String(name)
      .replace(/[\\\/:*?"<>|]/g, "_")
      .replace(/^\s+|\s+$/g, "")
      .replace(/\s+/g, "_");
  }

  function exportFile(folder, baseName) {
    var safeBaseName = sanitizeFileName(baseName) || "未命名图层";
    return new File(folder + "/" + safeBaseName + ".png");
  }

  function typeIndexFromBottom(layers, currentIndex, typename) {
    var index = 0;

    for (var i = layers.length - 1; i > currentIndex; i -= 1) {
      if (layers[i].typename === typename && layers[i].name !== "参考") {
        index += 1;
      }
    }

    return index;
  }

  function hideAll(layers) {
    for (var i = 0; i < layers.length; i += 1) {
      layers[i].visible = false;

      if (layers[i].typename === "LayerSet") {
        hideAll(layers[i].layers);
      }
    }
  }

  function exportPng(targetFile) {
    var options = new ExportOptionsSaveForWeb();
    options.format = SaveDocumentType.PNG;
    options.PNG8 = false;
    options.transparency = true;
    options.interlaced = false;
    options.includeProfile = false;

    app.activeDocument.exportDocument(targetFile, ExportType.SAVEFORWEB, options);
  }

  function exportLayers(layers, groupPath, visiblePath, indexPath) {
    for (var i = 0; i < layers.length; i += 1) {
      var layer = layers[i];

      if (layer.typename === "LayerSet") {
        if (layer.name === "参考") {
          continue;
        }

        var groupIndex = typeIndexFromBottom(layers, i, "LayerSet");

        exportLayers(
          layer.layers,
          groupPath.concat([layer.name]),
          visiblePath.concat([layer]),
          indexPath.concat([groupIndex])
        );
        continue;
      }

      if (layer.typename !== "ArtLayer") {
        continue;
      }

      hideAll(doc.layers);

      for (var j = 0; j < visiblePath.length; j += 1) {
        visiblePath[j].visible = true;
      }

      layer.visible = true;

      var groupName = groupPath.length ? groupPath.join("-") : "未分组";
      var layerIndex = typeIndexFromBottom(layers, i, "ArtLayer");
      var exportIndexPath = indexPath.length ? indexPath.concat([layerIndex]) : [0, layerIndex];

      var targetFile = exportFile(
        outputFolder,
        groupName + "-" + layer.name + "(" + exportIndexPath.join("-") + ")"
      );
      exportPng(targetFile);
      exportedCount += 1;
    }
  }

  var originalRulerUnits = app.preferences.rulerUnits;
  app.preferences.rulerUnits = Units.PIXELS;

  try {
    app.activeDocument = doc;
    exportLayers(doc.layers, [], [], []);
    alert("导出完成，共导出 " + exportedCount + " 个图层。");
  } catch (error) {
    alert("导出失败：" + error.message);
  } finally {
    app.activeDocument = doc;
    doc.close(SaveOptions.DONOTSAVECHANGES);
    app.activeDocument = sourceDoc;
    app.preferences.rulerUnits = originalRulerUnits;
  }
})();
