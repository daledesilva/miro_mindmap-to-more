

miro.onReady(() => {
  
  miro.initialize({
    extensionPoints: {
      
      bottomBar: {
        title: 'convert mind map',
        svgIcon:
          '<circle cx="12" cy="12" r="9" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2"/>',
        positionPriority: 1,
        onClick: async () => startMindMapConversion(),
      },
      
    },
  })
  
})



startMindMapConversion = () => {
    let mindMap = getMindMap();
}


getMindMap = () => {
    // Get selected widgets
    let selectedWidgets = await miro.board.selection.get();

    // Filter mindMap from selected widgets
    // let mindMap = 
    selectedWidgets.filter((widget) => {
        console.log(widget.type)
    })

}


otherStuff = () => {
    // Delete selected stickers
    await miro.board.widgets.deleteById(stickers.map((sticker) => sticker.id))

    // Create shapes from selected stickers
    await miro.board.widgets.create(
        stickers.map((sticker) => ({
        type: 'shape',
        text: sticker.text,
        x: sticker.x,
        y: sticker.y,
        width: sticker.bounds.width,
        height: sticker.bounds.height,
        })),
    )

    // Show success message
    miro.showNotification('Mindmap has been converted')
}