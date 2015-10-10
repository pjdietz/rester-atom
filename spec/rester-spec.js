/* jshint node: true, jasmine: true */
/* globals atom, waitsForPromise */
"use strict";

var rester = require("../lib/rester");

describe("RESTer", function () {

    var workspaceElement;

    beforeEach(function() {
        workspaceElement = atom.views.getView(atom.workspace);
        waitsForPromise(function() {
            return atom.packages.activatePackage("rester");
        });
    });
    
    it("displays modal view when starting request", function () {

        var panels, filter;

        filter = function (panel) {
            var classes = panel.getItem().classList, i, u;
            for (i = 0, u = classes.length; i < u; ++i) {
                if (classes[i] === "rester-request-progress") {
                    return true;
                }
            }
            return false;
        };

        panels = atom.workspace.getModalPanels().filter(filter);
        expect(panels.length).toEqual(0);

        atom.commands.dispatch(workspaceElement, "rester:request");

        panels = atom.workspace.getModalPanels().filter(filter);
        expect(panels.length).toEqual(1);

    });

});
