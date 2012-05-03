(function () {
    "use strict";

 // Load dependencies.
    TCGA.loadScript(["https://raw.github.com/caolan/async/master/dist/async.min.js",
                     "https://raw.github.com/agrueneberg/Ganesha/master/ganesha.js",
                     "https://raw.github.com/agrueneberg/Spearson/master/lib/spearson.js",
                     "https://raw.github.com/mbostock/d3/master/d3.v2.min.js",
                     "https://raw.github.com/agrueneberg/Viz/master/barchart/barchart.js",
                     "https://raw.github.com/agrueneberg/Viz/master/heatmap/heatmap.js"], function () {

        var query;

     // Register tab.
        TCGA.registerTab({
            id: "rppa",
            title: "RPPA",
            content: "<style>rect.bar {stroke: white; fill: steelblue} .axis path,.axis line {fill: none; stroke: black; shape-rendering: crispEdges} .axis text {font-family: sans-serif; font-size: 11px}</style><div class=\"page-header\"><h1>RPPA</h1></div><div id=\"rppa-progress-bar\" class=\"well\"><p></p><div class=\"progress progress-striped active\"><div class=\"bar\"></div></div></div><div id=\"rppa-content-options\" class=\"accordion\" style=\"display: none;\"><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-samples\">List of samples</a></div><div id=\"rppa-samples\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><ul></ul></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-barchart\">Standard deviation of protein expression levels of all samples</a></div><div id=\"rppa-barchart\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-heatmap\">Pearson correlation coefficients of protein pairs</a></div><div id=\"rppa-heatmap\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"></div></div></div></div>",
            switchTab: true
        });

        $("#rppa-progress-bar p").html("Querying hub...");

        query = ["prefix tcga:<http://tcga.github.com/#>",
                 "select distinct ?name ?url",
                 "where {",
                 "    ?file tcga:platform ?platform .",
                 "    ?platform rdfs:label \"mda_rppa_core\" .",
                 "    ?file tcga:disease-study ?diseaseStudy .",
                 "    ?diseaseStudy rdfs:label \"gbm\" .",
                 "    ?file rdfs:label ?name .",
                 "    filter contains(?name, \"Level_3\")",
                 "    minus {",
                 "        ?file rdfs:label ?name .",
                 "        filter contains(?name, \".tar.gz\")",
                 "    }",
                 "    ?file tcga:url ?url .",
                 "}"].join("\n");

        TCGA.hub.query(query, function (err, data) {

            var files, queue, filesDownloaded;

         // Create empty list of files.
            files = {};

         // Get file names.
            data.values.forEach(function (triple) {
                files[triple[1].substring(1, triple[1].length - 1)] = null;
            });

         // Initialize progress bar.
            filesDownloaded = 0;
            $("#rppa-progress-bar p").html("Downloading files...");

         // Download files.
            queue = async.queue(function (file, callback) {
                TCGA.get(file, function (err, body) {
                    files[file] = body;
                    callback();
                });
            }, 2);

         // This is what happens after all files were downloaded.
            queue.drain = function () {

                var job, map;

             // Hide progress bar, display content options.
                $("#rppa-progress-bar").fadeOut("slow", function () {
                    $("#rppa-content-options").fadeIn("slow");
                });

                map = function (fileName, content, emit) {
                    content.split("\n").forEach(function (line) {
                        var tuple, protein, expression;
                     // Ignore empty lines.
                        if (line !== "") {
                            tuple = line.split("\t");
                            protein = tuple[0];
                         // Ignore non-proteins.
                            if (protein !== "Sample REF" && protein !== "Composite Element REF") {
                                expression = Number(tuple[1]);
                                emit(protein, expression);
                            }
                        }
                    });
                };

             // Create a MapReduce job that groups all values together.
                job = ganesha.createJob(files, map, function (proteins) {

                 // Make raw data available to other modules.
                    TCGA.data["rppa"] = proteins;

                    $("#rppa-barchart").on("show", function (ev) {

                        var sd;

                     // Draw visualization only once.
                        if ($(ev.target).has("svg").length === 0) {

                         // Calculate the standard deviation of the expression levels for each protein.
                            sd = {};
                            Object.keys(proteins).map(function (protein) {
                                sd[protein] = spearson.standardDeviation(proteins[protein]);
                            });

                         // Make data available to other modules.
                            TCGA.data["rppa-sd"] = sd;

                         // Draw bar chart.
                            barchart(sd, {
                                parentElement: $("div", ev.target)[0],
                                width: 908
                            });

                        }

                    });

                    $("#rppa-heatmap").on("show", function (ev) {

                        var cor;

                     // Draw visualization only once.
                        if ($(ev.target).has("svg").length === 0) {

                         // Calculate the correlation coefficients of all protein expression levels.
                            cor = {};
                            Object.keys(proteins).forEach(function (protein1) {
                                Object.keys(proteins).forEach(function (protein2) {
                                    if (cor[protein1] === undefined) {
                                        cor[protein1] = {};
                                    }
                                    cor[protein1][protein2] = spearson.correlation.pearson(proteins[protein1], proteins[protein2]);
                                });
                            });

                         // Make data available to other modules.
                            TCGA.data["rppa-cor"] = cor;

                         // Draw heatmap.
                            heatmap(cor, {
                                parentElement: $("div", ev.target)[0],
                                width: 908,
                                height: 908
                            });

                        }

                    });

                });

             // Submit job.
                ganesha.submitJob(job);

            };

         // Add files to queue.
            Object.keys(files).map(function (file) {
                queue.push(file, function () {

                 // Add file to list of samples.
                    $("#rppa-samples ul").append("<li><a href=" + file + ">" + file.substring(178, file.length) + "</a></li>");

                 // Change progress bar.
                    filesDownloaded++;
                    $("#rppa-progress-bar .progress div").css("width", ((filesDownloaded / Object.keys(files).length) * 100) + "%");

                });
            });

        });

    });

}());
