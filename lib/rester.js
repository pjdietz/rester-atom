/* jshint node: true */
/* globals atom, Promise */
"use strict";

var Client = require("rester-client").Client,
    Parser = require("rester-client").Parser;

var ModalProgressView = require("./modalProgressView");

var eol = "\r\n",
    responseEditor,
    subscriptions,
    modalPanel,
    modalView;

function getSelectionOrText(editor) {
    var selection = editor.getSelectedText().trim();
    if (selection.length > 0) {
        return selection;
    }
    return editor.getText();
}

function dispatchResponseCommands(editor, bodyStart, commands) {
    var pane = atom.workspace.paneForItem(editor),
        workspace = atom.views.getView(atom.workspace);
    // Activate the editor and pane before dispatching commands.
    pane.activate();
    pane.activateItem(editor);
    // Dispatch each command with the entire body selected.
    commands.forEach(function (command) {
        editor.setCursorBufferPosition(bodyStart);
        editor.selectToBottom();
        atom.commands.dispatch(workspace, command);
    });
}

function displayResponse(response, callback) {
    if (responseEditor) {
        try {
            if (!responseEditor.isEmpty()) {
                responseEditor.setText("");
            }
            writeResponse(response, responseEditor).then(callback);
        } catch (e) {
            responseEditor = null;
            displayResponse(response, callback);
        }
    } else {
        atom.workspace.open(undefined, {
            split: "right"
        }).then(function (editor) {
            responseEditor = editor;
            editor.onDidDestroy(function () {
                responseEditor = null;
            });
            displayResponse(response, callback);
        });
    }
}

function makeRequest() {
    var parser = new Parser(),
        editor = atom.workspace.getActiveTextEditor(),
        pane = atom.workspace.getActivePane(),
        text = getSelectionOrText(editor);

    modalPanel.show();

    parser.parse(text, function (error, options, body) {
        var client = new Client();
        client.on("response", function (response, willRedirect) {
            if (!willRedirect) {
                displayResponse(response, function () {
                    modalPanel.hide();
                    pane.activate();
                });
            }
        });
        client.on("error", function (message) {
            modalPanel.hide();
            atom.notifications.addError("Error making request", {detail: message});
        });
        client.request(options, body);
    });
}

function writeResponse(response, editor) {
    return new Promise(function (resolve, reject) {
        var bodyStart, commands, i, u;
        commands = atom.config.get("rester.responseCommands", []);
        // Status line
        editor.insertText([
            "HTTP/" + response.httpVersion,
            response.statusCode,
            response.statusMessage
        ].join(" ") + eol);

        // Headers
        for (i = 0, u = response.rawHeaders.length; i < u; ++i) {
            editor.insertText(response.rawHeaders[i]);
            editor.insertText(i % 2 === 0 ? ": " : eol);
        }
        editor.insertText(eol);
        bodyStart = editor.getCursorBufferPosition();

        // Body
        response.setEncoding(editor.getEncoding());
        response.on("data",  function (chunk) {
            editor.insertText(chunk);
        });
        response.on("end", function () {
            dispatchResponseCommands(editor, bodyStart, commands);
            resolve();
        });
    });
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
        modalPanel.destroy();
        modalView.destroy();
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
        }
    }
};
