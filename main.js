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
    console.log("Starting mind map conversion 17");

    const mindMap = getMindMap();

    miro.showNotification('Mind map has been converted')
}



async function getMindMap() {
    let selectedWidgets = await miro.board.selection.get();

    const rootNode = getRootNode(selectedWidgets);

    const nodesOnRight = getNodesOnRight(selectedWidgets, rootNode);
    const nodesOnLeft = getNodesOnLeft(selectedWidgets, rootNode);

    const groupsToRight = groupByLeftEdge(nodesOnRight);
    const groupsToLeft = groupByRightEdge(nodesOnLeft);

    sortGroupsByDistFromRootNode(groupsToRight, rootNode);
    sortGroupsByDistFromRootNode(groupsToLeft, rootNode);

    
    const mindMap = {
        node: rootNode,
        childNodesBefore: getChildNodeTreesFrom(groupsToRight, rootNode),
        childNodesAfter: getChildNodeTreesFrom(groupsToLeft, rootNode),
    }


    console.log( 'mindMap', mindMap);

}






function getRootNode(nodes) {

    for(k=0; k<nodes.length; k++) {
        if(nodes[k].style.borderColor != "transparent") {
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



function groupByLeftEdge(nodes) {
    const groupDict = [];

    nodes.map((node) => {
        if(groupDict[node.bounds.left] === undefined) {
            groupDict[node.bounds.left] = [];
        }
        groupDict[node.bounds.left].push(node);
    })

    // Convert to array
    const groupArr = [];
    for(const [key, value] of Object.entries(groupDict)) {
        groupArr.push(value);
    }

    return groupArr;
}



function groupByRightEdge(nodes) {
    const groupDict = [];

    nodes.map((node) => {
        if(groupDict[node.bounds.right] === undefined) {
            groupDict[node.bounds.right] = [];
        }
        groupDict[node.bounds.right].push(node);
    })

    const groupArr = [];
    for(const [key, value] of Object.entries(groupDict)) {
        groupArr.push(value);
    }

    return groupArr;
}

    

// Sort the array from closes to furthest from rootNode
// TODO: THis should be made immutable
function sortGroupsByDistFromRootNode(nodes, rootNode) {
    
    nodes.sort( function (group1, group2) {
        const group1DistFromRoot = Math.abs(group1[0].bounds.x - rootNode.bounds.x);
        const group2DistFromRoot = Math.abs(group2[0].bounds.x - rootNode.bounds.x);
        return group1DistFromRoot - group2DistFromRoot;
    });
    
}



function getChildNodeTreesFrom(nodesLeft, parentNode) {

    for( k=0; k<nodesLeft.length; k++ ) {
        const highestEdge = getHighestEdge(nodesLeft[k]);
        const lowestEdge = getLowestEdge(nodesLeft[k]);
        if(parentNode.bounds.y > lowestEdge && parentNode.bounds.y < highestEdge) {
            // The group is the closest horizontal group roughly centred around this parent node, so it must be the children
            const childNodes = nodesLeft.splice(k, 1);
            const childNodeTrees = [];

            for( let j=0; j<childNodes.length; j++ ) {
                childNodeTrees.push({
                    node: childNodes[j],
                    plainText: childNodes[j].plainText,
                    childNodes: getChildNodeTreesFrom(nodesLeft, childNodes[j]),
                });
            }
            return childNodeTrees;
        }
    }

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