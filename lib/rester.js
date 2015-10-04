var Client = require("rester-client").Client,
    Parser = require("rester-client").Parser;

var eol = "\r\n",
    responseEditor;

function getSelectionOrText(editor) {
    var selection = editor.getSelectedText().trim();
    if (selection.length > 0) {
        return selection;
    }
    return editor.getText();
}

function displayResponse(response) {
    if (responseEditor) {
        try {
            if (!responseEditor.isEmpty()) {
                responseEditor.selectAll();
                responseEditor.delete();
            }
            writeResponse(response, responseEditor, function () {
                responseEditor.setCursorBufferPosition([0, 0]);
            });
        } catch (e) {
             responseEditor = null;
             displayResponse(response);
        }
    } else {
        atom.workspace.open(undefined, {
            split: "right"
        }).then(function (editor) {
            responseEditor = editor;
            writeResponse(response, responseEditor, function () {
                responseEditor.setCursorBufferPosition([0, 0]);
            });
        });
    }
}

function makeRequest() {
    var parser = new Parser(),
        editor = atom.workspace.getActiveTextEditor(),
        text = getSelectionOrText(editor);
    parser.parse(text, function (error, options, body) {
        var client = new Client();
        client.on("response", function (response, willRedirect) {
            if (!willRedirect) {
                displayResponse(response);
            }
        });
        client.on("error", function (message) {
            atom.notifications.addError("Error making request", {detail: message});
        });
        client.request(options, body);
    });
}

function writeResponse(response, editor, callback) {
    var i, u;

    // Status line
    editor.insertText([
        "HTTP/" + response.httpVersion,
        response.statusCode,
        response.statusMessage
    ].join(" ") + eol);

    // Headers
    for (i = 0, u = response.rawHeaders.length; i < u; ++i) {
        editor.insertText(response.rawHeaders[i]);
        editor.insertText(i % 2 === 0 ? ": " : eol);
    }
    editor.insertText(eol);

    // Body
    response.setEncoding(editor.getEncoding());
    response.on("data",  function (chunk) {
        editor.insertText(chunk);
    });
    response.on("end", function () {
        callback();
    });
}

// -----------------------------------------------------------------------------

module.exports = {
    activate: function() {
        atom.commands.add("atom-workspace", "rester:request", makeRequest);
    }
};
