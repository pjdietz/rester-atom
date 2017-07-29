'use strict';

const ModalProgressView = require('./modalProgressView');
const RequestProcess = require('./requestProcess');

const config = {
    showHeaders: {
        description: 'Include status line and headers in the response buffer.',
        type: 'boolean',
        default: true,
        order: 1
    },
    showRedirects: {
        description: 'Include the redirect responses in the response buffer.',
        type: 'boolean',
        default: false,
        order: 2
    },
    followRedirects: {
        description: 'Automatically follow redirect responses with status codes in `Redirect Status Codes`.',
        type: 'boolean',
        default: true,
        order: 3
    },
    multilineFieldDelimiters: {
        description: 'Mark the boundaries of multiline form fields. To use a different sequence for the start and end, provide two sequences separated by a comma (e.g., `<<<,>>>`).',
        type: 'array',
        default: ['"""'],
        order: 4
    },
    redirectStatusCodes: {
        description: 'When `Follow Redirects` is enabled, automatically follow responses with these status codes.',
        type: 'array',
        default: ['300', '301', '302', '303', '305', '307'],
        order: 5
    },
    responseCommands: {
        description: 'Atom command to run on the response body (e.g., to format).',
        type: 'array',
        default: [],
        order: 6
    },
    responseGrammar: {
        description: 'Language grammar to use for the response.',
        type: 'string',
        default: 'HTTP Message',
        order: 7
    },
    openInPane: {
        description: 'Show response side by side in a pane',
        type: 'boolean',
        default: true,
        order: 8
    }
};

const errorMessages = {
    ECONNREFUSED: 'Connection refused',
    ECONNRESET: 'Connection reset by peer',
    ETIMEDOUT: 'Operation timed out'
};

let modalPanel;
let modalView;
let lastResponseEditor;
let requestProcess;

// -----------------------------------------------------------------------------

function activate() {
    atom.commands.add('atom-workspace', 'rester:request', makeRequest);
    modalView = new ModalProgressView();
    modalView.on('cancel', cancelRequest);
    modalPanel = atom.workspace.addModalPanel({
      item: modalView.getElement(),
      visible: false
    });
}

function deactivate() {
    modalView.removeAllListeners();
    modalView.destroy();
    modalPanel.destroy();
    lastResponseEditor = undefined;
}

// -----------------------------------------------------------------------------

function makeRequest() {
    const requestEditor = atom.workspace.getActiveTextEditor();
    const responseEditor = getResponseEditor();
    // Do nothing if no editors exist.
    if (!requestEditor) {
        return;
    }
    modalPanel.show();
    requestProcess = new RequestProcess(requestEditor, responseEditor);
    requestProcess.on('cancel', (responseEditor) => {
        requestProcess.removeAllListeners();
        lastResponseEditor = responseEditor;
        modalPanel.hide();
        requestProcess = null;
    });
    requestProcess.on('end', (responseEditor) => {
        const pane = atom.workspace.paneForItem(responseEditor);
        requestProcess.removeAllListeners();
        responseEditor.scrollToBufferPosition([0, 0]);
        pane.activate();
        pane.activateItem(responseEditor);
        lastResponseEditor = responseEditor;
        modalPanel.hide();
        requestProcess = null;
    });
    requestProcess.on('error', (error) => {
        requestProcess.removeAllListeners();
        modalPanel.hide();
        atom.notifications.addError('Unable to make request.', {
            detail: errorMessages[error.code]
        });
        requestProcess = null;
    });
    requestProcess.run();
}

function cancelRequest() {
    if (requestProcess) {
        requestProcess.cancel();
    }
}

/**
 * Return the most recently used response editor, if it appears in the list
 * of current text editors.
 * @return {TextEditor} Most recently used response editor, or undefined
 */
function getResponseEditor() {
    if (!lastResponseEditor) {
        return;
    }
    const editors = atom.workspace.getTextEditors();
    for (let i = 0, u = editors.length; i < u; ++i) {
        let editor = editors[i];
        if (lastResponseEditor === editor) {
            return lastResponseEditor;
        }
    }
    lastResponseEditor = undefined;
    return;
}

// -----------------------------------------------------------------------------

module.exports = {
    activate,
    deactivate,
    config
};
