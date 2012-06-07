(function () {
    "use strict";

 // Load dependencies.
    TCGA.loadScript(["https://raw.github.com/caolan/async/master/dist/async.min.js",
                     "https://raw.github.com/Mottie/tablesorter/master/js/jquery.tablesorter.min.js",
                     "https://raw.github.com/agrueneberg/Spearson/master/lib/spearson.js",
                     "https://raw.github.com/mbostock/d3/master/d3.v2.min.js",
                     "https://raw.github.com/agrueneberg/Viz/master/heatmap/heatmap.js",
                     "https://raw.github.com/agrueneberg/Viz/master/dendrogram/dendrogram.js"], function () {

        var query;

     // Register tab.
        TCGA.registerTab({
            id: "rppa",
            title: "RPPA",
            content: "<style>.tooltip {display: none; position: absolute; padding: 5px; font-size: 13px; opacity: 100; background-color: rgba(242, 242, 242, .8)} .node circle {fill: #fff; stroke: steelblue; stroke-width: 1.5px} .node {font: 10px sans-serif} .link {fill: none; stroke: #ccc; stroke-width: 1.5px}</style><div class=\"page-header\"><h1>RPPA <small>Real time querying and plotting of level 3 reverse phase protein data for GBM.</small></h1></div><div id=\"rppa-progress-bar\" class=\"well\"><p></p><div class=\"progress progress-striped active\"><div class=\"bar\"></div></div></div><div id=\"rppa-content\" style=\"display: none;\"><p><span class=\"label label-info\">Tip</span> The results of various computations are stored in <code>TCGA.data</code>.</p><div class=\"accordion\"><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-samples\">List of samples</a></div><div id=\"rppa-samples\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><ul></ul></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-data\">Tidied data (for use in R, MATLAB, Google Refine, ...)</a></div><div id=\"rppa-data\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><p>Format: <code>Sample REF</code> \\t <code>Composite Element REF</code> \\t <code>Protein</code> \\t <code>Protein Expression</code></p><textarea class=\"span11\" rows=\"10\"></textarea><br /><a href=\"#\" id=\"rppa-data-clipboard\">Copy tidied data into clipboard</a></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-proteins-basics\">Basic statistics of protein expression levels in all samples</a></div><div id=\"rppa-proteins-basics\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><table class=\"table table-striped\" style=\"display: none;\"><thead><tr><th>Protein</th><th>Median</th><th>Mean</th><th>Standard deviation</th><th>Slide</th></tr></thead><tbody></tbody></table></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-proteins-correlations\">Correlation coefficients of protein pairs</a></div><div id=\"rppa-proteins-correlations\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><div id=\"rppa-proteins-correlations-options\"><form class=\"form-inline\">Method: <select name=\"correlation-method\"><option value=\"pearson\">Pearson</option><option value=\"spearman\">Spearman</option></select><input type=\"submit\" value=\"Update\" class=\"btn\" /></form></div><div id=\"rppa-proteins-correlations-heatmap\"></div></div></div></div><div class=\"accordion-group\"><div class=\"accordion-heading\"><a class=\"accordion-toggle\" data-toggle=\"collapse\" data-target=\"#rppa-proteins-clusters\">Hierarchical clustering of protein correlation coefficients</a></div><div id=\"rppa-proteins-clusters\" class=\"accordion-body collapse\"><div class=\"accordion-inner\"><div id=\"rppa-proteins-clusters-options\"><form class=\"form-inline\">Linkage Criterion: <select name=\"linkage-criterion\"><option value=\"single\">Single</option><option value=\"complete\">Complete</option><option value=\"upgma\" selected=\"selected\">UPGMA</option></select><input type=\"submit\" value=\"Update\" class=\"btn\" /></form></div><div id=\"rppa-proteins-clusters-dendrogram\"></div></div></div></div></div></div>",
            switchTab: true
        });

        $("#rppa-progress-bar p").html("Querying hub...");
        $("#rppa-progress-bar .progress div").css("width", "1%");

        query = ["prefix tcga:<http://purl.org/tcga/core#>",
                 "select ?url",
                 "where {",
                 "    ?file tcga:platform ?platform .",
                 "    ?platform rdfs:label \"mda_rppa_core\" .",
                 "    ?file tcga:disease-study ?diseaseStudy .",
                 "    ?diseaseStudy rdfs:label \"gbm\" .",
                 "    ?file rdfs:label ?name .",
                 "    ?file tcga:url ?url .",
                 "    filter contains(?name, \"Level_3\")",
                 "    minus {",
                 "        ?file rdfs:label ?name .",
                 "        filter contains(?name, \"Control\")",
                 "    }",
                 "}"].join("\n");

        TCGA.hub.query(query, function (err, sparqlResult) {

            var links, filesDownloaded, data, queue;

         // Initialize progress bar.
            filesDownloaded = 0;
            $("#rppa-progress-bar p").html("Downloading files...");

         // Extract links.
            links = [];
            sparqlResult.results.bindings.forEach(function (link) {
                links.push(link.url.value);
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

                var getProteinExpressionLevels, getProteinCorrelationCoefficients;

             // Make tidied data available to other modules.
                TCGA.data["rppa-data"] = JSON.parse(JSON.stringify(data));

             // Hide progress bar, display content options.
                $("#rppa-progress-bar").fadeOut("slow", function () {
                    $("#rppa-content").fadeIn("slow");
                });

             // Generate proteins expression levels from from tidied observations.
                getProteinExpressionLevels = function () {

                    var proteins;

                    if (TCGA.data.hasOwnProperty("rppa-proteins") === true) {

                     // Calculate protein expression levels only once.
                        return JSON.parse(JSON.stringify(TCGA.data["rppa-proteins"]));

                    } else {

                     // Regroup observations.
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

                     // Make data available to other modules.
                        TCGA.data["rppa-proteins"] = JSON.parse(JSON.stringify(proteins));

                        return proteins;

                    }

                };

             // Generate protein correlation coefficients from protein expression levels.
                getProteinCorrelationCoefficients = function (method) {

                    var proteins, proteinLabels, standardizedProteins, correlations, i, j, correlation;

                    if (TCGA.data.hasOwnProperty("rppa-proteins-correlations-" + method) === true) {

                     // Calculate protein correlation coefficients for a specific method only once.
                        return JSON.parse(JSON.stringify(TCGA.data["rppa-proteins-correlations-" + method]));

                    } else {

                        proteins = getProteinExpressionLevels();

                     // Extract labels for fast lookup.
                        proteinLabels = Object.keys(proteins);

                        if (method === "pearson") {

                         // Standardize expression values.
                            standardizedProteins = {};
                            proteinLabels.map(function (protein) {
                                standardizedProteins[protein] = spearson.standardize(proteins[protein]);
                            });

                        } else if (method === "spearman") {

                         // Rank expression values.
                            standardizedProteins = {};
                            proteinLabels.map(function (protein) {
                                standardizedProteins[protein] = spearson.rank(proteins[protein]);
                            });

                        }

                     // Calculate the correlation coefficients of all protein expression levels.
                        correlations = {};
                        for (i = 0; i < proteinLabels.length; i++) {
                            correlations[proteinLabels[i]] = {};
                            for (j = 0; j <= i; j++) {
                                if (i === j) {
                                    correlations[proteinLabels[i]][proteinLabels[j]] = 1;
                                } else {
                                    correlation = spearson.correlation[method](standardizedProteins[proteinLabels[i]], standardizedProteins[proteinLabels[j]], false);
                                    correlations[proteinLabels[i]][proteinLabels[j]] = correlation;
                                    correlations[proteinLabels[j]][proteinLabels[i]] = correlation;
                                }
                            }
                        }

                     // Make data available to other modules.
                        TCGA.data["rppa-proteins-correlations-" + method] = JSON.parse(JSON.stringify(correlations));

                        return correlations;

                    }

                };

             /***
              * Tidied data.
              **/
                $("#rppa-data").on("show", function (ev) {

                    (function (el) {

                        var data, textarea;

                     // Do not render the same information twice.
                        if ($(el).hasClass("rendered") === false) {

                            data = JSON.parse(JSON.stringify(TCGA.data["rppa-data"]));

                            textarea = $("textarea", el);

                         // Copy data into textarea.
                            data = data.map(function (observation) {
                                return observation.join("\t");
                            }).join("\n");
                            textarea.text(data);

                         // Enable copy to clipboard feature.
                            $("#rppa-data-clipboard", el).click(function (ev) {
                                ev.preventDefault();
                             // Select content of textbox.
                                textarea.select();
                             // Write current selection into clipboard.
                                document.execCommand("copy");
                            });

                         // Rendering is done.
                            $(el).addClass("rendered");

                        }

                    }(ev.target));

                });

             /***
              * Basic statistics of protein expression levels in all samples.
              **/
                $("#rppa-proteins-basics").on("show", function (ev) {

                    (function (el) {

                        var proteins, proteinLabels, medians, means, standardDeviations, query;

                     // Do not render the same information twice.
                        if ($(el).hasClass("rendered") === false) {

                            proteins = getProteinExpressionLevels();

                            proteinLabels = Object.keys(proteins);

                         // Calculate the basic statistics for each protein.
                            medians = {};
                            means = {};
                            standardDeviations = {};
                            proteinLabels.map(function (protein) {
                                medians[protein] = spearson.median(proteins[protein]);
                                means[protein] = spearson.mean(proteins[protein]);
                                standardDeviations[protein] = spearson.standardDeviation(proteins[protein]);
                            });

                         // Make data available to other modules.
                            TCGA.data["rppa-proteins-medians"] = JSON.parse(JSON.stringify(medians));
                            TCGA.data["rppa-proteins-means"] = JSON.parse(JSON.stringify(means));
                            TCGA.data["rppa-proteins-standard-deviations"] = JSON.parse(JSON.stringify(standardDeviations));

                         // Get links to images.
                            query = ["prefix tcga:<http://purl.org/tcga/core#>",
                                     "select ?url",
                                     "where {",
                                     "    ?file tcga:platform ?platform .",
                                     "    ?platform rdfs:label \"mda_rppa_core\" .",
                                     "    ?file tcga:disease-study ?diseaseStudy .",
                                     "    ?diseaseStudy rdfs:label \"gbm\" .",
                                     "    ?file rdfs:label ?name .",
                                     "    ?file tcga:url ?url .",
                                     "    filter strEnds(?name, \".tif\")",
                                     "}"].join("\n");

                            TCGA.hub.query(query, function (err, sparqlResult) {

                                var links;

                                links = {};
                                proteinLabels.map(function (protein) {
                                    sparqlResult.results.bindings.map(function (link) {
                                        if (link.url.value.indexOf(protein) !== -1) {
                                            links[protein] = link.url.value;
                                        }
                                    });
                                });

                             // Copy values into sortable table.
                                proteinLabels.map(function (protein) {
                                    $("table tbody", el).append("<tr><td>" + protein + "</td><td>" + medians[protein] + "</td><td>" + means[protein] + "</td><td>" + standardDeviations[protein] + "</td><td><a href=\"" + links[protein] + "\">Slide</a></td></tr>");
                                });
                                $("table", el).tablesorter().show();

                             // Rendering is done.
                                $(el).addClass("rendered");

                            });

                        }

                    }(ev.target));

                });

             /***
              * Correlation coefficients of protein pairs.
              **/
                $("#rppa-proteins-correlations").on("show", function (ev) {

                    (function (el) {

                     // Do not render the same information twice.
                        if ($(el).hasClass("rendered") === false) {

                         // Register button click listener.
                            $("#rppa-proteins-correlations-options form", el).submit(function (ev) {

                                var method, correlations, viz;

                                ev.preventDefault();

                             // Extract method.
                                method = $("#rppa-proteins-correlations-options [name='correlation-method']").val();

                             // Calculate correlation coefficients.
                                correlations = getProteinCorrelationCoefficients(method);

                             // Initialize heatmap.
                                viz = heatmap().width(908).height(908);

                             // Generate heatmap.
                                d3.select("#rppa-proteins-correlations-heatmap")
                                  .datum(correlations)
                                  .call(viz);

                            });

                         // Fire button click event.
                            $("#rppa-proteins-correlations-options form", el).submit();

                         // Rendering is done.
                            $(el).addClass("rendered");

                        }

                    }(ev.target));

                });

             /***
              * Hierarchical clustering of protein correlation coefficients.
              **/
                $("#rppa-proteins-clusters").on("show", function (ev) {

                    (function (el) {

                     // Do not render the same information twice.
                        if ($(el).hasClass("rendered") === false) {

                         // Register button click listener.
                            $("#rppa-proteins-clusters-options form", el).submit(function (ev) {

                                var correlations, pairwiseDistances, labels, linkage, clusters, viz;

                                ev.preventDefault();

                                correlations = getProteinCorrelationCoefficients("pearson");

                             // Calculate the pairwise distances.
                                pairwiseDistances = Object.keys(correlations).map(function (proteinA) {
                                    return Object.keys(correlations[proteinA]).map(function (proteinB) {
                                     // The direction of the correlation coefficient is of no value,
                                     // it is only the magnitude that matters.
                                        return 1 - Math.abs(correlations[proteinA][proteinB]);
                                    });
                                });

                             // Extract labels.
                                labels = Object.keys(correlations);

                             // Extract linkage criterion.
                                linkage = $("#rppa-proteins-clusters-options [name='linkage-criterion']").val();

                             // Run the clustering.
                                clusters = spearson.hierarchicalClustering(pairwiseDistances, linkage);

                             // Make data available to other modules.
                                TCGA.data["rppa-proteins-clusters"] = JSON.parse(JSON.stringify(clusters));

                             // Intialize dendrogram.
                                viz = dendrogram().width(908).height(4000).labels(labels);

                             // Generate dendrogram.
                                d3.select("#rppa-proteins-clusters-dendrogram")
                                  .datum(clusters)
                                  .call(viz);

                            });

                         // Fire button click event.
                            $("#rppa-proteins-clusters-options form", el).submit();

                         // Rendering is done.
                            $(el).addClass("rendered");

                        }

                    }(ev.target));

                });

            };

        });

    });

}());
