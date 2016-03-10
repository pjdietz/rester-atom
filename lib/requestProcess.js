'use strict';

const EventEmitter = require('events').EventEmitter;
const util = require('util');

const Client = require('rester-client').Client;

function RequestProcess(requestEditor, responseEditor) {
    EventEmitter.call(this);
    this.eol = '\r\n';
    this.client = new Client();
    this.requestEditor = requestEditor;
    this.responseEditor = responseEditor;
    this.canceled = false;
}

util.inherits(RequestProcess, EventEmitter);

RequestProcess.prototype.run = function () {

    // Do nothing when no text editors are open.
    if (!this.requestEditor) {
        return;
    }

    // Read the request from the current editor.
    let request = this.getSelectedText(this.requestEditor);
    console.log(request);
    let transaction = this.client.request(request);
    transaction.on('end', () => {
        if (this.canceled) {
            return;
        }
        this.displayResponse(transaction.getResponse());
        transaction.removeAllListeners();
        transaction = null;
    });
    transaction.on('error', (error) => {
        this.emit('error', error);
        transaction.removeAllListeners();
        transaction = null;
    });
    try {
        transaction.send();
    } catch (e) {
        this.emit('error', e);
        transaction.removeAllListeners();
        transaction = null;
    }
};

RequestProcess.prototype.cancel = function () {
    this.canceled = true;
    this.emit('cancel', this.responseEditor);
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

RequestProcess.prototype.displayResponse = function (response) {
    if (this.canceled) {
        return;
    }
    console.log(response);
    // this.emit('end', this.responseEditor);
    if (this.responseEditor) {
        try {
            if (!this.responseEditor.isEmpty()) {
                this.responseEditor.setText("");
            }
            this.responseEditor.insertText(response);
            this.emit('end', this.responseEditor);
        } catch (e) {
            this.responseEditor = null;
            this.displayResponse(response);
        }
    } else {
        atom.workspace.open(undefined, {
            split: "right"
        }).then((editor) => {
            this.responseEditor = editor;
            editor.onDidDestroy(() => {
                this.responseEditor = null;
            });
            this.displayResponse(response);
        });
    }
};

RequestProcess.prototype._writeResponse = function (response, editor) {
    if (this.canceled) {
        return;
    }
    return new Promise(function (resolve, reject) {
        editor.insertText(response);
        resolve(editor);
    });
};

exports.RequestProcess = RequestProcess;
