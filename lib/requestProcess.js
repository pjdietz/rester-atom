'use strict';

const EventEmitter = require('events').EventEmitter;
const Client = require('rester-client').Client;
const Selector = require('./selector');
const ResponseFormatter = require('./responseFormatter');

// -----------------------------------------------------------------------------

class RequestProcess extends EventEmitter {

    constructor(requestEditor, responseEditor) {
        super();
        this.configuration = {
            followRedirects: atom.config.get('rester.followRedirects'),
            redirectStatusCodes: atom.config.get('rester.redirectStatusCodes')
                .map(code => Number(code)),
            responseGrammar: atom.config.get('rester.responseGrammar'),
            showHeaders: atom.config.get('rester.showHeaders'),
            showRedirects: atom.config.get('rester.showRedirects')
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
            let formatter = new ResponseFormatter(transaction, this.configuration);
            let response = formatter.format();
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
                this.setResponseGrammar();
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

    setResponseGrammar() {
        let responseGrammarName = this.configuration.responseGrammar;
        let responseGrammar;
        let grammars = atom.grammars.getGrammars();
        for (let i = 0; i < grammars.length; ++i) {
            let grammar = grammars[i];
            if (grammar.name === responseGrammarName) {
                responseGrammar = grammar;
                break;
            }
        }
        this.responseEditor.setGrammar(responseGrammar);
    }
}

// -----------------------------------------------------------------------------

module.exports = RequestProcess;
