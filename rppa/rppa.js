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
            content: "<style>rect.bar {stroke: white; fill: steelblue} .axis path,.axis line {fill: none; stroke: black; shape-rendering: crispEdges} .axis text {font-family: sans-serif; font-size: 11px}</style><div class=\"page-header\"><h1>RPPA <small>Real time querying and plotting of level 3 reverse phase protein data for GBM.</small></h1></div><div id=\"rppa-progress-bar\" class=\"well\"><p></p><div class=\"progress progress-striped active\"><div class=\"bar\"></div></div></div><div id=\"rppa-content\" style=\"display: none;\"><p><span class=\"label label-info\">Tip</span> The results of various computations are stored in <code>TCGA.data</code>.</p><div class=\"accordion\"><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-samples\">List of samples</a></div><div id=\"rppa-samples\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><ul></ul></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-sd\">Standard deviation of protein expression levels of all samples</a></div><div id=\"rppa-sd\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><div id=\"rppa-sd-barchart\"></div><div id=\"rppa-sd-table\"><table class=\"table table-striped\"><thead><tr><th>Protein</th><th>Standard deviation</th></tr></thead><tbody></tbody></table></div></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-cor\">Pearson correlation coefficients of protein pairs (this might take a while)</a></div><div id=\"rppa-cor\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><div id=\"rppa-cor-heatmap\"></div></div></div></div></div></div>",
            switchTab: true
        });

        $("#rppa-progress-bar p").html("Querying hub...");

        query = ["prefix rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
                 "prefix rdfs:<http://www.w3.org/2000/01/rdf-schema#>",
                 "prefix tcga:<http://tcga.github.com/#>",
                 "select ?url",
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

        TCGA.hub.query(query, function (err, links) {

            var filesDownloaded, files, queue;

         // Initialize progress bar.
            filesDownloaded = 0;
            $("#rppa-progress-bar p").html("Downloading files...");

         // Normalize query result set.
            links = links.map(function (link) {
                return link[0].substring(1, link[0].length - 1);
            });

         // Create empty list of files.
            files = {};

         // Create download queue.
            queue = async.queue(function (file, callback) {

             // Download individual files.
                TCGA.get(file, function (err, body) {

                 // Append file content to list of files.
                    files[file] = body;
                    callback();

                });

            }, 2);

         // Push files into queue.
            links.map(function (link) {
                queue.push(link, function () {

                 // Add file to list of samples.
                    $("#rppa-samples ul").append("<li><a href=" + link + ">" + link.substring(178, link.length) + "</a></li>");

                 // Change progress bar.
                    filesDownloaded++;
                    $("#rppa-progress-bar .progress div").css("width", ((filesDownloaded / links.length) * 100) + "%");

                });
            });

         // Define what should happen when the last element was removed from the queue.
            queue.drain = function () {

                var job, map;

             // Hide progress bar, display content options.
                $("#rppa-progress-bar").fadeOut("slow", function () {
                    $("#rppa-content").fadeIn("slow");
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

                    $("#rppa-sd").on("show", function (ev) {

                        var sd, viz;

                     // Render information only once.
                        if ($(ev.target).has("svg").length === 0) {

                         // Calculate the standard deviation of the expression levels for each protein.
                            sd = {};
                            Object.keys(proteins).map(function (protein) {
                                sd[protein] = spearson.standardDeviation(proteins[protein]);
                            });

                         // Make data available to other modules.
                            TCGA.data["rppa-sd"] = sd;

                         // Initialize bar chart.
                            viz = barchart().width(908);

                         // Generate bar chart.
                            d3.select("#rppa-sd-barchart")
                              .datum(sd)
                              .call(viz);

                         // Copy values into table.
                            Object.keys(sd).forEach(function (protein) {
                                $("#rppa-sd-table table tbody", ev.target).append("<tr><td>" + protein + "</td><td>" + sd[protein] + "</td></tr>");
                            });

                        }

                    });

                    $("#rppa-cor").on("show", function (ev) {

                        var cor, viz;

                     // Draw visualization only once.
                        if ($(ev.target).has("svg").length === 0) {

                         // Calculate the correlation coefficients of all protein expression levels.
                            cor = {};
                            Object.keys(proteins).map(function (protein1) {
                                Object.keys(proteins).map(function (protein2) {
                                    if (cor[protein1] === undefined) {
                                        cor[protein1] = {};
                                    }
                                    cor[protein1][protein2] = spearson.correlation.pearson(proteins[protein1], proteins[protein2]);
                                });
                            });

                         // Make data available to other modules.
                            TCGA.data["rppa-cor"] = cor;

                         // Initialize heatmap.
                            viz = heatmap().width(908).height(908);

                         // Generate heatmap.
                            d3.select("#rppa-cor-heatmap")
                              .datum(cor)
                              .call(viz);

                        }

                    });

                });

             // Submit job.
                ganesha.submitJob(job);

            };

        });

    });

}());
