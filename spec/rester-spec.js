/* jshint node: true, jasmine: true */
/* globals atom, waitsForPromise */
"use strict";

var http = require("http");

var rester = require("../lib/rester");

rester.createRequestProcess = function () {
    console.log("Hello, override!");
};

describe("RESTer", function () {

    var activationPromise, workspaceElement,
        /** Port to use for local servers. */
        port = 8123,
        /** Text to use to make a request to the local server. */
        requestTest = "GET http://localhost:8123/";

    beforeEach(function() {
        activationPromise = atom.packages.activatePackage("rester");
        workspaceElement = atom.views.getView(atom.workspace);
    });

    it("displays modal view when starting request", function () {
        var panel, server = http.createServer();
        // Start a local server that starts but never finished a response.
        // This gives the client time to test for the modal panel.
        runs(function () {
            server.on("request", function(request, response) {
                response.statusCode = 200;
                response.write("Hello, world!");
            });
            server.listen(port);
        });
        // Open an editor and set the text.
        waitsForPromise(function () {
            var promise = atom.workspace.open();
            promise.then(function (editor) {
                editor.setText(requestTest);
            });
            return promise;
        });
        // Run the command.
        runs(function () {
            expect(workspaceElement.querySelector(".rester-request-progress")).not.toExist();
            atom.commands.dispatch(workspaceElement, "rester:request");
        });
        // Wait until the package is activated.
        waitsForPromise(function () {
            return activationPromise;
        });
        // The view element should exist.
        runs(function () {
            expect(workspaceElement.querySelector(".rester-request-progress")).toExist();
        });
        // Wait for a modal panel.
        waitsFor(function () {
            var item = workspaceElement.querySelector(".rester-request-progress");
            panel = atom.workspace.panelForItem(item);
            return panel !== undefined;
        });
        // The modal panel should be visible.
        runs(function () {
            expect(panel.isVisible()).toBe(true);
            server.close();
        });
    });

    describe("Errors", function () {
        // These tests will not set up a server; this will cause a Connection
        // Refused error.
        it("displays error alert", function () {
            waitsForPromise(function () {
                var promise = atom.workspace.open();
                promise.then(function (editor) {
                    editor.setText(requestTest);
                });
                return promise;
            });
            runs(function () {
                atom.commands.dispatch(workspaceElement, "rester:request");
            });
            waitsForPromise(function () {
                return activationPromise;
            });
            waitsFor(function () {
                return atom.notifications.getNotifications().length > 0;
            });
            runs(function () {
                var notification = atom.notifications.getNotifications()[0];
                expect(notification.getType()).toEqual("error");
                expect(notification.getMessage()).toEqual("Unable to make request.");
            });
        });

        it("hides modal progress view after error", function () {
            var panel;
            waitsForPromise(function () {
                var promise = atom.workspace.open();
                promise.then(function (editor) {
                    editor.setText(requestTest);
                });
                return promise;
            });
            runs(function () {
                expect(workspaceElement.querySelector(".rester-request-progress")).not.toExist();
                atom.commands.dispatch(workspaceElement, "rester:request");
            });
            waitsForPromise(function () {
                return activationPromise;
            });
            waitsFor(function () {
                return atom.notifications.getNotifications().length > 0;
            });
            runs(function () {
                expect(workspaceElement.querySelector(".rester-request-progress")).toExist();
            });
            waitsFor(function () {
                var item = workspaceElement.querySelector(".rester-request-progress");
                panel = atom.workspace.panelForItem(item);
                return panel !== undefined;
            });
            runs(function () {
                expect(panel.isVisible()).toBe(false);
            });
        });
    });

    describe("Response", function () {

        var responseSent,
            server;

        beforeEach(function () {
            responseSent = false;
            server = http.createServer();
            server.on("request", function(request, response) {
                response.statusCode = 200;
                response.write("Hello, world!");
                response.end();
                responseSent = true;
            });
            server.listen(port);
        });
        afterEach(function () {
            server.close();
        });

        it("Writes response to new editor", function () {
            // Open an editor and set the text.
            waitsForPromise(function () {
                var promise = atom.workspace.open();
                promise.then(function (editor) {
                    editor.setText(requestTest);
                });
                return promise;
            });
            // Run the command.
            runs(function () {
                expect(workspaceElement.querySelector(".rester-request-progress")).not.toExist();
                atom.commands.dispatch(workspaceElement, "rester:request");
            });
            // Wait until the server finished sending the response.
            waitsFor(function () {
                return responseSent;
            });
            // There should be an additional pane with the response.
            runs(function () {
                expect(atom.workspace.getPanes().length).toEqual(2);
            });
        });

    });
});
