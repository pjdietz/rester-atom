'use strict';

const EventEmitter = require('events').EventEmitter;
const Client = require('rester-client').Client;
const Selector = require('./selector');
const ResponseFormatter = require('./responseFormatter');

// -----------------------------------------------------------------------------

class RequestProcess extends EventEmitter {

    constructor(requestEditor, responseEditor) {
        super();
        this.configuration = this.readConfiguration();
        this.client = new Client(this.configuration);
        this.requestEditor = requestEditor;
        this.responseEditor = responseEditor;
        this.canceled = false;
    }

    readConfiguration() {
        let configuration = {
            followRedirects: atom.config.get('rester.followRedirects'),
            redirectStatusCodes: atom.config.get('rester.redirectStatusCodes')
                .map(code => Number(code)),
            responseCommands: atom.config.get('rester.responseCommands'),
            responseGrammar: atom.config.get('rester.responseGrammar'),
            showHeaders: atom.config.get('rester.showHeaders'),
            showRedirects: atom.config.get('rester.showRedirects'),
            openInPane: atom.config.get('rester.openInPane')
        };
        let delimiters = atom.config.get('rester.multilineFieldDelimiters');
        if (delimiters.length === 1) {
            configuration.multilineStart = delimiters[0];
            configuration.multilineEnd = delimiters[0];
        } else if (delimiters.length > 1) {
            configuration.multilineStart = delimiters[0];
            configuration.multilineEnd = delimiters[1];
        }
        return configuration;
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
            this.tryToWriteResponse(response);
        } else {
            this.openNewEditor().then(() => {
                this.displayResponse(response);
            });
        }
    }

    tryToWriteResponse(response) {
        try {
            this.writeResponseToEditor(response);
        } catch (e) {
            this.responseEditor = null;
            this.displayResponse(response);
        }
    }

    writeResponseToEditor(response) {
        if (!this.responseEditor.isEmpty()) {
            this.responseEditor.setText("");
        }
        this.responseEditor.insertText(response);
        this.setResponseGrammar();
        this.dispatchResponseCommands();
        this.emit('end', this.responseEditor);
    }

    openNewEditor() {
        let options = {};
        if (this.configuration.openInPane) {
            options.split = 'right';
        }
        return atom.workspace.open(undefined, options).then((editor) => {
            this.responseEditor = editor;
            editor.onDidDestroy(() => {
                this.responseEditor = null;
            });
        });
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

    dispatchResponseCommands() {
        let pane = atom.workspace.paneForItem(this.responseEditor);
        pane.activate();
        this.selectResponseBody();
        let workspace = atom.views.getView(atom.workspace);
        let commands = this.getResponseCommands();
        for (let i = 0; i < commands.length; ++i) {
            let command = commands[i];
            atom.commands.dispatch(workspace, command);
        }
    }

    getResponseCommands() {
        if (Array.isArray(this.configuration.responseCommands)) {
            return this.configuration.responseCommands;
        } else {
            return this.configuration.responseCommands
                .split(",").map(command => command.trim());
        }
    }

    selectResponseBody() {
        let editor = this.responseEditor;
        editor.setCursorBufferPosition([0, 0]);
        if (this.configuration.showHeaders) {
            let bodyPosition;
            editor.scan(/\n\n|\r\n\r\n/g, (match) => {
                if (!bodyPosition) {
                    bodyPosition = match;
                }
            });
            if (bodyPosition) {
                editor.setCursorBufferPosition(bodyPosition.range.end);
            }
        }
        editor.selectToBottom();
    }

}

// -----------------------------------------------------------------------------

module.exports = RequestProcess;
