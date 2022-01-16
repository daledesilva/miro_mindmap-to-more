// import _ from 'lodash';




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
    console.log("Starting mind map conversion 13");

    let mindMap = getMindMap();

    miro.showNotification('Mind map has been converted')
}



async function getMindMap() {
    // Get selected widgets
    let selectedWidgets = await miro.board.selection.get();


    const rootNode = getRootNode(selectedWidgets);

    const nodesOnRight = getNodesOnRight(selectedWidgets, rootNode);
    const nodesOnLeft = getNodesOnLeft(selectedWidgets, rootNode);

    console.log('nodesOnRight', nodesOnRight);
    console.log('nodesOnLeft', nodesOnLeft);

    
    // console.log('LEFT EDGE GROUPS');
    // // Group all items aligned by left edge
    // let leftEdgeGroups = [];
    // selectedWidgets.map((widget) => {
    //     // console.log(widget.text)
    //     if(leftEdgeGroups[widget.bounds.left] === undefined) {
    //         leftEdgeGroups[widget.bounds.left] = [];
    //     }
    //     leftEdgeGroups[widget.bounds.left].push(widget);
    // })

    // console.log('RIGHT EDGE GROUPS');
    // // Group all items aligned by right edge
    // let rightEdgeGroups = [];
    // selectedWidgets.map((widget) => {
    //     // console.log(widget.text)
    //     if(rightEdgeGroups[widget.bounds.right] === undefined) {
    //         rightEdgeGroups[widget.bounds.right] = [];
    //     }
    //     rightEdgeGroups[widget.bounds.right].push(widget);
    // })

    // console.log('leftEdgeGroups', leftEdgeGroups);
    // console.log('rightEdgeGroups', rightEdgeGroups);



    // // Remove nodes that are already represented in a group
    // /////////////////

    // let siblingGroups = [];

    // // check through all left edge siblingGroups, if it has only 1 in the array, check the right edge groups for the same Object, if it exists in a group by itself there tool, then keep it, otherwise, delete it.
    // Object.keys(leftEdgeGroups).forEach( function (leftKey) {

    //     if(leftEdgeGroups[leftKey].length > 1) {
    //         // If it's a group of nodes, then add it to the new array
    //         siblingGroups.push(leftEdgeGroups[leftKey]);

    //     } else {
    //         // If it's a single node, check if it's got a group in the right edge list, if it does, don't add it.
    //         let node = leftEdgeGroups[leftKey][0];

    //         for (const [rightKey, rightEdgeGroup] of Object.entries(rightEdgeGroups)) {
    //             // console.log('Checking node against those in rightEdgeGroup ' + rightKey);

    //             // If it's just got one node, than skip it
    //             if(rightEdgeGroup.length <= 1)  continue;

    //             // If it's in a group, then exit this function because we don't want to add it
    //             for( k=0; k<rightEdgeGroup.length; k++) {
    //                 // console.log("iterating through right edge group");

    //                 if(rightEdgeGroup[k] === node) {
    //                     console.log("Found in a right edge group, so not added to sibling groups");
    //                     return;
    //                 }
    //             }
    //         }

    //         // Since it wasn't found in a right edge group, then add it as a group of 1
    //         siblingGroups.push(leftEdgeGroups[leftKey]);
    //     }
    // });



    // // copy all right edge siblingGroups that have more than 1 in the array, delete all other groups.
    // Object.keys(rightEdgeGroups).forEach( function (rightKey) {

    //     if(rightEdgeGroups[rightKey].length > 1) {
    //         // If it's a group of nodes, then add it to the new array
    //         siblingGroups.push(rightEdgeGroups[rightKey]);

    //     }

    // });


    // console.log('siblingGroups before subset removal', siblingGroups);
    // siblingGroups = removeSubsets(siblingGroups);





    // Issues:
    // It will still break for single nodes that align on both edges - these will always get grouped when they shouldn't.
    
    // It will still break when all nodes in a group align - as it won't know whether left aligned or right aligned is the correct one 
    // - this could be solved further by...
    // 1. Checking which side of root node it's on (This would dictate left or right)
    // 2. If both still same side, checking the distribution of notes




    // If a single node's border colour doesn't equal "transparent", then it's the root node


    // console.log('siblingGroups', siblingGroups);

}





function getRootNode(nodes) {

    for(k=0; k<nodes.length; k++) {
        console.log(nodes[k]);
        if(nodes[k].style.borderColor != "transparent") {
            console.log(nodes[k].plainText);
            return nodes[k];
        }
    }

}



function getNodesOnRight(nodes, rootNode) {
    const rootX = rootNode.bounds.x;
    const nodesOnRight = [];

    for(k=0; k<nodes.length; k++) {
        if(nodes[k].bounds.x > rootX) {
            nodesOnRight.push(nodes[k]);
        }
    }

    return nodesOnRight;
}

function getNodesOnLeft(nodes, rootNode) {
    const rootX = rootNode.bounds.x;
    const nodesOnLeft = [];

    for(k=0; k<nodes.length; k++) {
        if(nodes[k].bounds.x < rootX) {
            nodesOnLeft.push(nodes[k]);
        }
    }

    return nodesOnLeft;
}






// This helps remove subgroups where both edges align (ie. left edge group = 4, right edge group = 2 of those 4)
function removeSubsets(origGroups) {
    console.log('removing erroneous subsets');

    const newGroups = [];

    groupLoop:
    for( groupIndex=0; groupIndex<origGroups.length; groupIndex++ ) {
        let group = origGroups[groupIndex];

        // Compare with all other groups
        compareGroupLoop:
        for( compareGroupIndex=groupIndex+1; compareGroupIndex<origGroups.length; compareGroupIndex++ ) {
            let compareGroup = origGroups[compareGroupIndex];

            if( oneIsSubset(group, compareGroup) ) {
                // Add the greater group only
                if(group.length > compareGroup.length) {
                    newGroups.push(group);    
                } else {
                    newGroups.push(compareGroup);
                }
                
                // continue to the next group
                continue groupLoop;
            }
        }

        // It wasn';t a subset, so add it
        newGroups.push(group);

    }

    return newGroups;
}


function oneIsSubset(group1, group2) {

    for( nodeIndex=0; nodeIndex<group1.length; nodeIndex++ ) {
        const curNode = group1[nodeIndex];

        for( compareNodeIndex=0; compareNodeIndex<group2.length; compareNodeIndex++ ) {
            const compareNode = group2[compareNodeIndex];
            if(curNode === compareNode) {
                return true;
            }
        }
    }

    return false;

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