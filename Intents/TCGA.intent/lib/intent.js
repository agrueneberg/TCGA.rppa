(function () {
    "use strict";

    var intent, targets, filesDownloaded;

    intent = window.webkitIntent;
    if (intent) {
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
                $.ajax(item).done(function (data) {
                    filesDownloaded++;
                    $(".progress .bar").css("width", ((filesDownloaded / targets.length) * 100) + "%");
                    callback(null, {
                        body: data,
                        uri: item
                    });
                }).fail(function (xhr) {
                    callback("Downloading '" + item + "' failed: " + xhr.status, null);
                });
            }, function (err, res) {
                if (err !== null) {
                    intent.postFailure(err);
                } else {
                    intent.postResult(res);
                }
            });
        }
    }

}());
