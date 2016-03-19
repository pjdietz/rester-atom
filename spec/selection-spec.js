'use strict';

const Selector = require('../lib/selector');

const request = `
POST /path HTTP/1.1
Host: localhost:8080
Content-type: text/plain

This is the first line of the body.
This is the second line of the body.
`.trim();

describe('Selection', function () {
    beforeEach(function () {
        this.editor = undefined;
        waitsForPromise(() => { return atom.workspace.open(); });
    });
    describe('When there is no selection', function () {
        it('Includes entire buffer', function () {
            let editor = atom.workspace.getActiveTextEditor();
            editor.setText(request);
            let selector = new Selector(editor);
            let selection = selector.getSelection();
            expect(selection).toEqual(request);
        });
    });
    describe('When there is one selection', function () {
        it('Includes selected text', function () {
            let editor = atom.workspace.getActiveTextEditor();
            editor.setText(request);
            editor.setCursorBufferPosition([0, 0]);
            editor.selectDown(2);
            let selector = new Selector(editor);
            let selection = selector.getSelection();
            let lines = request.split('\n');
            expect(selection).toContain(lines.slice(0,2).join('\n'));
            expect(selection).not.toContain(lines.slice(3).join('\n'));
        });
    });
    describe('When there are multiple selections', function () {
        it('Includes selected text', function () {
            let editor = atom.workspace.getActiveTextEditor();
            editor.setText(request);
            editor.setCursorBufferPosition([0, 0]);
            editor.addCursorAtBufferPosition([4, 0]);
            editor.selectToEndOfLine();
            let selector = new Selector(editor);
            let selection = selector.getSelection();
            let lines = request.split('\n');
            expect(selection).toContain(lines[0]);
            expect(selection).not.toContain(lines[1]);
            expect(selection).not.toContain(lines[2]);
            expect(selection).toContain(lines[4]);
        });
    });
});
