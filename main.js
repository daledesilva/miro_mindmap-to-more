




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





async function startMindMapConversion() {
    console.log("Starting mind map conversion 1");

    let mindMap = getMindMap();

    miro.showNotification('Mind map has been converted')
}



async function getMindMap() {
    // Get selected widgets
    let selectedWidgets = await miro.board.selection.get();

    let siblingGroups = [];

    // Filter mindMap from selected widgets
    selectedWidgets.map((widget) => {
        console.log(widget.text)
        siblingGroups[widget.bounds.x] = widget;
    })

    console.log('siblingGroups', siblingGroups);

}






// otherStuff = () => {
//     // Delete selected stickers
//     await miro.board.widgets.deleteById(stickers.map((sticker) => sticker.id))

//     // Create shapes from selected stickers
//     await miro.board.widgets.create(
//         stickers.map((sticker) => ({
//         type: 'shape',
//         text: sticker.text,
//         x: sticker.x,
//         y: sticker.y,
//         width: sticker.bounds.width,
//         height: sticker.bounds.height,
//         })),
//     )

//     // Show success message
//     miro.showNotification('Mindmap has been converted')
// }