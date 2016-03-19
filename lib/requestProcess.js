'use strict';

const EventEmitter = require('events').EventEmitter;
const Client = require('rester-client').Client;
const Selector = require('./selector');

// -----------------------------------------------------------------------------

class RequestProcess extends EventEmitter {

    constructor(requestEditor, responseEditor) {
        super();
        this.client = new Client();
        this.requestEditor = requestEditor;
        this.responseEditor = responseEditor;
        this.canceled = false;
    }

    run() {
        // Do nothing when no text editors are open.
        if (!this.requestEditor) {
            return;
        }

        // Read the request from the current editor.
        let request = this.getSelectedText(this.requestEditor);
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
    }

    cancel() {
        this.canceled = true;
        this.emit('cancel', this.responseEditor);
    }

    getSelectedText(editor) {
        let selector = new Selector(editor);
        return selector.getSelection();
    }

    displayResponse(response) {
        if (this.canceled) {
            return;
        }
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
    }
}

// -----------------------------------------------------------------------------

module.exports = RequestProcess;
