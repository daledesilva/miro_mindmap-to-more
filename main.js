




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
    console.log("Starting mind map conversion 6");

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



    // TODO
    // Remove nodes that are already represented in a group
    let siblingGroups = [];

    // check through all left edge siblingGroups, if it has only 1 in the array, check the right edge groups for the same Object, if it exists in a group by itself there tool, then keep it, otherwise, delete it.
    Object.keys(leftEdgeGroups).forEach( function (leftKey) {

        if(leftEdgeGroups[leftKey].length > 1) {
            // If it's a group of nodes, then add it to the new array
            siblingGroups.push(leftEdgeGroups[leftKey]);

        } else {
            // If it's a single node, check if it's got a group in the right edge list, if it does, don't add it.
            let node = leftEdgeGroups[leftKey][0];

            for (const [rightKey, rightEdgeGroup] of Object.entries(rightEdgeGroups)) {

                // If it's just got one node, than skip it
                if(rightEdgeGroup.length <= 1)  continue;

                // If it's in a group, then exit this function because we don't want to add it
                for( k=0; k<rightEdgeGroup.length; k++) {
                    if(rightEdgeGroup[k] === node) {
                        console.log("Found in a right edge group, so not added to sibling groups");
                        return;
                    }
                }
            }

            // Since it wasn't found in a right edge group, then add it as a group of 1
            siblingGroups.push(leftEdgeGroups[leftKey]);
        }
    });



    // copy all right edge siblingGroups that have more than 1 in the array, delete all other groups.







    // let siblingGroups = rightEdgeGroups;
    // [siblingGroups, leftEdgeGroups].reduce( function (outGroup, addGroup) {
    //     Object.keys(addGroup).forEach( function (key) {
    //         // if( outGroup[key] === undefined) {
    //         //     outGroup[key] = addGroup[key];
    //         // } else {
    //         //     if(outGroup[key].length < addGroup[key].length) {
    //         //         outGroup[key] = addGroup[key];
    //         //     }
    //         // }
    //     });
    //     return outGroup;
    // }, {});

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