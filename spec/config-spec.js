'use strict';

const http = require('http');
const rester = require('../lib/rester');
/** Port to use for local server. */
const port = 8123;

describe('Config', function () {

    beforeEach(function() {
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

        this.getResponseEditor = function () {
            let editors = atom.workspace.getTextEditors();
            expect(editors.length).toEqual(2);
            // Locate the editor that is not the request editor.
            return (editors[0] === this.requestEditor) ? editors[1] : editors[0];
        };

        // Block until the command is activated.
        this.waitsForCommand = function () {
            waitsForPromise(() => { return this.activationPromise; });
        };
        // Block until the server sends a response.
        this.waitsForResponse = function () {
            waitsFor(() => {
                return atom.workspace.getTextEditors().length > 1;
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
                let response = this.getResponseEditor().getText();
                expect(response).toContain('HTTP/1.1 200 OK');
            });
        }
        function assertHidesHeaders() {
            it('Does not include headers in response', function () {
                let response = this.getResponseEditor().getText();
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
                });
                assertShowsHeaders();
            });
            describe('And request contains @showHeaders: false', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/
                        @showHeaders: false`);
                    this.waitsForResponse();
                });
                assertHidesHeaders();
            });
            describe('And request contains @hideHeaders', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/
                        @hideHeaders`);
                    this.waitsForResponse();
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
                });
                assertHidesHeaders();
            });
            describe('And request contains @showHeaders', function () {
                beforeEach(function () {
                    this.dispatchCommand(`GET http://localhost:${port}/
                        @showHeaders`);
                    this.waitsForResponse();
                });
                assertShowsHeaders();
            });
        });
    });

    describe('Redrects', function () {

        function assertShowsFinalRespose() {
            it('Displays final response', function () {
                let response = this.getResponseEditor().getText();
                expect(response).toContain('HTTP/1.1 200 OK');
            });
        }

        function assertShowsRedirectResponse() {
            it('Displays redirect response', function () {
                let response = this.getResponseEditor().getText();
                expect(response).toContain('HTTP/1.1 302 Found');
            });
        }

        function assertDoesNotShowRedirectResponse() {
            it('Displays redirect response', function () {
                let response = this.getResponseEditor().getText();
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
                });
                assertShowsFinalRespose();
            });
            describe('And request contains @followerRedirects: false', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @followRedirects: false`);
                    this.waitsForResponse();
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
                });
                assertShowsRedirectResponse();
            });
            describe('And request contains @followerRedirects', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @followRedirects`);
                    this.waitsForResponse();
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
                });
                assertShowsFinalRespose();
            });
            describe('And @redirectStatusCodes does not include the code', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @redirectStatusCodes: [301]`);
                    this.waitsForResponse();
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
                });
                assertShowsRedirectResponse();
            });
            describe('And @redirectStatusCodes includes the code', function () {
                beforeEach(function () {
                    this.dispatchCommand(`
                        GET http://localhost:${port}/redirect/302/3
                        @redirectStatusCodes: [302]`);
                    this.waitsForResponse();
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
});
