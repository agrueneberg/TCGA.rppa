(function () {
    "use strict";

    var intent, targets, filesDownloaded;

    intent = window.webkitIntent;
    if (intent) {
        $("#about").hide();
        if (intent.action === "http://mathbiol.org/intents/download") {
            $("#download-intent").show();
            if (intent.type === "text/uri-list") {
                targets = intent.data;
            }
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
