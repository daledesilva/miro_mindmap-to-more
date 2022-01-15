




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
    console.log("Starting mind map conversion 3");

    let mindMap = getMindMap();

    miro.showNotification('Mind map has been converted')
}



async function getMindMap() {
    // Get selected widgets
    let selectedWidgets = await miro.board.selection.get();

    
    console.log('LEFT EDGE GROUPS');
    // Group all items aligned by left edge
    let leftEdgeGroups = [];
    selectedWidgets.map((widget) => {
        // console.log(widget.text)
        if(leftEdgeGroups[widget.bounds.left] === undefined) {
            leftEdgeGroups[widget.bounds.left] = [];
        }
        leftEdgeGroups[widget.bounds.left].push(widget);
    })

    console.log('RIGHT EDGE GROUPS');
    // Group all items aligned by right edge
    let rightEdgeGroups = [];
    selectedWidgets.map((widget) => {
        // console.log(widget.text)
        if(rightEdgeGroups[widget.bounds.right] === undefined) {
            rightEdgeGroups[widget.bounds.right] = [];
        }
        rightEdgeGroups[widget.bounds.right].push(widget);
    })

    console.log('leftEdgeGroups', leftEdgeGroups);
    console.log('rightEdgeGroups', rightEdgeGroups);


    let siblingGroups = rightEdgeGroups;
    [siblingGroups, leftEdgeGroups].reduce( function (outGroup, addGroup) {
        Object.keys(addGroup).forEach( function (key) {
            if( outGroup[key] === undefined) {
                outGroups[key] = addGroup[key];
            } else {
                if(outGroup[key].length < addGroup[key].length) {
                    outGroup[key] = addGroup[key];
                }
            }
        });
        return outGroup;
    }, {});

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