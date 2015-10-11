/* jshint node: true */
/* globals atom, Promise */
"use strict";

var ModalProgressView = require("./modalProgressView"),
    RequestProcess = require("./RequestProcess").RequestProcess;

var modalPanel,
    modalView,
    lastResponseEditor;

function makeRequest() {
    var proc,
        requestEditor = atom.workspace.getActiveTextEditor();

    // Do nothing if no editors exist.
    if (!requestEditor) {
        return;
    }

    modalPanel.show();

    proc = new RequestProcess(requestEditor, lastResponseEditor);
    proc.on("end", function (responseEditor) {
        var pane = atom.workspace.paneForItem(requestEditor);
        pane.activate();
        pane.activateItem(requestEditor);
        lastResponseEditor = responseEditor;
        modalPanel.hide();
    });
    proc.on("error", function(error) {
        var detail;
        modalPanel.hide();
        switch (error.code) {
            case "ECONNREFUSED":
                detail = "Connection refused";
                break;
            case "ECONNRESET":
                detail = "Connection reset by peer";
                break;
            case "ETIMEDOUT":
                detail = "Operation timed out";
                break;
        }
        atom.notifications.addError("Unable to make request.", {detail: detail});
    });
    proc.run();
}

// -----------------------------------------------------------------------------

module.exports = {
    activate: function() {
        atom.commands.add("atom-workspace", "rester:request", makeRequest);
        modalView = new ModalProgressView();
        modalPanel = atom.workspace.addModalPanel({
          item: modalView.getElement(),
          visible: false
        });
    },
    deactivate: function() {
        modalView.destroy();
        modalPanel.destroy();
        lastResponseEditor = null;
    },
    config: {
        outputHeaders: {
            description: "Include status line and headers in the response buffer.",
            type: "boolean",
            default: true
        },
        followRedirects: {
            description: "Automatically follow redirect responses with status codes in `Redirect Status Codes`.",
            type: "boolean",
            default: true
        },
        redirectStatusCodes: {
            description: "When `Follow Redirects` is enabled, automatically follow responses with these status codes.",
            type: "array",
            default: ["300", "301", "302", "303", "305", "307"],
        },
        responseCommands: {
            description: "Atom command to run on the response body (e.g., to format).",
            type: "array",
            default: []
        },
        responseGrammar: {
            description: "Language grammar to use for the response.",
            type: "string",
            default: "HTTP Message"
        }
    }
};
