'use strict';

const EventEmitter = require('events').EventEmitter;
const Client = require('rester-client').Client;
const Selector = require('./selector');

// -----------------------------------------------------------------------------

class RequestProcess extends EventEmitter {

    constructor(requestEditor, responseEditor) {
        super();
        this.configuration = {
            followRedirects: atom.config.get('rester.followRedirects'),
            redirectStatusCodes: atom.config.get('rester.redirectStatusCodes')
                .map(code => Number(code)),
            showHeaders: atom.config.get('rester.showHeaders')
        };
        this.client = new Client(this.configuration);
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
        this.configuration = transaction.configuration;
        transaction.on('end', () => {
            if (this.canceled) {
                return;
            }
            let response = this.formatResponse(transaction.getResponse());
            this.displayResponse(response);
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

    formatResponse(response) {
        if (this.configuration.showHeaders && !this.configuration.hideHeaders) {
            return response;
        }

        let index = response.indexOf('\n\n');
        if (index > -1) {
            return response.slice(index + 2);
        }
        index = response.indexOf('\r\n\r\n');
        if (index > -1) {
            return response.slice(index + 4);
        }
        return '';
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
