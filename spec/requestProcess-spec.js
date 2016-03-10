'use strict';

const RequestProcess = require('../lib/requestProcess').RequestProcess;

describe('RequestProcess', function () {

    describe('Selection', function () {

        const text = `
            POST http://localhost/path HTTP/1.1
            Host: localhost
            Content-type: text/plain

            This is the body
            `.trim();
        const lines = text.split('\n');

        beforeEach(() => {
            waitsForPromise(() => {
                const promise = atom.workspace.open();
                promise.then(function (editor) {
                    editor.setText(text);
                });
                return promise;
            });
        });

        it('Includes entire buffer when no text is selected', () => {
            const editor = atom.workspace.getActiveTextEditor();
            const proc = new RequestProcess(editor);
            const selection = proc.getSelectedText(editor);
            editor.setText(text);
            expect(selection).toEqual(text);
        });

        it('Includes only selected lines when text is selected', () => {
            const editor = atom.workspace.getActiveTextEditor();
            const proc = new RequestProcess(editor);
            editor.setCursorBufferPosition([0, 0]);
            editor.selectDown(2);
            const selection = proc.getSelectedText(editor);
            expect(selection).toContain(lines.slice(0,2).join('\n'));
            expect(selection).not.toContain(lines.slice(3).join('\n'));
        });

        it('includes multiple selections concatenated', function () {
            const editor = atom.workspace.getActiveTextEditor();
            const proc = new RequestProcess(editor);
            editor.setCursorBufferPosition([0, 0]);
            editor.addCursorAtBufferPosition([4, 0]);
            editor.selectToEndOfLine();
            const selection = proc.getSelectedText(editor);
            expect(selection).toContain(lines[0]);
            expect(selection).not.toContain(lines[1]);
            expect(selection).not.toContain(lines[2]);
            expect(selection).toContain(lines[4]);
        });
    });
});
