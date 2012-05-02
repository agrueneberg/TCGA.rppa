(function () {
    "use strict";

    console.log("Loading dependencies...");

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
            content: "<div class=\"page-header\"><h1>RPPA</h1></div><div class=\"accordion\"><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-samples\">List of samples</a></div><div id=\"rppa-samples\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><ul></ul></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-barchart\">Standard deviation of protein expression levels of all samples</a></div><div id=\"rppa-barchart\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-heatmap\">Pearson correlation coefficients of protein pairs</a></div><div id=\"rppa-heatmap\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"></div></div></div></div>",
            switchTab: true
        });

        console.log("Querying hub...");

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

            var files, queue;

         // Create empty list of files.
            files = {};

         // Get file names.
            data.values.forEach(function (triple) {
                files[triple[1].substring(1, triple[1].length - 1)] = null;
            });

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

                    var labels, data, graph, sd, cor;

                 // Make raw data available to other modules.
                    TCGA.data["rppa"] = proteins;

                 /***
                  * Calculate the standard deviation of the expression levels for each protein. */
                    sd = {};
                    Object.keys(proteins).map(function (protein) {
                        sd[protein] = spearson.standardDeviation(proteins[protein]);
                    });

                 // Make data available to other modules.
                    TCGA.data["rppa-sd"] = sd;

                 // Draw bar chart.
                    barchart(sd, {
                        parentElement: document.querySelector("#rppa-barchart div"),
                        width: 908
                    });

                 /***
                  * Calculate the correlation coefficients of all protein expression levels. */
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
                        parentElement: document.querySelector("#rppa-heatmap div"),
                        width: 908,
                        height: 908
                    });

                });

             // Submit job.
                ganesha.submitJob(job);

            };

         // Add files to queue.
            Object.keys(files).map(function (file) {
                queue.push(file, function () {
                    console.log("Downloaded", file);
                 // Add file to list of samples.
                    $("#rppa-samples ul").append("<li><a href=" + file + ">" + file.substring(178, file.length) + "</a></li>");
                });
            });

        });

    });

}());
