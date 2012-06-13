(function () {
    "use strict";

 // Register tab.
    TCGA.registerTab({
        id: "import",
        title: "Import",
        content: "<div class=\"page-header\"><h1>Import <small>Import your files and compare them to the reference data in TCGA.</small></h1></div><p><span class=\"label label-important\">Important</span> <strong>This module will not upload your files to the cloud. Everything stays on your machine.</strong></p><p>The imported files will be locally stored in <code>TCGA.data</code>.</p><h2>File Picker</h2><form id=\"import-file-picker\"><input name=\"files\" type=\"file\" multiple=\"multiple\" /><br /><input type=\"submit\" class=\"btn btn-mini\" value=\"Import files\" /></form>",
        switchTab: true
    });

    $("#import-file-picker").submit(function (ev) {
        var fileList;
        ev.preventDefault();
        fileList = this.querySelector("input[name='files']").files;
        if (fileList.length > 0) {
            $(fileList).each(function (index, file) {
                var reader;
                reader = new FileReader();
                reader.onload = function (ev) {
                    TCGA.data[file.name] = ev.target.result;
                    TCGA.toast.info("Imported file " + file.name + " into TCGA.data.");
                };
                reader.readAsText(file);
            });
         // Finally, a useful use for reset!
         // TODO: This could be a race condition.
            this.reset();
        }
    });

}());
