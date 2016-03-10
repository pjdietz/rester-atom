'use strict';

const http = require('http');
const rester = require('../lib/rester');

/** Port to use for local servers. */
const port = 8123;
/** Text to use to make a request to the local server. */
const requestTest = `GET http://localhost:${port}/`;

// -----------------------------------------------------------------------------

describe('RESTer', function () {

    let activationPromise;
    let workspaceElement;
    let server;

    beforeEach(function() {
        activationPromise = atom.packages.activatePackage('rester');
        workspaceElement = atom.views.getView(atom.workspace);
    });

    it('Displays modal view when starting request', function (done) {
        let server;
        // Start a local server that starts but never finishes a response.
        // This gives the client time to test for the modal panel.
        runs(() => {
            server = http.createServer();
            server.on("request", (request, response) => {
                response.statusCode = 200;
                response.write("Hello, world!");
            });
            server.listen(port);
        });
        // Open an editor and set the text.
        waitsForPromise(() => {
            const promise = atom.workspace.open();
            promise.then((editor) => {
                editor.setText(requestTest);
            });
            return promise;
        });
        // Run the command.
        runs(() => {
            expect(workspaceElement.querySelector('.rester-request-progress')).not.toExist();
            atom.commands.dispatch(workspaceElement, 'rester:request');
        });
        // Wait until the package is activated.
        waitsForPromise(() => {
            return activationPromise;
        });
        // The view element should exist.
        runs(() => {
            expect(workspaceElement.querySelector('.rester-request-progress')).toExist();
        });
        // Wait for a modal panel.
        let panel;
        waitsFor(() => {
            const item = workspaceElement.querySelector('.rester-request-progress');
            panel = atom.workspace.panelForItem(item);
            return panel !== undefined;
        });
        // The modal panel should be visible.
        runs(() => {
            expect(panel.isVisible()).toBe(true);
            server.close(done);
        });
    });

    describe('Errors', () => {
        // These tests will not set up a server; this will cause a Connection
        // Refused error.
        it('Displays error alert', () => {
            waitsForPromise(() => {
                const promise = atom.workspace.open();
                promise.then((editor) => {
                    editor.setText(requestTest);
                });
                return promise;
            });
            runs(() => {
                atom.commands.dispatch(workspaceElement, 'rester:request');
            });
            waitsForPromise(() => {
                return activationPromise;
            });
            waitsFor(() => {
                return atom.notifications.getNotifications().length > 0;
            });
            runs(() => {
                const notification = atom.notifications.getNotifications()[0];
                expect(notification.getType()).toEqual('error');
                expect(notification.getMessage()).toEqual('Unable to make request.');
            });
        });

        it('Hides modal progress view after error', function () {
            waitsForPromise(() => {
                const promise = atom.workspace.open();
                promise.then((editor) => {
                    editor.setText(requestTest);
                });
                return promise;
            });
            runs(() => {
                expect(workspaceElement.querySelector('.rester-request-progress')).not.toExist();
                atom.commands.dispatch(workspaceElement, 'rester:request');
            });
            waitsForPromise(() => {
                return activationPromise;
            });
            waitsFor(() => {
                return atom.notifications.getNotifications().length > 0;
            });
            runs(() => {
                expect(workspaceElement.querySelector('.rester-request-progress')).toExist();
            });
            let panel;
            waitsFor(() => {
                const item = workspaceElement.querySelector('.rester-request-progress');
                panel = atom.workspace.panelForItem(item);
                return panel !== undefined;
            });
            runs(() => {
                expect(panel.isVisible()).toBe(false);
            });
        });
    });

    describe('Response', () => {

        let responseSent;
        let server;

        beforeEach(() => {
            responseSent = false;
            server = http.createServer();
            server.on('request', (request, response) => {
                console.log('SERVER RECEIEVED REQUEST');
                response.statusCode = 200;
                response.write('Hello, world!');
                response.end();
                responseSent = true;
            });
            server.listen(port);
        });
        afterEach((done) => {
            server.close(done);
        });

        it('Hides modal progress view after response', () => {
            // Open an editor and set the text.
            waitsForPromise(() => {
                const promise = atom.workspace.open();
                promise.then((editor) => {
                    editor.setText(requestTest);
                });
                return promise;
            });
            // Run the command.
            runs(() => {
                expect(workspaceElement.querySelector('.rester-request-progress')).not.toExist();
                atom.commands.dispatch(workspaceElement, 'rester:request');
            });
            // Wait until the server finished sending the response.
            waitsFor(() => {
                return responseSent;
            });
            let panel;
            waitsFor(() => {
                const item = workspaceElement.querySelector(".rester-request-progress");
                panel = atom.workspace.panelForItem(item);
                return panel !== undefined;
            });
            runs(() => {
                expect(panel.isVisible()).toBe(false);
            });
        });

        it('Reactivates request editor after response', () => {
            let requestEditor;
            let requestPane;
            // Open an editor and set the text.
            waitsForPromise(() => {
                const promise = atom.workspace.open();
                promise.then((editor) => {
                    editor.setText(requestTest);
                    requestEditor = editor;
                    requestPane = atom.workspace.paneForItem(requestEditor);
                });
                return promise;
            });
            // Run the command.
            runs(() => {
                atom.commands.dispatch(workspaceElement, 'rester:request');
            });
            // Wait until the server finished sending the response.
            waitsFor(() => {
                return responseSent;
            });
            // There should be an additional pane with the response.
            runs(() => {
                expect(atom.workspace.getActivePane()).toBe(requestPane);
                expect(atom.workspace.getActiveTextEditor()).toBe(requestEditor);
            });
        });

        it('Writes response to new editor', () => {
            // Open an editor and set the text.
            waitsForPromise(() => {
                const promise = atom.workspace.open();
                promise.then((editor) => {
                    editor.setText(requestTest);
                });
                return promise;
            });
            // Run the command.
            runs(() => {
                expect(workspaceElement.querySelector('.rester-request-progress')).not.toExist();
                atom.commands.dispatch(workspaceElement, 'rester:request');
            });
            // Wait until the server finished sending the response.
            waitsFor(() => {
                return responseSent;
            });
            // There should be an additional pane with the response.
            runs(() => {
                expect(atom.workspace.getPanes().length).toEqual(2);
            });
        });

        it('Writes response to previously used editor', function () {
            let requestEditor;
            // Open an editor and set the text.
            waitsForPromise(() => {
                const promise = atom.workspace.open();
                promise.then((editor) => {
                    editor.setText(requestTest);
                    requestEditor = editor;
                });
                return promise;
            });
            // Run the command.
            runs(() => {
                atom.commands.dispatch(workspaceElement, 'rester:request');
            });
            // Wait until the server finished sending the response.
            waitsFor(() => {
                return responseSent;
            });
            // There should be an additional pane with the response.
            runs(() => {
                expect(atom.workspace.getTextEditors().length).toEqual(2);
                responseSent = false;
                atom.commands.dispatch(workspaceElement, 'rester:request');
            });
            // Wait until the server finished sending the response.
            waitsFor(() => {
                return responseSent;
            });
            // There should be an additional pane with the response.
            runs(() => {
                expect(atom.workspace.getTextEditors().length).toEqual(2);
            });
        });

        xdescribe("Cancel", function () {
            it("Request can be canceled while waiting for response");
            it("Request can be canceled while receiving response");
        });
        xit("Sets response editor grammar");
    });
});
