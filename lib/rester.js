/* jshint node: true */
/* globals atom, Promise */
"use strict";

var ModalProgressView = require("./modalProgressView"),
    RequestProcess = require("./RequestProcess").RequestProcess;

var modalPanel,
    modalView,
    lastResponseEditor,
    requestProcess;

/**
 * Return the most recently used response editor, if it appears in the list
 * of current text editors.
 * @return {TextEditor} Most recently used response editor, or undefined
 */
function getResponseEditor() {
    var editors, editor, i, u;
    if (!lastResponseEditor) {
        return;
    }
    editors = atom.workspace.getTextEditors();
    for (i = 0, u = editors.length; i < u; ++i) {
        editor = editors[i];
        if (lastResponseEditor === editor) {
            return lastResponseEditor;
        }
    }
    lastResponseEditor = undefined;
    return;
}

function makeRequest() {
    var proc,
        requestEditor = atom.workspace.getActiveTextEditor(),
        responseEditor = getResponseEditor();

    // Do nothing if no editors exist.
    if (!requestEditor) {
        return;
    }

    modalPanel.show();

    requestProcess = new RequestProcess(requestEditor, responseEditor);
    requestProcess.on("cancel", function (responseEditor) {
        requestProcess.removeAllListeners();
        lastResponseEditor = responseEditor;
        modalPanel.hide();
        requestProcess = null;
    });
    requestProcess.on("end", function (responseEditor) {
        var pane = atom.workspace.paneForItem(requestEditor);
        requestProcess.removeAllListeners();
        responseEditor.scrollToBufferPosition([0, 0]);
        pane.activate();
        pane.activateItem(requestEditor);
        lastResponseEditor = responseEditor;
        modalPanel.hide();
        requestProcess = null;
    });
    requestProcess.on("error", function(error) {
        var detail;
        requestProcess.removeAllListeners();
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
        requestProcess = null;
    });
    requestProcess.run();
}

function cancelRequest() {
    if (requestProcess) {
        requestProcess.cancel();
    }
}

// -----------------------------------------------------------------------------

module.exports = {
    activate: function() {
        atom.commands.add("atom-workspace", "rester:request", makeRequest);
        modalView = new ModalProgressView();
        modalView.on("cancel", cancelRequest);
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
