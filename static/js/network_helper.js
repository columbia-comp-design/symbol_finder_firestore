

// Get the position in which nodes should be spawned given the id of a parent node.
// This position is in place so that nodes begin outside the network instead of at the center,
// leading to less chaotic node openings in large networks.
function getSpawnPosition(parentID) {
  // Get position of the node with specified id.
  var pos = network.getPositions(parentID)[parentID];
  var x = pos.x, y=pos.y;
  var cog = getCenter();
  // Distances from center of gravity to parent node
  var dx = cog[0]-x, dy = cog[1]-y;

  var relSpawnX, relSpawnY;

  if (dx === 0) { // Node is directly above center of gravity or on it, so slope will fail.
    relSpawnX = 0;
    relSpawnY = -sign(dy)*100;
  } else {
    // Compute slope
    var slope = dy/dx;
    // Compute the new node position.
    var dis = 200; // Distance from parent. This should be equal to network.options.physics.springLength;
    relSpawnX = dis / Math.sqrt( Math.pow(slope,2)+1 );
    relSpawnY = relSpawnX * slope;
  }
  return [Math.round(relSpawnX + x), Math.round(relSpawnY + y)];
}


limitZoom = function(){
  var afterzoomlimit = { //here we are setting the zoom limit to move to 
    scale: 0.49,
  }

  var biglimit ={
    scale: 3.0,
  }
  //console.log('zooming')

  // console.log(network.getScale())

  if(network.getScale() <= 0.49 )//the limit you want to stop at
  {
      network.moveTo(afterzoomlimit); //set this limit so it stops zooming out here
  }

  if(network.getScale() >= 3.0 )//the limit you want to stop at
  {
      network.moveTo(biglimit); //set this limit so it stops zooming out here
  }
}

// Convert a hex value to RGB
function hexToRGB(hex) {
  if (hex[0] == "#"){hex = hex.slice(1,hex.length);} // Remove leading #
  strips=[hex.slice(0,2),hex.slice(2,4),hex.slice(4,6)]; // Cut up into 2-digit strips
  return strips.map(function(x){return parseInt(x,16);}); // To RGB
}

function rgbToHex(rgb) {
  var hexvals = rgb.map(function(x){return Math.round(x).toString(16);});
  // Add leading 0s to make a valid 6 digit hex
  hexvals = hexvals.map(function(x){
    return x.length == 1 ? "0"+x : x;
  });
  return "#"+hexvals.join("");
}
// Lighten a given hex color by %
function lightenHex(hex,percent) {
  var rgb = hexToRGB(hex); // Convert to RGB
  if (percent>100) percent=100; //Limit to 100%
  var newRgb = rgb.map(function(x){
    return x+percent/100.0*(255-x); // This works because math.
  });
  return rgbToHex(newRgb); //and back to hex
}


// Get the color for a node, lighten a blue based on level. Subtle.
function getColor(level) {
  return lightenHex("#03A9F4",5*level); // Gets 5% lighter for each level
}

// A cross-browser compatible alternative to Math.sign, because support is atrocious
function sign(x) {
  if (Math.sign) {
    return Math.sign(x);
  } else if (x === 0) {
    return 0;
  } else {
    return x > 0 ? 1:-1;
  }
}

// Get the network's center of gravity
function getCenter() {
  var nodePositions = network.getPositions();
  var keys = Object.keys(nodePositions);
  // Find the sum of all x and y values
  var xsum = 0; ysum = 0;
  for (var i=0; i<keys.length; i++) {
    var pos = nodePositions[keys[i]];
    xsum += pos.x;
    ysum += pos.y;
  }
  return [xsum/keys.length, ysum/keys.length]; // Average is sum divided by length
}

// Get the color that an edge should be pointing to a certain level
function getEdgeColor(level) {
  var nodecolor = getColor(level);
  return vis.util.parseColor(nodecolor).border;
}

// Get the id of the edge connecting two nodes a and b
function getEdgeConnecting(a, b) {
  var edge = edges.get({filter:function(edge) {
    return edge.from === a && edge.to === b;
  }})[0];
  if (edge instanceof Object) {
    return edge.id;
  }
}
