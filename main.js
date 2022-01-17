
const VERT_BUFFER = 60;
const HORZ_BUFFER = 30;




miro.onReady(() => {
  
  miro.initialize({
    extensionPoints: {
      
      bottomBar: {
        title: 'convert mind map 1',
        svgIcon:
          '<circle cx="12" cy="12" r="9" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2"/>',
        positionPriority: 1,
        onClick: async () => startMindMapConversion(),
      },
      
    },
  })
  
})





async function startMindMapConversion() {

    const mindMap = await getMindMap();
    await createVerticalMindMap(mindMap)

    setTimeout( async () => {
        await refineDownwardBranchLayout(mindMap);
        miro.showNotification('Mind map converted');

        console.log('mindMap', mindMap)
    }, 500)

    
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
        origRef: rootNode,
        childNodesBefore: getChildNodeTreesFrom(groupsToLeft, rootNode),
        childNodesAfter: getChildNodeTreesFrom(groupsToRight, rootNode),
    }


    // console.log( 'groupsToLeft', groupsToLeft);
    // console.log( 'groupsToRight', groupsToRight);
    // console.log( 'mindMap', mindMap);
    
    miro.showNotification('Mind map found')

    return mindMap;
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
    // TODO: Clone nodesLeft so it is immutable

    for( k=0; k<nodesLeft.length; k++ ) {
        const bottomEdge = getBottomEdge(nodesLeft[k]);
        const topEdge = getTopEdge(nodesLeft[k]);
        
        if(parentNode.bounds.y > topEdge && parentNode.bounds.y < bottomEdge) {
            // The group is the closest horizontal group roughly centred around this parent node, so it must be the children

            const childNodes = nodesLeft.splice(k, 1)[0];
            const childNodeTrees = [];

            for( let j=0; j<childNodes.length; j++ ) {
                childNodeTrees.push({
                    origRef: childNodes[j],
                    plainText: childNodes[j].plainText,
                    childNodes: getChildNodeTreesFrom(nodesLeft, childNodes[j]),
                });
            }
            return childNodeTrees;
        }
    }

    // Return emtry child node trees array because nothing was found
    return [];

}



function getBottomEdge(nodes) {
    edgeY = -5000000;
    for( let k=0; k<nodes.length; k++) {
        edgeY = Math.max(nodes[k].bounds.bottom, edgeY);
    }
    return edgeY;
}


function getTopEdge(nodes) {
    edgeY = 5000000;
    for( let k=0; k<nodes.length; k++) {
        edgeY = Math.min(nodes[k].bounds.top, edgeY);
    }
    return edgeY;
}










async function createVerticalMindMap(rootNode) {

    const origin = {
        x: rootNode.origRef.bounds.x,
        y: rootNode.origRef.bounds.y+1000,
    }

    const newRefs = await miro.board.widgets.create({
        type: 'shape',
        text: rootNode.origRef.text,
        x: origin.x,
        y: origin.y,
        // width: sticker.bounds.width,
        // height: sticker.bounds.height,
    })

    rootNode.newRef = newRefs[0];

    await createChildrenBelow(rootNode);
    await createChildrenAbove(rootNode);

    console.log('Created vertical mind map');
    
}




async function createChildrenBelow(parentNode) {
    
    const childNodes = parentNode.childNodesAfter || parentNode.childNodes;

    childNodes.map( async (childNode, index) => {
        const newRefs = await miro.board.widgets.create({
            type: 'shape',
            text: childNode.origRef.text,
            x: parentNode.newRef.bounds.x + index*(parentNode.newRef.bounds.width + HORZ_BUFFER),
            y: parentNode.newRef.bounds.bottom + VERT_BUFFER,
            // width: sticker.bounds.width,
            // height: sticker.bounds.height,
        })
        childNode.newRef = newRefs[0];
        await createChildrenBelow(childNode);
    })

}


async function createChildrenAbove(parentNode) {
    
    const childNodes = parentNode.childNodesBefore || parentNode.childNodes;

    childNodes.map( async (childNode, index) => {
        const newRefs = await miro.board.widgets.create({
            type: 'shape',
            text: childNode.origRef.text,
            x: parentNode.newRef.bounds.x + index*(parentNode.newRef.bounds.width + HORZ_BUFFER),
            y: parentNode.newRef.bounds.top - VERT_BUFFER,
            // width: sticker.bounds.width,
            // height: sticker.bounds.height,
        })
        childNode.newRef = newRefs[0];
        await createChildrenAbove(childNode);
    })

}





async function refineDownwardBranchLayout(node) {
    node.treeWidth = 0;

    const childNodes = node.childNodesAfter || node.childNodes;

    if(childNodes.length) {
        for( let k=0; k<childNodes.length; k++ ) {
            refineDownwardBranchLayout( childNodes[k] );
        }
    } else {
        console.log("ROTATING "+ node.newRef.plainText);

        miro.board.widgets.update({
            id: node.newRef.id,
            rotation: 90,
            // width: sticker.bounds.width,
            // height: sticker.bounds.height,
        })
    }

}





// TODO: If nodes are left that that have the same horz position but don't match the parent's vert position, they get left off.




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