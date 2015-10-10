/* jshint node: true, jasmine: true */
/* globals atom, waitsForPromise */
"use strict";

var rester = require("../lib/rester");

describe("RESTer", function () {

    var activationPromise, getModalPanel, workspaceElement;

    beforeEach(function() {
        activationPromise = atom.packages.activatePackage("rester");
        workspaceElement = atom.views.getView(atom.workspace);
    });

    it("displays modal view when starting request", function () {
        var panel;
        runs(function () {
            expect(workspaceElement.querySelector(".rester-request-progress")).not.toExist();
            atom.commands.dispatch(workspaceElement, "rester:request");
        });
        waitsForPromise(function () {
            return activationPromise;
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
            expect(panel.isVisible()).toBe(true);
        });

    });

});
