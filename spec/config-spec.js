'use strict';

const http = require('http');
const rester = require('../lib/rester');
/** Port to use for local server. */
const port = 8123;

describe('Config', function () {

    beforeEach(function () {
        this.activationPromise = atom.packages.activatePackage('rester');
        this.workspaceElement = atom.views.getView(atom.workspace);
        this.requestEditor = undefined; // Set by dispatchCommand

        // Create and start a server.
        this.server = http.createServer();
        this.server.on('request', (request, response) => {
            if (request.url === '/') {
                // Hello, world!
                response.statusCode = 200;
                response.setHeader('Content-Type', 'text/plain');
                response.write('Hello, world!');
                response.end();
            } else if (request.url.startsWith('/redirect/')) {
                // Redirect the client from /redirect/{code}/{n} to
                // /redirect/{code}/{n-1}; If n = 1, redirects to /hello
                let location = '/';
                let parts = request.url.slice(1).split('/');
                let code = parts[1];
                let n = parseInt(parts[2], 10);
                if (n > 1) {
                    location = '/redirect/' + code + '/' + (n - 1);
                }
                response.statusCode = code;
                response.setHeader('Location', location);
                response.end();
            } else if (request.url === '/echo') {
                // Response body will contain Request body
                response.statusCode = 201;
                if (request.headers['content-type']) {
                    response.setHeader('Content-Type', request.headers['content-type']);
                }
                request.pipe(response);
            } else {
                response.statusCode = 404;
                response.write(`Not found: ${request.url}`);
                response.end();
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
            waitsForPromise(() => {
                return this.activationPromise;
            });
        };
        // Block until the server sends a response.
        this.waitsForResponse = function () {
            waitsFor(() => {
                let editors = atom.workspace.getTextEditors();
                if (editors.length > 1) {
                    this.responseEditor = (editors[0] === this.requestEditor) ?
                        editors[1] : editors[0];
                    return true;
                }
                return false;
            });
        };
        // Block until the request editor is reactivted.
        this.waitsForRequestEditorActive = function () {
            waitsFor(() => {
                return this.requestPane.isActive();
            });
        };
    });

    afterEach(function (done) {
        this.server.close(done);
        this.server = undefined;
    });

    describe('Response Headers', function () {
        function assertShowsHeaders() {
            it('Includes headers in response', function () {
                let response = this.responseEditor.getText();
                expect(response).toContain('HTTP/1.1 200 OK');
            });
        }

        function assertHidesHeaders() {
            it('Does not include headers in response', function () {
                let response = this.responseEditor.getText();
                expect(response).not.toContain('HTTP/1.1 200 OK');
            });
        }
        describe('When rester.showHeaders is true', function () {
            beforeEach(function () {
                atom.config.set('rester.showHeaders', true);
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsHeaders();
            });
            describe('And request contains @showHeaders: false', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/
                        @showHeaders: false`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertHidesHeaders();
            });
            describe('And request contains @hideHeaders', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/
                        @hideHeaders`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertHidesHeaders();
            });
        });
        describe('When rester.showHeaders is false', function () {
            beforeEach(function () {
                atom.config.set('rester.showHeaders', false);
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertHidesHeaders();
            });
            describe('And request contains @showHeaders', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/
                        @showHeaders`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsHeaders();
            });
        });
    });

    describe('Redrects', function () {

        function assertShowsFinalRespose() {
            it('Displays final response', function () {
                let response = this.responseEditor.getText();
                expect(response).toContain('HTTP/1.1 200 OK');
            });
        }

        function assertShowsRedirectResponse() {
            it('Displays redirect response', function () {
                let response = this.responseEditor.getText();
                expect(response).toContain('HTTP/1.1 302 Found');
            });
        }

        function assertDoesNotShowRedirectResponse() {
            it('Displays redirect response', function () {
                let response = this.responseEditor.getText();
                expect(response).not.toContain('HTTP/1.1 302 Found');
            });
        }

        describe('When followRedircts is true', function () {
            beforeEach(function () {
                atom.config.set('rester.followRedirects', true);
                atom.config.set('rester.redirectStatusCodes', ['302']);
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsFinalRespose();
            });
            describe('And request contains @followerRedirects: false', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @followRedirects: false`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsRedirectResponse();
            });
        });
        describe('When followRedircts is false', function () {
            beforeEach(function () {
                atom.config.set('rester.followRedirects', false);
                atom.config.set('rester.redirectStatusCodes', ['302']);
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsRedirectResponse();
            });
            describe('And request contains @followerRedirects', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @followRedirects`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsFinalRespose();
            });
        });
        describe('When redirect code is in the list of codes to follow', function () {
            beforeEach(function () {
                atom.config.set('rester.followRedirects', true);
                atom.config.set('rester.redirectStatusCodes', ['302']);
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsFinalRespose();
            });
            describe('And @redirectStatusCodes does not include the code', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @redirectStatusCodes: [301]`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsRedirectResponse();
            });
        });
        describe('When redirect code is not in the list of codes to follow', function () {
            beforeEach(function () {
                atom.config.set('rester.followRedirects', true);
                atom.config.set('rester.redirectStatusCodes', ['301']);
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsRedirectResponse();
            });
            describe('And @redirectStatusCodes includes the code', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @redirectStatusCodes: [302]`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsFinalRespose();
            });
        });
        describe('When redirecting and showRedirects is false', function () {
            beforeEach(function () {
                atom.config.set('rester.followRedirects', true);
                atom.config.set('rester.redirectStatusCodes', ['302']);
                atom.config.set('rester.showRedirects', false);
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertDoesNotShowRedirectResponse();
                assertShowsFinalRespose();
            });
            describe('And request includes @showRedirects', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @showRedirects`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                assertShowsRedirectResponse();
                assertShowsFinalRespose();
            });
        });
        describe('When redirecting and showRedirects is true', function () {
            beforeEach(function () {
                atom.config.set('rester.followRedirects', true);
                atom.config.set('rester.redirectStatusCodes', ['302']);
                atom.config.set('rester.showRedirects', true);
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3`);
                    this.waitsForResponse();
                });
                assertShowsRedirectResponse();
                assertShowsFinalRespose();
            });
            describe('And request includes @showRedirects: false', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @showRedirects: false`);
                    this.waitsForResponse();
                });
                assertDoesNotShowRedirectResponse();
                assertShowsFinalRespose();
            });
            describe('And request includes @hideRedirects', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @hideRedirects`);
                    this.waitsForResponse();
                });
                assertDoesNotShowRedirectResponse();
                assertShowsFinalRespose();
            });
        });
    });

    describe('Response Grammar', function () {
        describe('When response grammar is set', function () {
            beforeEach(function () {
                atom.config.set('rester.responseGrammar', 'HTTP Message');
                waitsForPromise(() => {
                    return atom.packages.activatePackage('language-text');
                });
                waitsForPromise(() => {
                    return atom.packages.activatePackage('language-json');
                });
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                it('Sets response grammar to grammar from setting', function () {
                    let responseGrammar = this.responseEditor.getGrammar().name;
                    expect(responseGrammar).toEqual('HTTP Message');
                });
            });
            describe('And the request includes @responseGrammar: {name}', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/
                        @responseGrammar: JSON`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                it('Sets response grammar to override', function () {
                    let responseGrammar = this.responseEditor.getGrammar().name;
                    expect(responseGrammar).toEqual('JSON');
                });
            });
        });
    });

    describe('Response Commands', function () {
        describe('When response commands are set', function () {
            let testCommand1Called;
            let testCommand2Called;
            let testCommand3Called;
            beforeEach(function () {
                testCommand1Called = false;
                testCommand2Called = false;
                testCommand3Called = false;
                atom.config.set('rester.responseCommands', ['rester:test-command-1', 'rester:test-command-2']);
                atom.commands.add(this.workspaceElement, 'rester:test-command-1', function () {
                    testCommand1Called = true;
                });
                atom.commands.add(this.workspaceElement, 'rester:test-command-2', function () {
                    testCommand2Called = true;
                });
                atom.commands.add(this.workspaceElement, 'rester:test-command-3', function () {
                    testCommand3Called = true;
                });
            });
            describe('And there are no overrides', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                it('Runs each response command', function () {
                    expect(testCommand1Called).toBe(true);
                    expect(testCommand2Called).toBe(true);
                });
            });
            describe('And request contains an override as a single string', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/
                        @responseCommands: rester:test-command-3`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                it('Run each override command', function () {
                    expect(testCommand3Called).toBe(true);
                });
                it('Does not run default commandss', function () {
                    expect(testCommand1Called).not.toBe(true);
                    expect(testCommand2Called).not.toBe(true);
                });
            });
            describe('And request contains an override as a string list', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/
                        @responseCommands: rester:test-command-2, rester:test-command-3`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                it('Run each override command', function () {
                    expect(testCommand2Called).toBe(true);
                    expect(testCommand3Called).toBe(true);
                });
                it('Does not run default commandss', function () {
                    expect(testCommand1Called).not.toBe(true);
                });
            });
            describe('And request contains an override as an array', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/
                        @responseCommands: ["rester:test-command-2", "rester:test-command-3"]`);
                    this.waitsForResponse();
                    this.waitsForRequestEditorActive();
                });
                it('Run each override command', function () {
                    expect(testCommand2Called).toBe(true);
                    expect(testCommand3Called).toBe(true);
                });
                it('Does not run default commandss', function () {
                    expect(testCommand1Called).not.toBe(true);
                });
            });
        });
        describe('When response commands runs', function () {
            let testCommandCalled;
            beforeEach(function () {
                testCommandCalled = false;
                atom.config.set('rester.responseCommands', ['rester:test-command']);
                atom.commands.add(this.workspaceElement, 'rester:test-command', function () {
                    testCommandCalled = true;
                });
            });
            describe('And response contains headers', function () {
                beforeEach(function () {
                    atom.config.set('rester.showHeaders', true);
                    this.dispatchCommand(`GET http://localhost:${port}/`);
                    this.waitsForResponse();
                    waitsFor(() => {
                        return testCommandCalled;
                    });
                });
                it('Selection include body', function () {
                    expect(this.responseEditor.getSelectedText()).toEqual('Hello, world!');
                });
            });
            describe('And response contains body only', function () {
                beforeEach(function () {
                    atom.config.set('rester.showHeaders', false);
                    this.dispatchCommand(`GET http://localhost:${port}/`);
                    this.waitsForResponse();
                    waitsFor(() => {
                        return testCommandCalled;
                    });
                });
                it('Selection include body', function () {
                    expect(this.responseEditor.getSelectedText()).toEqual('Hello, world!');
                });
            });
        });
    });

    describe('Multiline form fields', function () {
        describe('When setting includes one delimiter', function () {
            beforeEach(function () {
                atom.config.set('rester.multilineFieldDelimiters', ['"""']);
                this.dispatchCommand(`
                    POST http://localhost:${port}/echo
                    @form

                    field: """Line 1\nLine 2"""`);
                this.waitsForResponse();
                this.waitsForRequestEditorActive();
            });
            it('Sends the multiline field value', function () {
                let response = this.responseEditor.getText();
                expect(response).toContain('field=Line%201%0ALine%202');
            });
        });
        describe('When setting includes two delimiters', function () {
            beforeEach(function () {
                atom.config.set('rester.multilineFieldDelimiters', ['<<<','>>>']);
                this.dispatchCommand(`
                    POST http://localhost:${port}/echo
                    @form

                    field: <<<Line 1\nLine 2>>>`);
                this.waitsForResponse();
                this.waitsForRequestEditorActive();
            });
            it('Sends the multiline field value', function () {
                let response = this.responseEditor.getText();
                expect(response).toContain('field=Line%201%0ALine%202');
            });
        });
    });
});
