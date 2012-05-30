(function () {
    "use strict";

 // Load dependencies.
    TCGA.loadScript(["https://raw.github.com/caolan/async/master/dist/async.min.js",
                     "https://raw.github.com/Mottie/tablesorter/master/js/jquery.tablesorter.min.js",
                     "https://raw.github.com/agrueneberg/Spearson/master/lib/spearson.js",
                     "https://raw.github.com/mbostock/d3/master/d3.v2.min.js",
                     "https://raw.github.com/agrueneberg/Viz/master/heatmap/heatmap.js"], function () {

        var query;

     // Register tab.
        TCGA.registerTab({
            id: "rppa",
            title: "RPPA",
            content: "<style>.tooltip {display: none; position: absolute; padding: 5px; font-size: 13px; opacity: 100; background-color: rgba(242, 242, 242, .8)}</style><div class=\"page-header\"><h1>RPPA <small>Real time querying and plotting of level 3 reverse phase protein data for GBM.</small></h1></div><div id=\"rppa-progress-bar\" class=\"well\"><p></p><div class=\"progress progress-striped active\"><div class=\"bar\"></div></div></div><div id=\"rppa-content\" style=\"display: none;\"><p><span class=\"label label-info\">Tip</span> The results of various computations are stored in <code>TCGA.data</code>.</p><div class=\"accordion\"><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-samples\">List of samples</a></div><div id=\"rppa-samples\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><ul></ul></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-data\">Tidied data</a></div><div id=\"rppa-data\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><p>Format: <code>Sample REF</code> \\t <code>Composite Element REF</code> \\t <code>Protein</code> \\t <code>Protein Expression</code></p><textarea class=\"span11\" rows=\"10\"></textarea><br /><a href=\"#\" id=\"rppa-data-clipboard\">Copy tidied data into clipboard</a></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-sd\">Standard deviation of protein expression levels of all samples</a></div><div id=\"rppa-sd\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><table id=\"rppa-sd-table\" class=\"table table-striped\"><thead><tr><th>Protein</th><th>Standard deviation</th></tr></thead><tbody></tbody></table></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-cor\">Pearson correlation coefficients of protein pairs</a></div><div id=\"rppa-cor\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><div id=\"rppa-cor-heatmap\"></div></div></div></div></div></div>",
            switchTab: true
        });

        $("#rppa-progress-bar p").html("Querying hub...");
        $("#rppa-progress-bar .progress div").css("width", "1%");

        query = ["prefix rdfs:<http://www.w3.org/2000/01/rdf-schema#>",
                 "prefix tcga:<http://purl.org/tcga/core#>",
                 "select ?url",
                 "where {",
                 "    ?file tcga:platform ?platform .",
                 "    ?platform rdfs:label \"mda_rppa_core\" .",
                 "    ?file tcga:disease-study ?diseaseStudy .",
                 "    ?diseaseStudy rdfs:label \"gbm\" .",
                 "    ?file rdfs:label ?name .",
                 "    filter contains(?name, \"Level_3\")",
                 "    ?file tcga:url ?url .",
                 "}"].join("\n");

        TCGA.hub.query(query, function (err, links) {

            var filesDownloaded, data, queue;

         // Initialize progress bar.
            filesDownloaded = 0;
            $("#rppa-progress-bar p").html("Downloading files...");

         // Normalize query result set.
            links = links.map(function (link) {
                return link[0].substring(1, link[0].length - 1);
            });

         // Collect the data in the following denormalized form:
         // Sample_Reference_Id Composite_Element_Ref Protein Protein_Expression
            data = [];

         // Create download queue.
            queue = async.queue(function (file, callback) {

             // Download individual files.
                TCGA.get(file, function (err, body) {

                    var expressionLevels, sampleRef, compositeElementRef;

                 // Parse file.
                    expressionLevels = {};
                    body.split("\n").forEach(function (line, i) {
                        var tuple, expression;
                     // Ignore empty lines.
                        if (line !== "") {
                            tuple = line.split("\t");
                            if (tuple[0] === "Sample REF") {
                             // Extract Sample REF.
                                sampleRef = tuple[1];
                            } else if (tuple[0] === "Composite Element REF") {
                             // Extract Composite Element REF.
                                compositeElementRef = tuple[1];
                            } else {
                             // Extract proteins and their expression levels.
                                expression = Number(tuple[1]);
                                expressionLevels[tuple[0]] = expression;
                            }
                        }
                    });

                 // I have never seen a case where Sample REF and Composite Element REF were not at the top,
                 // but parsing the whole document before writing them into the table is more robust and might
                 // prevent potential errors. Unless of course, those values are missing.
                    Object.keys(expressionLevels).map(function (protein) {
                        data.push([sampleRef, compositeElementRef, protein, expressionLevels[protein]]);
                    });

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
                    $("#rppa-progress-bar .progress div").css("width", 1 + ((filesDownloaded / links.length) * 99) + "%");

                });
            });

         // Define what should happen when the last element was removed from the queue.
            queue.drain = function () {

                var generateProteinData;

             // Make tidied data available to other modules.
                TCGA.data["rppa-data"] = data;

             // Hide progress bar, display content options.
                $("#rppa-progress-bar").fadeOut("slow", function () {
                    $("#rppa-content").fadeIn("slow");
                });

             // Generate protein data from tidied observations.
                generateProteinData = function (data) {

                    var proteins;

                    proteins = {};
                    data.forEach(function (observation) {
                        var protein, expression;
                        protein = observation[2];
                        expression = observation[3];
                        if (proteins.hasOwnProperty(protein) === false) {
                            proteins[protein] = [];
                        }
                        proteins[protein].push(expression);
                    });

                    return proteins;

                };

             /***
              * Tidied data.
              **/
                $("#rppa-data").on("show", function (ev) {

                    var data, textarea;

                 // Do not render the same information twice.
                    if ($(ev.target).hasClass("rendered") === false) {

                        textarea = $("textarea", ev.target);

                     // Copy data into textarea.
                        data = TCGA.data["rppa-data"].map(function (observation) {
                            return observation.join("\t");
                        }).join("\n");
                        textarea.text(data);

                     // Enable copy to clipboard feature.
                        $("#rppa-data-clipboard", ev.target).click(function (ev) {
                            ev.preventDefault();
                         // Select content of textbox.
                            textarea.select();
                         // Write current selection into clipboard.
                            document.execCommand("copy");
                        });

                     // Rendering is done.
                        $(ev.target).addClass("rendered");

                    }

                });

             /***
              * Standard deviation of protein expression levels of all samples.
              **/
                $("#rppa-sd").on("show", function (ev) {

                    var proteins, sd;

                 // Do not render the same information twice.
                    if ($(ev.target).hasClass("rendered") === false) {

                        proteins = TCGA.data["rppa-proteins"];

                     // Generate protein data if it has not happened yet and make it available to other modules.
                        if (proteins === undefined) {
                            proteins = generateProteinData(TCGA.data["rppa-data"]);
                            TCGA.data["rppa-proteins"] = proteins;
                        }

                     // Calculate the standard deviation of the expression levels for each protein.
                        sd = {};
                        Object.keys(proteins).map(function (protein) {
                            sd[protein] = spearson.standardDeviation(proteins[protein]);
                        });

                     // Make data available to other modules.
                        TCGA.data["rppa-proteins-sd"] = sd;

                     // Copy values into sortable table.
                        Object.keys(sd).forEach(function (protein) {
                            $("#rppa-sd-table tbody", ev.target).append("<tr><td>" + protein + "</td><td>" + sd[protein] + "</td></tr>");
                        });
                        $("#rppa-sd-table", ev.target).tablesorter();

                     // Rendering is done.
                        $(ev.target).addClass("rendered");

                    }

                });

             /***
              * Correlation coefficients of protein pairs.
              **/
                $("#rppa-cor").on("show", function (ev) {

                    var proteins, proteinLabels, standardizedProteins, correlations, i, j, correlation, viz;

                 // Do not render the same information twice.
                    if ($(ev.target).hasClass("rendered") === false) {

                        proteins = TCGA.data["rppa-proteins"];

                     // Generate protein data if it has not happened yet and make it available to other modules.
                        if (proteins === undefined) {
                            proteins = generateProteinData(TCGA.data["rppa-data"]);
                            TCGA.data["rppa-proteins"] = proteins;
                        }

                     // Extract labels for fast lookup.
                        proteinLabels = Object.keys(proteins);

                     // Standardize expression values.
                        standardizedProteins = {};
                        proteinLabels.map(function (protein) {
                            standardizedProteins[protein] = spearson.standardize(proteins[protein]);
                        });

                     // Calculate the correlation coefficients of all protein expression levels.
                        correlations = {};
                        for (i = 0; i < proteinLabels.length; i++) {
                            correlations[proteinLabels[i]] = {};
                            for (j = 0; j <= i; j++) {
                                if (i === j) {
                                    correlations[proteinLabels[i]][proteinLabels[j]] = 1;
                                } else {
                                    correlation = spearson.correlation.pearson(standardizedProteins[proteinLabels[i]], standardizedProteins[proteinLabels[j]], false);
                                    correlations[proteinLabels[i]][proteinLabels[j]] = correlation;
                                    correlations[proteinLabels[j]][proteinLabels[i]] = correlation;
                                }
                            }
                        }

                     // Make data available to other modules.
                        TCGA.data["rppa-proteins-cor"] = correlations;

                     // Initialize heatmap.
                        viz = heatmap().width(908).height(908);

                     // Generate heatmap.
                        d3.select("#rppa-cor-heatmap")
                          .datum(correlations)
                          .call(viz);

                     // Rendering is done.
                        $(ev.target).addClass("rendered");

                    }

                });

            };

        });

    });

}());
