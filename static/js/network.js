// This script contains the code that creates the central network, as well as
// a function for resetting it to a brand new page.


var nodes, edges, network; //Global variables
var startpages = [];
// Tracks whether the network needs to be reset. Used to prevent deleting nodes
// when multiple nodes need to be created, because AJAX requests are async.
var needsreset = true;
var last_clicked_node = null; 

var container = document.getElementById('container');
//Global options

var options = {
  nodes: {
    shape: 'dot',
    scaling: { min: 20,max: 30,
      label: { min: 14, max: 30, drawThreshold: 9, maxVisible: 20 }
    },
    font: {size: 14, face: 'Helvetica Neue, Helvetica, Arial'},
    shapeProperties: {
      interpolation: false    // 'true' for intensive zooming
    },
  },
  interaction: {
    hover: true,
    hoverConnectedEdges: false,
    selectConnectedEdges: true,
  },


  
};

var nodes = new vis.DataSet();
var edges = new vis.DataSet();
var data = {nodes:nodes,edges:edges};
var initialized = false;

console.log(options)

function getEdgesOfNode(nodeId) {
  return edges.get().filter(function (edge) {
    return edge.from === nodeId || edge.to === nodeId;
  });
}

function save_graph(){
  console.log('saving time')
  console.log(data)
  console.log(concept_searched)
  $.post( "/save_graph", { "graph_data": JSON.stringify(data), "concept_searched": concept_searched }, function(d) {
        console.log(d)
      });
}

function expandAndScrollTo(node_id) {
    var tree = $("#tree").fancytree("getTree");
    var node = tree.getNodeByKey(node_id);
    node.makeVisible({scrollIntoView: false});
    node.setExpanded(true);
    node.scrollIntoView({inline: 'start'});
    node.setActive();
    // node.setExpanded(true).then(()=>{
    // node.makeVisible();
    // node.span.scrollIntoView({behavior:'smooth', inline:'start'}); });
}


function expandEvent (params) { // Expand a node (with event handler)
  if (params.nodes.length) { //Did the click occur on a node? 
    root_clicked = false;
    viewing_symbols = false;
    var node_name = params.nodes[0]; //The id of the node clicked
    if(node_name == concept){
      root_clicked = true;
    }
    var node_data = nodes.get(node_name);

    if(root_clicked){
      var tree = $("#tree").fancytree("getTree");
      tree.expandAll(false);
    }
    else{
      var treeview_id = node_data.tv_id;
      expandAndScrollTo(treeview_id);
    }

    last_clicked_node = node_name;
    if(node_name in concept_dict){
      var sb = document.getElementById('sidebar')
      create_image_sidebar2(concept_dict[node_name].urls,node_name)
      update_delete_node_button(node_name);
    }
  }
  // clicked on white-space
  else{
    update_delete_node_button(null);
  }
}

function set_node_image(concept){
  console.log('in set_node_image!')
  var nodes_data_object = nodes.getDataSet();
  var node_data_list = nodes_data_object['_data'];
  var node = node_data_list[concept]
  
  /* Comment this section for old version */
  // var urls_and_labels = concept_dict[concept].urls; 
  // var first_url = urls_and_labels[0][0];

  var search_terms = Object.keys(concept_dict[concept].urls);
  var search_term = search_terms[0]; 
  console.log("SEARCH_TERM: " + search_term);
  var first_url = concept_dict[concept].urls[search_term][0];
  // nodes.update({id:node,label:node,shape:"circularImage",image:first_url, font:{color: 'black'}});
  

  nodes.update({id:concept,shape:"circularImage",image:first_url});
  
  /*for(var i = 0; i < urls_and_labels.length; i++){
    var url_and_label = urls_and_labels[i];
    var url = url_and_label[0];
    var label = url_and_label[1];

  }*/

  /* Uncomment for old version
  var url = concept_dict[concept].urls[0]
  nodes.update({id:concept,shape:"circularImage",image:url});
  */
}


function expand_get_words_images(node_name,is_start) {
  $.post( "/expand_node", 
    { "node_name": node_name, "root_word": concept }, 
    function(data) {
      
      concept_dict = data["swow_dict"];
      // console.log(concept_dict["zoo"])
      var term_entry = concept_dict[node_name];
      console.log("greetings!")
      console.log(node_name)
      term_entry.selected_urls = {};
      term_entry.tree_view_json = data["tree_view_json"];


      // console.log(data)
      // var term = {};
      // term.tree_view_json = data["tree_view_json"];
      // term.related_words = data;
      // term.selected_urls = {};
      // concept_dict[node_name] = term;
    
      if(is_start){
        var sb = document.getElementById('sidebar')
        sb.innerHTML = '';
        $("#sidebar").animate({scrollTop: 0},2000);
        fillSidebar4(node_name)
      }
      root_google_search(node_name,is_start,false);
  });
}





function addNode(parent,child,treeview_child_id){
  console.log('adding ' + String(child))
  var node = nodes.get(parent); //The node that was clicked
  var level = node.level + 1; //Level for new nodes is one more than parent

  // Add all children to network
  var subnodes = [];
  var newedges = [];
  // Where new nodes should be spawned
  var nodeSpawn = getSpawnPosition(parent);
  //Create node objects
  // var subpageID = child;
  if (nodes.getIds().indexOf(child) == -1) { //Don't add if node exists
      subnodes.push({id:child, label:child, tv_id:treeview_child_id, value:1,
                     level:level, color:getColor(level), parent:parent,
                     x:nodeSpawn[0], y:nodeSpawn[1]}); //Add node
  }

  if (!getEdgeConnecting(parent, child) && !getEdgeConnecting(child,parent) && parent != child) { //Don't create duplicate edges in same direction
    newedges.push({from: parent, to: child, color:getEdgeColor(level),
                   level: level, selectionWidth:2, hoverWidth:0});
  }


  //Add the stuff to the nodes array
  nodes.add(subnodes);
  edges.add(newedges);

  // expand_get_words_images(child,false);
  // google_search(child,false,false);
}


//Reset the color of all nodes, and width of all edges.
function resetProperties() {
  if (!isReset) {
    selectedNode = null;
    //Reset node color
    var modnodes = tracenodes.map(function(i){return nodes.get(i);});
    colorNodes(modnodes, 0);
    //Reset edge width and color
    var modedges = traceedges.map(function(i){
      var e=edges.get(i);
      e.color=getEdgeColor(nodes.get(e.to).level);
      return e;
    });
    edgesWidth(modedges, 1);
    tracenodes = [];
    traceedges = [];
  }
}


// Bind the network events
function bindNetwork(){
  network.on("click", expandEvent); // Expand on click
  network.on("zoom",limitZoom)
  network.on("")
}


//Make the network
function makeNetwork() {
  network = new vis.Network(container,data,options);
  bindNetwork();
  initialized=true;
}

// Reset the network to be new each time.
function resetNetwork(start) {
  if (!initialized) makeNetwork();
  // var startID = getNeutralId(start);
  var startID = start;
  startpages = [startID]; // Register the page as an origin node
  tracenodes = [];
  traceedges = [];

  // Change "go" button to a refresh icon
  // document.getElementById("submit").innerHTML = '<i class="icon ion-refresh"> </i>';

  // -- CREATE NETWORK -- //
  //Make a container
  nodes = new vis.DataSet([
    {id:startID, label:start, value:2, level:0,
     color:getColor(0), x:0, y:0, parent:startID} //Parent is self
  ]);
  edges = new vis.DataSet();
  //Put the data in the container
  data = {nodes:nodes,edges:edges};
  network.setData(data);
}


// Reset the network with the content from the input box.
function reset_graph_from_input() {
  console.log('reset network from input')
  // Network should be reset
  needsreset = true;
  var cf = document.getElementsByClassName("commafield")[0];
  // Items entered.
  var inputs = getItems(cf);
  // If no input is given, prompt user to enter articles
  if (!inputs[0]) {
    console.log('no input!')
    noInputDetected();
    return;
  }
  else{ // there is an input
    concept_searched = inputs[0]
    image_sb = document.getElementById('r_sidenav')
    words_sb = document.getElementById('sidebar')
    empty_dom(image_sb);
    empty_dom(words_sb)
    addStart(inputs[0])
    updateProgress()
  }
}

// Add a new start node to the map.
function addStart(start, index) {
  concept_searched = start;
  updateProgress()
  console.log('hello')
  if (needsreset) {
    // Delete everything only for the first call to addStart by tracking needsreset
    resetNetwork(start);
    needsreset = false;

    return;

  } else {
    var startID = getNeutralId(start);
    startpages.push(startID);
    nodes.add([
      {id:startID, label:wordwrap(decodeURIComponent(start),20), value:2, level:0,
      color:getColor(0), x:0, y:0, parent:startID} // Parent is self
    ]);
  }
}