'use strict';

const http = require('http');
const rester = require('../lib/rester');
/** Port to use for local server. */
const port = 8123;

// -----------------------------------------------------------------------------

describe('Requests', function () {

    beforeEach(function() {

        this.activationPromise = atom.packages.activatePackage('rester');
        this.workspaceElement = atom.views.getView(atom.workspace);
        this.modalPanel = undefined; // Set by waitsForModalPanel
        this.requestEditor = undefined; // Set by dispatchCommand
        this.requestPane = undefined; // Set by dispatchCommand

        // Set to false to test-long running requests.
        this.serverCanCloseResponse = true;
        // Server sets to true upon receiving a request.
        this.serverReceivedRequest = false;
        // Server sets to true upon sendinga a response.
        this.serverSentResponse = false;
        // Create and start a server.
        this.server = http.createServer();
        this.server.on('request', (request, response) => {
            this.serverReceivedRequest = true;
            response.statusCode = 200;
            response.setHeader('Content-Type', 'text/plain');
            response.write('Hello, world!');
            if (this.serverCanCloseResponse) {
                response.end();
                this.serverSentResponse = true;
            }
        });
        this.server.listen(port);

        // Open an editor, inside the passed text, and run the command.
        this.dispatchCommand = function (text) {
            runs(() => {
                atom.workspace.open().then((editor) => {
                    this.requestEditor = editor;
                    this.requestPane = atom.workspace.paneForItem(editor);
                    editor.setText(text);
                    atom.commands.dispatch(this.workspaceElement, 'rester:request');
                });
            });
        };

        // Block until the command is activated.
        this.waitsForCommand = function () {
            waitsForPromise(() => { return this.activationPromise; });
        };
        // Block until the modal panel exists.
        this.waitsForModalPanel = function () {
            waitsFor(() => {
                let item = this.workspaceElement.querySelector('.rester-request-progress');
                this.modalPanel = atom.workspace.panelForItem(item);
                return this.modalPanel !== undefined;
            });
        };
        // Block until the server receives a request.
        this.waitsForRequest = function () {
            waitsFor(() => { return this.serverReceivedRequest; });
        };
        // Block until the server sends a response.
        this.waitsForResponse = function () {
            waitsFor(() => { return this.serverSentResponse; });
        };
    });
    afterEach(function () {
        this.server.close();
        this.server = undefined;
    });

    describe('When request starts', function () {
        beforeEach(function () {
            this.serverCanCloseResponse = false;
            this.dispatchCommand(`GET http://localhost:${port}/`);
            this.waitsForCommand();
            this.waitsForModalPanel();
            this.waitsForRequest();
        });
        it('Displays modal view', function () {
            expect(this.modalPanel.isVisible()).toBe(true);
        });
    });

    describe('When user cancels request', function () {
        beforeEach(function () {
            this.serverCanCloseResponse = false;
            this.dispatchCommand(`GET http://localhost:${port}/`);
            this.waitsForCommand();
            this.waitsForModalPanel();
            this.waitsForRequest();
            runs(() => {
                this.workspaceElement.querySelector('.rester-request-progress button').click();
            });
        });
        it('Hides modal panel', function () {
            expect(this.modalPanel.isVisible()).toBe(false);
        });
    });

    describe('When request has an error', function () {
        beforeEach(function () {
            this.dispatchCommand(`GET http://localhost:${Number(port + 1)}/`);
            this.waitsForCommand();
            this.waitsForModalPanel();
            waitsFor(() => {
                return atom.notifications.getNotifications().length > 0;
            });
        });
        it('Displays error notification', function () {
            let notification = atom.notifications.getNotifications()[0];
            expect(notification.getType()).toEqual('error');
            expect(notification.getMessage()).toEqual('Unable to make request.');
        });
        it('Hides modal panel', function () {
            expect(this.modalPanel.isVisible()).toBe(false);
        });
    });

    describe('When initial request completes', function () {
        beforeEach(function () {
            this.dispatchCommand(`GET http://localhost:${port}/`);
            this.waitsForCommand();
            this.waitsForModalPanel();
            this.waitsForResponse();
        });
        it('Hides modal panel', function () {
            expect(this.modalPanel.isVisible()).toBe(false);
        });
        it('Reactivates request editor after response', function () {
            expect(atom.workspace.getActivePane()).toBe(this.requestPane);
            expect(atom.workspace.getActiveTextEditor()).toBe(this.requestEditor);
        });
        it('Writes response to new editor', function () {
            let editors = atom.workspace.getTextEditors();
            expect(editors.length).toEqual(2);
            // Locate the editor that is not the request editor.
            let responseEditor =
                (editors[0] === this.requestEditor) ? editors[1] : editors[0];
            expect(responseEditor.getText()).toContain('Hello, world!');
        });
    });

    describe('When subsequent request completes', function () {
        beforeEach(function () {
            this.dispatchCommand(`GET http://localhost:${port}/`);
            this.waitsForCommand();
            this.waitsForModalPanel();
            this.waitsForResponse();
            runs(() => {
                this.serverSentResponse = false;
                atom.commands.dispatch(this.workspaceElement, 'rester:request');
            });
            this.waitsForResponse();
        });
        it('Hides modal panel', function () {
            expect(this.modalPanel.isVisible()).toBe(false);
        });
        it('Reactivates request editor after response', function () {
            expect(atom.workspace.getActivePane()).toBe(this.requestPane);
            expect(atom.workspace.getActiveTextEditor()).toBe(this.requestEditor);
        });
        it('Writes response to previous response editor', function () {
            let editors = atom.workspace.getTextEditors();
            expect(editors.length).toEqual(2);
            // Locate the editor that is not the request editor.
            let responseEditor =
                (editors[0] === this.requestEditor) ? editors[1] : editors[0];
            expect(responseEditor.getText()).toContain('Hello, world!');
        });
    });
});
