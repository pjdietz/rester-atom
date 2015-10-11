/* jshint node: true */
/* globals atom, Promise */
"use strict";

var EventEmitter = require("events").EventEmitter,
    util = require("util");

var Client = require("rester-client").Client,
    Parser = require("rester-client").Parser;

/**
 * @constructor
 */
function RequestProcess(requestEditor, responseEditor) {
    EventEmitter.call(this);
    this._requestEditor = requestEditor;
    this._responseEditor = responseEditor;
    this._parser = new Parser();
    this._client = new Client();
}

util.inherits(RequestProcess, EventEmitter);

RequestProcess.prototype.run = function () {
    var client = this._client,
        proc = this,
        request;

    if (!this._requestEditor) {
        return;
    }

    request = this.getSelectedText(this._requestEditor);

    // Parse the response; configure and run the client in the callback.
    this._parser.parse(request, function (error, options, body) {
        console.log(request);
        console.log(client);
        client.on("response", function (response, willRedirect) {

        });
        client.on("error", function (error) {
            console.log("Client error");
            proc.emit("error", error);
        });
        client.request(options, body);
    });
};

/**
 * Return the selected text from an editor or the entire text, if no selection.
 *
 * When the editor contains multiple selections, the returned text will be the
 * contents of each selection concatenated together.
 *
 * @return {string} The selected text from the request editor.
 */
RequestProcess.prototype.getSelectedText = function (editor) {
    var selections = editor.getSelections(),
        selection,
        text = "",
        i, u;
    for (i = 0, u = selections.length; i < u; ++i) {
        selection = selections[i];
        text += selection.getText();
    }
    if (text.trim().length === 0) {
        return editor.getText();
    }
    return text;
};

RequestProcess.prototype._displayResponse = function (response, callback) {
    var proc = this;
    if (this._responseEditor) {
        try {
            if (!this._responseEditor.isEmpty()) {
                this._responseEditor.setText("");
            }
            this._writeResponse(response, this._responseEditor).then(callback);
        } catch (e) {
            this._responseEditor = null;
            this._displayResponse(response, callback);
        }
    } else {
        atom.workspace.open(undefined, {
            split: "right"
        }).then(function (editor) {
            proc._responseEditor = editor;
            editor.onDidDestroy(function () {
                proc._responseEditor = null;
            });
            proc._displayResponse(response, callback);
        });
    }
};

RequestProcess.prototype._writeResponse = function (response, editor) {
    console.log("I got a response!");
};

exports.RequestProcess = RequestProcess;
