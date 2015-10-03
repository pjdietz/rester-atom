ResterAtomView = require './rester-atom-view'
{CompositeDisposable} = require 'atom'

module.exports = ResterAtom =
  resterAtomView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @resterAtomView = new ResterAtomView(state.resterAtomViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @resterAtomView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'rester-atom:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @resterAtomView.destroy()

  serialize: ->
    resterAtomViewState: @resterAtomView.serialize()

  toggle: ->
    console.log 'ResterAtom was toggled!'

    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      @modalPanel.show()
