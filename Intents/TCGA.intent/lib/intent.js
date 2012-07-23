(function () {
    "use strict";

    var intent, targets, filesDownloaded;

    intent = window.webkitIntent;
    if (intent) {
        $("#about").hide();
        if (intent.action === "http://mathbiol.org/intents/tcga/download") {
            targets = [];
            if (intent.type === "text/uri-list" && typeof intent.data === "string") {
                intent.data.split("\n").forEach(function (uri) {
                    if (uri !== "") {
                        targets.push(uri);
                    }
                });
            } else {
                intent.postFailure("Invalid Intent type.");
            }
            $("#download-intent").show();
            filesDownloaded = 0;
            async.map(targets, function (item, callback) {
                $.get(item, function (data) {
                    filesDownloaded++;
                    $(".progress .bar").css("width", ((filesDownloaded / targets.length) * 100) + "%");
                    callback(null, {
                        body: data,
                        uri: item
                    });
                });
            }, function (err, res) {
                intent.postResult(res);
            });
        }
    }

}());
