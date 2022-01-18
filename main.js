
const BRANCH_BUFFER = 50;
const LEVEL_BUFFER = 100;




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
    await createNewMindMap(mindMap);
    
    
    
    // await sizeNodeAndLayOutItsChildren(mindMap);
    // miro.showNotification('Mind map converted');

    // console.log('mindMap', mindMap);



    setTimeout( async () => {
        
        // await layOutVerticalMindMap(mindMap);
        await layOutHorizontalMindMap(mindMap);

        miro.showNotification('Mind map converted');
        console.log('mindMap', mindMap);

    }, 10000)

    
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
        // Approximate to the nearest 10 pixels
        const leftX = Math.round(node.bounds.left*10)/10;
        
        if(groupDict[leftX] === undefined) {
            groupDict[leftX] = [];
        }
        groupDict[leftX].push(node);
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
        // Approximate to the nearest 10 pixels
        const rightX = Math.round(node.bounds.right*10)/10;

        if(groupDict[rightX] === undefined) {
            groupDict[rightX] = [];
        }
        groupDict[rightX].push(node);
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










async function createNewMindMap(rootNode) {

    const origin = {
        x: rootNode.origRef.bounds.x,
        y: rootNode.origRef.bounds.y+1000,
    }

    const newRefs = await miro.board.widgets.create({
        type: 'shape',
        text: rootNode.origRef.text,
        x: origin.x,
        y: origin.y,
    })

    rootNode.newRef = newRefs[0];

    await createChildNodesAfter(rootNode);
    await createChildNodesBefore(rootNode);
    
}




async function createChildNodesAfter(parentNode) {
    
    const childNodes = parentNode.childNodesAfter || parentNode.childNodes;

    childNodes.map( async (childNode, index) => {
        const newRefs = await miro.board.widgets.create({
            type: 'shape',
            text: childNode.origRef.text,
            x: parentNode.newRef.bounds.x + index*(parentNode.newRef.bounds.width + LEVEL_BUFFER),
            y: parentNode.newRef.bounds.bottom + BRANCH_BUFFER,
        })
        childNode.newRef = newRefs[0];
        await createChildNodesAfter(childNode);
    })

}


async function createChildNodesBefore(parentNode) {
    
    const childNodes = parentNode.childNodesBefore || parentNode.childNodes;

    childNodes.map( async (childNode, index) => {
        
        const newRefs = await miro.board.widgets.create({
            type: 'shape',
            text: childNode.origRef.text,
            x: parentNode.newRef.bounds.x + index*(parentNode.newRef.bounds.width + LEVEL_BUFFER),
            y: parentNode.newRef.bounds.top - BRANCH_BUFFER,
        })
        childNode.newRef = newRefs[0];
        
        await createChildNodesBefore(childNode);
    })

}





async function layOutVerticalMindMap(rootNode) {
    if(rootNode.childNodesBefore) {
        await layOutNodesAbove(rootNode, 1);
    }
    if(rootNode.childNodesAfter) {
        await layOutNodesBelow(rootNode, 1);
    }
}



async function layOutHorizontalMindMap(rootNode) {
    if(rootNode.childNodesBefore) {
        await layOutNodesToLeft(rootNode, 1);
    }
    if(rootNode.childNodesAfter) {
        await layOutNodesToRight(rootNode, 1);
    }
}



async function createLeafNodeRotated(node) {
    // Apply the values to bounds correctly as reference
    node.newRef.bounds.rotation = 90;
    node.newRef.bounds.height = 400;
    node.newRef.bounds.width = 50;
    // apply values to root ref to spreading to update call - dimension based on before rotation
    node.newRef.rotation = node.newRef.bounds.rotation;
    node.newRef.width = node.newRef.bounds.height;  // These are swapped because of the rotation
    node.newRef.height = node.newRef.bounds.width;
    await miro.board.widgets.update({
        ...node.newRef
    })
    node.treeWidth = node.newRef.bounds.width;
    node.treeHeight = node.newRef.bounds.height;
}



async function createLeafNode(node) {
    node.newRef.bounds.height = 50;
    node.newRef.bounds.width = 400;
    node.newRef.rotation = node.newRef.bounds.rotation;
    node.newRef.width = node.newRef.bounds.width;
    node.newRef.height = node.newRef.bounds.height;
    await miro.board.widgets.update({
        ...node.newRef
    })
    node.treeWidth = node.newRef.bounds.width;
    node.treeHeight = node.newRef.bounds.height;
}






async function layOutNodesAbove(parentNode, depth) {
    const childNodes = parentNode.childNodesBefore || parentNode.childNodes;
    const levelBuffer = LEVEL_BUFFER/(depth || 1);
    const branchBuffer = BRANCH_BUFFER/(depth || 1);

    // If there are no children, then it's a leaf node, so just size/rotate it and return it's width as it's treeWidth
    if(childNodes.length <= 0) {
        await createLeafNodeRotated(parentNode);
        return parentNode.treeWidth;
    }

    // It's got children, so calculate them first to get the overall width
    let thisTreeWidth = 0;
    for( let k=0; k<childNodes.length; k++ ) {
        const childNode = childNodes[k];
        const childTreeWidth = await layOutNodesAbove( childNode, depth+1 );
        thisTreeWidth += childTreeWidth;
    }
    thisTreeWidth += levelBuffer * (childNodes.length-1);

    // Size the parent node so it will fit all the child trees
    parentNode.newRef.bounds.width = parentNode.newRef.width = thisTreeWidth;
    await miro.board.widgets.update({
        ...parentNode.newRef
    })

    // Get relevant parent node edges for alignment
    const parentLeftEdge = parentNode.newRef.bounds.x - parentNode.newRef.bounds.width/2;
    const parentTopEdge = parentNode.newRef.bounds.y - parentNode.newRef.bounds.height/2;

    // Move all children trees into position
    let curOffsetXFromParent = 0;
    for( let k=0; k<childNodes.length; k++ ) {
        const childNode = childNodes[k];
        const offset = {};

        // Left boundary of the child node and all it's children as a group
        const childTreeLeftEdge = childNode.newRef.bounds.x - childNode.treeWidth/2;
        offset.x = (parentLeftEdge+curOffsetXFromParent) - childTreeLeftEdge;
        
        const childBottomEdge = childNode.newRef.bounds.y + childNode.newRef.bounds.height/2; // This width might not be right - It should be top if it's rotated, plus the ref's not been updated since adjusting
        offset.y = (parentTopEdge-branchBuffer) - childBottomEdge;

        await moveNodeTreeBy(childNode, offset);

        // Increment offset for next child node to be positioned
        curOffsetXFromParent += childNode.treeWidth + levelBuffer;  // reduces horizontal spacing with each step down the tree
    }

    // Save and return so this nodes parent can position it and it's siblings
    parentNode.treeWidth = thisTreeWidth;
    return parentNode.treeWidth;

}



async function layOutNodesBelow(parentNode, depth) {
    const childNodes = parentNode.childNodesAfter || parentNode.childNodes;
    const levelBuffer = LEVEL_BUFFER/(depth || 1);
    const branchBuffer = BRANCH_BUFFER/(depth || 1);

    // If there are no children, then it's a leaf node, so just size/rotate it and return it's width as it's treeWidth
    if(childNodes.length <= 0) {
        await createLeafNodeRotated(parentNode);
        return parentNode.treeWidth;
    }

    // It's got children, so calculate them first to get the overall width
    let thisTreeWidth = 0;
    for( let k=0; k<childNodes.length; k++ ) {
        const childNode = childNodes[k];
        const childTreeWidth = await layOutNodesBelow( childNode, depth+1 );
        thisTreeWidth += childTreeWidth;
    }
    thisTreeWidth += levelBuffer * (childNodes.length-1);

    // Size the parent node so it will fit all the child trees
    parentNode.newRef.bounds.width = parentNode.newRef.width = thisTreeWidth;
    await miro.board.widgets.update({
        ...parentNode.newRef
    })

    // Get relevant parent node edges for alignment
    const parentLeftEdge = parentNode.newRef.bounds.x - parentNode.newRef.bounds.width/2;
    const parentBottomEdge = parentNode.newRef.bounds.y + parentNode.newRef.bounds.height/2;

    // Move all children trees into position
    let curOffsetXFromParent = 0;
    for( let k=0; k<childNodes.length; k++ ) {
        const childNode = childNodes[k];
        const offset = {};

        // Left boundary of the child node and all it's children as a group
        const childTreeLeftEdge = childNode.newRef.bounds.x - childNode.treeWidth/2;
        offset.x = (parentLeftEdge+curOffsetXFromParent) - childTreeLeftEdge;
        
        const childTopEdge = childNode.newRef.bounds.y - childNode.newRef.bounds.height/2; // This width might not be right - It should be top if it's rotated, plus the ref's not been updated since adjusting
        offset.y = (parentBottomEdge+branchBuffer) - childTopEdge;

        await moveNodeTreeBy(childNode, offset);

        // Increment offset for next child node to be positioned
        curOffsetXFromParent += childNode.treeWidth + levelBuffer;  // reduces horizontal spacing with each step down the tree
    }

    // Save and return so this nodes parent can position it and it's siblings
    parentNode.treeWidth = thisTreeWidth;
    return parentNode.treeWidth;

}




async function layOutNodesToLeft(parentNode, depth) {
    const childNodes = parentNode.childNodesBefore || parentNode.childNodes;
    const levelBuffer = LEVEL_BUFFER/(depth || 1);
    const branchBuffer = BRANCH_BUFFER/(depth || 1);

    // If there are no children, then it's a leaf node, so just size/rotate it and return it's width as it's treeWidth
    if(childNodes.length <= 0) {
        await createLeafNode(parentNode);
        return parentNode.treeWidth;
    }

    // It's got children, so calculate them first to get the overall width
    let thisTreeWidth = 0;
    for( let k=0; k<childNodes.length; k++ ) {
        const childNode = childNodes[k];
        const childTreeWidth = await layOutNodesBelow( childNode, depth+1 );
        thisTreeWidth += childTreeWidth;
    }
    thisTreeWidth += levelBuffer * (childNodes.length-1);

    // Size the parent node so it will fit all the child trees
    parentNode.newRef.bounds.width = parentNode.newRef.width = thisTreeWidth;
    await miro.board.widgets.update({
        ...parentNode.newRef
    })

    // Get relevant parent node edges for alignment
    const parentLeftEdge = parentNode.newRef.bounds.x - parentNode.newRef.bounds.width/2;
    const parentBottomEdge = parentNode.newRef.bounds.y + parentNode.newRef.bounds.height/2;

    // Move all children trees into position
    let curOffsetXFromParent = 0;
    for( let k=0; k<childNodes.length; k++ ) {
        const childNode = childNodes[k];
        const offset = {};

        // Left boundary of the child node and all it's children as a group
        const childTreeLeftEdge = childNode.newRef.bounds.x - childNode.treeWidth/2;
        offset.x = (parentLeftEdge+curOffsetXFromParent) - childTreeLeftEdge;
        
        const childTopEdge = childNode.newRef.bounds.y - childNode.newRef.bounds.height/2; // This width might not be right - It should be top if it's rotated, plus the ref's not been updated since adjusting
        offset.y = (parentBottomEdge+branchBuffer) - childTopEdge;

        await moveNodeTreeBy(childNode, offset);

        // Increment offset for next child node to be positioned
        curOffsetXFromParent += childNode.treeWidth + levelBuffer;  // reduces horizontal spacing with each step down the tree
    }

    // Save and return so this nodes parent can position it and it's siblings
    parentNode.treeWidth = thisTreeWidth;
    return parentNode.treeWidth;

}




async function layOutNodesToRight(parentNode, depth) {
    const childNodes = parentNode.childNodesAfter || parentNode.childNodes;
    // depth reduces horizontal spacing with each step down the tree
    const levelBuffer = LEVEL_BUFFER/(depth || 1);
    const branchBuffer = BRANCH_BUFFER/(depth || 1);

    // If there are no children, then it's a leaf node, so just size/rotate it and return it's width as it's treeWidth
    if(childNodes.length <= 0) {
        await createLeafNode(parentNode);
        return parentNode.treeHeight;
    }

    // It's got children, so calculate them first to get the overall width
    let thisTreeHeight = 0;
    for( let k=0; k<childNodes.length; k++ ) {
        const childNode = childNodes[k];
        const childTreeHeight = await layOutNodesToRight( childNode, depth+1 );
        thisTreeHeight += childTreeHeight;
    }
    thisTreeHeight += branchBuffer * (childNodes.length-1);

    // Size the parent node so it will fit all the child trees
    parentNode.newRef.bounds.height = parentNode.newRef.height = thisTreeHeight;
    await miro.board.widgets.update({
        ...parentNode.newRef
    })

    // Get relevant parent node edges for alignment
    const parentTopEdge = parentNode.newRef.bounds.y - parentNode.newRef.bounds.height/2;
    const parentRightEdge = parentNode.newRef.bounds.x + parentNode.newRef.bounds.width/2;

    // Move all children trees into position
    let curOffsetYFromEdge = 0;
    for( let k=0; k<childNodes.length; k++ ) {
        const childNode = childNodes[k];
        const offset = {};

        // Top boundary of the child node and all it's children as a group
        const childTreeTopEdge = childNode.newRef.bounds.y - childNode.treeHeight/2;
        offset.y = (parentTopEdge+curOffsetYFromEdge) - childTreeTopEdge;
        
        const childLeftEdge = childNode.newRef.bounds.x - childNode.newRef.bounds.width/2;
        offset.x = (parentRightEdge+levelBuffer) - childLeftEdge;

        await moveNodeTreeBy(childNode, offset);

        // Increment offset for next child node to be positioned
        curOffsetYFromEdge += childNode.treeHeight + branchBuffer;
    }

    // Save and return so this nodes parent can position it and it's siblings
    parentNode.treeHeight = thisTreeHeight;
    return parentNode.treeHeight;

}







async function moveNodeTreeBy(node, offset) {

    const nodeArr = getNodeTreeAsArray(node);

    const widgetUpdateArr = [];
    for(curNode of nodeArr) {
        curNode.newRef.x += offset.x;
        curNode.newRef.y += offset.y;

        widgetUpdateArr.push({
            ...curNode.newRef
        })
    }
    
    await miro.board.widgets.update(widgetUpdateArr);
}


function getNodeTreeAsArray(node) {
    let nodeArr = [node];

    let childNodes;
    if(node.childNodesAfter) {
        childNodes = node.childNodesAfter.concat(node.childNodesBefore);
    } else {
        childNodes = node.childNodes;
    }

    for(childNode of childNodes) {
        nodeArr = nodeArr.concat( getNodeTreeAsArray(childNode) );
    }

    return nodeArr;
}





// TODO: If nodes are left that that have the same horz position but don't match the parent's vert position, they get left off.

