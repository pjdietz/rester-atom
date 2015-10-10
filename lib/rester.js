/* jshint node: true */
/* globals atom, Promise */
"use strict";

var ModalProgressView = require("./modalProgressView");

function makeRequest() {
    var modalView = new ModalProgressView(),
        modalPanel = atom.workspace.addModalPanel({
            item: modalView.getElement(),
            visible: true
        });

    console.log("Making request.");
    console.log(modalPanel.getItem());
    console.log(modalPanel.getItem().classList);
}

// -----------------------------------------------------------------------------

module.exports = {
    activate: function() {
        atom.commands.add("atom-workspace", "rester:request", makeRequest);
    },
    config: {
        outputHeaders: {
            description: "Include status line and headers in the response buffer.",
            type: "boolean",
            default: true
        },
        followRedirects: {
            description: "Automatically follow redirect responses with status codes in `Redirect Status Codes`.",
            type: "boolean",
            default: true
        },
        redirectStatusCodes: {
            description: "When `Follow Redirects` is enabled, automatically follow responses with these status codes.",
            type: "array",
            default: ["300", "301", "302", "303", "305", "307"],
        },
        responseCommands: {
            description: "Atom command to run on the response body (e.g., to format).",
            type: "array",
            default: []
        },
        responseGrammar: {
            description: "Language grammar to use for the response.",
            type: "string",
            default: "HTTP Message"
        }
    }
};
