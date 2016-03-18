'use strict';

const EventEmitter = require('events').EventEmitter;
const Client = require('rester-client').Client;

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
    }

    cancel() {
        this.canceled = true;
        this.emit('cancel', this.responseEditor);
    }

    /**
     * Return the selected text from an editor, or the entire text, if no
     * selection.
     *
     * When the editor contains multiple selections, the returned text will be
     * the contents of each selection concatenated together.
     *
     * @return {string} The selected text from the request editor.
     */
    getSelectedText(editor) {
        let selections = editor.getSelections();
        let text = "";
        for (let i = 0, u = selections.length; i < u; ++i) {
            let selection = selections[i];
            text += selection.getText();
        }
        if (text.trim().length === 0) {
            return editor.getText();
        }
        return text;
    }

    displayResponse(response) {
        if (this.canceled) {
            return;
        }
        console.log(response);
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
