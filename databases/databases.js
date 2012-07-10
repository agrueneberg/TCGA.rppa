(function () {
    "use strict";

    TCGA.loadScript({
        registerModules: false,
        scripts: ["https://raw.github.com/caolan/async/master/dist/async.min.js"]
    }, function () {

        var databases;

     // Check the state of supported databases.
        databases = {};
        chrome.permissions.getAll(function (permissions) {
            var origins;
         // Skip the non-optional origin.
            origins = permissions.origins.slice(1);
            async.map(origins, function (origin, callback) {
                chrome.permissions.contains({
                    origins: [origin]
                }, function (result) {
                    databases[origin] = result;
                    callback();
                });
            }, function () {

             // Register tab.
                TCGA.ui.registerTab({
                    id: "databases",
                    title: "Databases",
                    content: "<div class=\"page-header\"><h1>Databases <small>Activate third-party databases for use with the TCGA Toolbox.</small></h1></div><p><span class=\"label label-info\">Info</span> This module allows you to activate or deactivate communication with databases other than TCGA. However, it will not add an API to those databases.</p><h2>UniProt</h2><p>UniProt is a comprehensive resource for protein sequence and annotation data.</p><button class=\"databases-toggle\" data-database-name=\"UniProt\" data-database-url=\"http://beta.sparql.uniprot.org/*\" class=\"btn\"></button>",
                    switchTab: true
                });

             // Update state of buttons.
                $(".databases-toggle").each(function (i, button) {
                    var database;
                    database = button.dataset.databaseUrl;
                    if (databases[database] === true) {
                        button.innerText = "Deactivate " + button.dataset.databaseName;
                    } else {
                        button.innerText = "Activate " + button.dataset.databaseName;
                    }
                });

                $(".databases-toggle").click(function (ev) {
                    var button, database;
                    button = ev.target;
                    database = button.dataset.databaseUrl;
                    if (databases[database] === true) {
                        chrome.permissions.remove({
                            origins: [database]
                        }, function (removed) {
                            if (removed === true) {
                                databases[database] = false;
                                button.innerText = "Activate " + button.dataset.databaseName;
                            } else {
                                console.err("Origin was not removed.");
                            }
                        });
                    } else {
                        chrome.permissions.request({
                            origins: [database]
                        }, function (granted) {
                            if (granted === true) {
                                databases[database] = true;
                                button.innerText = "Deactivate " + button.dataset.databaseName;
                            } else {
                                console.err("Origin was not granted.");
                            }
                        });
                    }
                });

            });
        });

    });

}());
