/*
 * This script contains functions that update the sidebars (both) / image selection
 * Savvas Petridis
 * March 29, 2019
 *
*/

// contains the words (from spacy) and urls (from google) associated with each concept
var concept_dict = {};
var chosen_clusters = {};

// a dictionary consisting of all the images the user has selected as symbols
var selected_symbols = {};
var selected_symbols_list = [];

// contains the concept searched on the search bar
var concept_searched = '';

// This global variable indicates if the user is currently viewing the collected symbols
var viewing_symbols = false;

var clusters_explored = [];

var showing_selected_symbols = false;

var on_step_one = true;

var start_time; 

// IF VERSION == 1, SIMILAR ONLY
// IF VERSION == 2, CONCRETE + GOOGLE SEARCH BEST PRACTICES
// IF STATE == 0, PRACTICE
// IF STATE == 1, REAL 


// This function empties a JS dom of all its children
empty_dom = function(d){
  while(d.firstChild){
    d.removeChild(d.firstChild);
  }
}

// Provides the count of symbols selected for each concept (or search term)
getConceptCounts = function(){
  concept_counts_dict = {};
  for (var url in selected_symbols) {
    if (selected_symbols.hasOwnProperty(url)) {
        var concept = selected_symbols[url].concept;
        var google_search_term = selected_symbols[url].google_search_term;
        if(concept in concept_counts_dict){
          concept_counts_dict[concept]["count"] = concept_counts_dict[concept]["count"] + 1;
          concept_counts_dict[concept]["urls"].push(url);
        }
        else{
          concept_counts_dict[concept] = {count:1,urls:[url]};
        }
    }
  }
  return concept_counts_dict;
}


populate_first_step_instructions = function(){
  var instruction_div = document.getElementById("instructions");

  var instruction_text = document.createElement("p");
  var number_of_clusters = String(tree_view_json.length);
  instruction_text.innerHTML = "Go through each of the " + number_of_clusters + " clusters below. <br> For each one, determine if the words are related to <b>" + concept_searched + "</b>. <br> Also, select any image you think is a good symbol for <b>" + concept_searched + "</b>."

  instruction_div.appendChild(instruction_text);
}

populate_second_step_instructions = function(){
  var element = document.getElementById("instructions");
  element.parentNode.removeChild(element);
  // instruction_div.innerHTML = "";
  /*var instruction_text = document.createElement("p");
  instruction_text.innerHTML = "Find concrete symbols for the concept: <b>" + concept_searched + "</b>. Select clusters on the left to explore the words within them and see their images."; 
  instruction_div.appendChild(instruction_text);*/
}



// This function adds the image to a node if a symbol was selected. 
// It also updates the count (label) for that node
updateNodes = function(){
  nodes_data_object = nodes.getDataSet();
  node_data_list = nodes_data_object['_data']
  concept_counts_dict = getConceptCounts();
  for(node in node_data_list){
    node_data = node_data_list[node];
    if(node in concept_counts_dict){
      cnt = concept_counts_dict[node]["count"]; 
      url = concept_counts_dict[node]["urls"][0];
      nodes.update({id:node,label:node + "\n (" + String(cnt) + ")",shape:"circularImage",image:url, font:{color:'#4ead67'}});
    }
    else{
      if(node in concept_dict){
         var search_terms = Object.keys(concept_dict[node].urls);
         var search_term = search_terms[0]; 
         var first_url = concept_dict[node].urls[search_term][0];
         nodes.update({id:node,label:node,shape:"circularImage",image:first_url, font:{color: 'black'}});
      }
    }
  }
}


var toggler = document.getElementsByClassName("caret");
var i;

for (i = 0; i < toggler.length; i++) {
  toggler[i].addEventListener("click", function() {
    console.log('toggler clicked!')
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("caret-down");
  });
}










// this function deletes a node, its outgoing edges, and the nodes attached to those outgoing edges.
delete_node = function(node_to_delete){
  
  console.log(nodes)
  var parent_node = nodes['_data'][node_to_delete]['parent'];
  var node_stack = [];
  var nodes_to_delete = [];
  var edges_to_delete = [];
  node_stack.push(node_to_delete)
  while(node_stack.length > 0){
    var current_node = node_stack[0];
    for(edge_id in edges['_data']){
      var edge = edges['_data'][edge_id]
      console.log(edge)
      console.log(edge['from'])
      if(edge['from'] == current_node){
        node_stack.push(edge['to']); 
        edges_to_delete.push(edge_id);
      }
    }
    nodes_to_delete.push(current_node);
    node_stack.shift();
  }
  network.selectEdges(edges_to_delete);
  network.selectNodes(nodes_to_delete);

  console.log('NODES TO DELETE: ')
  for(var i = 0; i < nodes_to_delete.length; i++){
    var nd = nodes_to_delete[i];
    var node_data = nodes.get(nd);
    console.log(nodes);
    console.log(node_data);
    var treeview_id = node_data.tv_id;
    console.log("TREEVIEW_ID: " + String(treeview_id));
    var tree = $("#tree").fancytree("getTree");
    var node = tree.getNodeByKey(treeview_id);
    node.setSelected(false);
  }

  var del_root = nodes.get(node_to_delete);
  var treeview_id = del_root.tv_id;
  var tree = $("#tree").fancytree("getTree");
  var node = tree.getNodeByKey(treeview_id);
  node.setExpanded(false);

  network.deleteSelected();


  // show parent node images and related words after delete:
  var parent_data = concept_dict[parent_node];
  create_image_sidebar(parent_data['urls'],parent_node); 

  // hide delete button
  var del_but = document.getElementById('delete_button');
  del_but.style.display="none";
}


update_delete_node_button = function(selected_node){
  if(selected_node != null){
    var is_root = false;
    if(nodes['_data'][selected_node].level == 0){
      is_root = true;
    }
    // can't delete root node
    if(is_root == false){
      var del_but = document.getElementById('delete_button');
      del_but.style.display="inline-block";
      del_but.innerHTML = "delete: " + String(selected_node);
      del_but.setAttribute('onclick', 'delete_node(\"'+selected_node+'\")');
    }
  }
  else{
    var del_but = document.getElementById('delete_button');
    del_but.style.display="none";
  }
}

update_saved_symbols = function(url,term,to_remove){


  var confirm_time = -1;
  if(to_remove == false){
    confirm_time = selected_symbols[url]["confirm_time"]; 
  }
  // graph
  console.log("UPDATE SAVE SYMBOLS")
  console.log(data)
  console.log('hi')
  $.ajax({
    type: "POST",
    url: "save_symbols",
    contentType: "application/json; charset=utf-8",
    data : JSON.stringify({"username":username,"concept":concept,"url":url,"term":term,"to_remove":to_remove, "step_one": on_step_one, "confirm_time": confirm_time}),
    success: function(data, text){
      console.log('success')
      // add_concept_button(entered_concept);
    },
    error: function(request, status, error){
      console.log("Error");
        console.log(request)
        console.log(status)
        console.log(error)
    }
  });

}


function post(path, params, method='post') {

  // The rest of this code assumes you are not using a library.
  // It can be made less wordy if you use one.
  const form = document.createElement('form');
  form.method = method;
  form.action = path;

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = key;
      hiddenField.value = JSON.stringify(params[key]);

      form.appendChild(hiddenField);
    }
  }

  document.body.appendChild(form);
  form.submit();
}


analyze_symbols = function (){
  var c_dict_cp = concept_dict
  for(word in c_dict_cp){
    delete c_dict_cp[word].related_words;
  }

  var node_data = nodes["_data"];
  var edges_data = nodes["_data"];
  var network_data = {"nodes":node_data,"edges":edges_data};

  console.log(network_data);
  post("/symbol_results/" + String(concept), {"concept":concept, "concept_dict":concept_dict, "concept_graph": network_data});
}


close_table = function(table_id,see_more_button_id,close_btn){
  console.log("closing table! ")
  var image_table = document.getElementById(table_id);
  console.log(image_table)
  for(var i = 0; i < image_table.rows.length; i++){
    // console.log(image_table.rows[i])
    var cell = image_table.rows[i].cells[0];
    console.log(cell)
    if(i > 0){
      if(cell != undefined){
        cell.style.display = "none";
      }
    }
    console.log(cell)
    console.log("\n")
  }
  close_btn.style.display = "none";
  var see_more_btn = document.getElementById(see_more_button_id)
  see_more_btn.style.display = "block";
}

create_image_sidebar2 = function(url_obj,term,tree_node_key){
  image_sb = document.getElementById('r_sidenav')
  image_sb.innerHTML = '';

  sb_title = document.createElement('p');
  sb_title.innerHTML = 'images for: <b>' + term + '</b>'
  sb_title.setAttribute('class','sidebar_title')
  image_sb.appendChild(sb_title);

  for(search_term in url_obj){
    var urls = url_obj[search_term];
    console.log(search_term);

    var image_table_div = document.createElement("div");
    image_table_div.setAttribute("class","image_table_div")

    var image_table_padding_div = document.createElement("div");
    image_table_padding_div.setAttribute("class","image_table_padding_div");


    var search_term = search_term.replace(" ","_");
    image_table = document.createElement('table');
    var image_table_id = search_term + "_table";
    image_table.setAttribute("id", image_table_id);
    row_num = 0;
    col_num = 1; 
    var row = image_table.insertRow(row_num)
    cell_num = 0;
    for(var i = 0; i < urls.length; i++){
      var url = urls[i];
      cell = row.insertCell(-1);
      image = document.createElement('img');
      image.setAttribute('src',url);
      cell_id = search_term + '_' +String(i);
      image.setAttribute('id',cell_id)
      image.setAttribute('class','table_image');
      image.setAttribute('onclick', 'select_image(\"'+url+'\",\"'+term+'\",\"'+cell_id+'\",\"'+tree_node_key+'\")');

      if(url in selected_symbols){
        image.classList.add('selected');
      }
      var label_text_node = document.createTextNode(search_term);
      

      cell.appendChild(label_text_node);
      cell.appendChild(image);
      if(i > 0){
        cell.style.display = "none";
      }


      if((i+1)%col_num == 0){
        row_num++;
        row = image_table.insertRow(row_num)
      }

    }

    var close_btn_id = "close_btn_" + search_term;
    var see_more_btn_id = "see_more_btn_" + search_term;


    console.log("CLOSE BTN CREATED")
    console.log(image_table_id);
    var close_btn = document.createElement('a');
    close_btn.innerHTML = "close";
    close_btn.setAttribute("id",close_btn_id);
    close_btn.setAttribute('onclick', "close_table(\""+image_table_id+"\",\""+see_more_btn_id+"\",this)"); 
    close_btn.setAttribute("href","#");
    close_btn.style.display = "none";

    var see_more_btn = document.createElement('a');
    see_more_btn.innerHTML = "see more";
    see_more_btn.setAttribute('onclick', "see_more(\""+image_table_id+"\",\""+close_btn_id+"\",this)"); 
    see_more_btn.setAttribute("href","#");

    image_table_div.appendChild(image_table);
    image_table_div.appendChild(see_more_btn);
    image_table_div.appendChild(close_btn);

    image_table_padding_div.append(image_table_div);

    image_sb.appendChild(image_table_padding_div);
  }
}


function toggle_active(button_id){
  if($("#" + String(button_id)).hasClass("active")){
    $("#" + String(button_id)).removeClass("active");
  }
  else{
    $("#" + String(button_id)).addClass("active");
  }
}


function toggle_sidebar_category_show(dropdown_content_id){
  console.log(dropdown_content_id);
  var x = document.getElementById(dropdown_content_id);
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}


function add_path_of_nodes(node){

  console.log("in add_path_of_nodes")
  console.log(node)
  var key_path = node.getKeyPath();
  var title_path = node.getPath();

  console.log(title_path)
  console.log("KEY PATH:")
  console.log(key_path);
  title_path = title_path.split('/');
  key_path = key_path.split('/');
  console.log(title_path)
  title_path.unshift(concept);
  for(var i = 0; i < title_path.length - 1; i++){
    var parent = title_path[i];
    var child = title_path[i+1];
    var child_id = key_path[i+1];
    addNode(parent,child,child_id);
  }
}

function close_all(){
  var tree = $("#tree").fancytree("getTree");
  tree.expandAll(false);
}


function add_child(){
  console.log("clicky")
}

function update_progress_info(){
  var ce_info = document.getElementById("clusters_explored_info");

  var concept_dict_entry = concept_dict[concept];
  // var tree_view_json = concept_dict_entry["tree_view_json"];
  var cluster_num = tree_view_json.length;
  ce_info.innerHTML = String(clusters_explored.length) + " of " + String(cluster_num) + " clusters explored.";

  var sic_info = document.getElementById("symbol_image_count_info");
  var num_of_symbols = Object.keys(selected_symbols).length;
  sic_info.innerHTML = String(num_of_symbols) + " of ideally 25 symbols found."

  console.log("SELECTED SYMBOLS")
  console.log(selected_symbols)

}

function add_custom_node(node){
  if(event.key === 'Enter') {
      var node_key = node.getAttribute("nkey");
      var val = node.value;
      node.value = '';
      // if not empty, add node to treeview
      if(val){
        var tree = $("#tree").fancytree("getTree");
        var node = tree.getNodeByKey(node_key);
        var new_child_node = {"title": val, "icon": false, "checkbox": false, "is_add_your_own": false, "expanded_once": false, "is_cluster": false}

        var children = node.getChildren();
        var second_child = children[1];

        var new_node = node.addChildren(new_child_node,second_child.key); 
        console.log("NEW NODE")
        console.log(new_node)

        if(val in concept_dict){
          var regular_swow_words = concept_dict[val]["comb_words"];
          var max_nodes = 5;
          var added_nodes_cnt = 0;
          for(var j = 0; j < regular_swow_words.length; j++){
              if(added_nodes_cnt == max_nodes){
                break;
              }
              var swow_word = regular_swow_words[j];
              var n_node = {"title": swow_word, "icon": false, "is_cluster": false, "expanded_once": false, "checkbox": false};
              var c_new_node = new_node.addNode(n_node);
              var children_swow_words = concept_dict[swow_word]["comb_words"];
              var max_g_nodes = 5;
              var g_nodes_added = 0;
              for(var i = 0; i < children_swow_words.length; i++){
                if(max_g_nodes == g_nodes_added) {break;}
                var c_swow_word = children_swow_words[i];
                var g_c_n_node = {"title": c_swow_word, "icon": false, "is_cluster": false, "expanded_once": false, "checkbox": false};
                c_new_node.addNode(g_c_n_node);
                g_nodes_added++;
              }
              added_nodes_cnt++;
          }

        }

        multi_google_search(val,node.title,true,new_node.key);

      }
    }
}

/*
function confirm_image(term,url,image_id){
  console.log('confirm image')
  console.log(term);
  console.log(url);
  var to_remove = false;

  var img = document.getElementById(image_id);
  // toggle confirmed state of image
  if (img.classList.contains("confirmed")) {
    img.classList.remove("confirmed");
  } else { img.classList.add("confirmed"); } 

  if(url in selected_symbols){
    // delete_elem_from_table(url,term,image_id);
    to_remove = true;
    delete selected_symbols[url]
    updateProgress();
    // updateNodes();
  }
  // else add it
  else{
    // add_elem_to_symbol_table(url,term,image_id);
    selected_symbols[url] = term
    updateProgress();
    // updateNodes();
  }
  // update_progress_info();
  update_saved_symbols(url,term,to_remove);
}*/

function confirm_image2(concept,term,url,image_id){


  confirm_time = performance.now();

  console.log('confirm image')
  console.log(term);
  console.log(url);
  var to_remove = false;


  console.log("SELECTED_SYMBOLS:")
  console.log(selected_symbols)

  var img = document.getElementById(image_id);
  // toggle confirmed state of image
  if (img.classList.contains("confirmed")) {
    img.classList.remove("confirmed");
  } else { img.classList.add("confirmed"); } 

  if(url in selected_symbols){
    // delete_elem_from_table(url,term,image_id);
    to_remove = true;
    delete selected_symbols[url];
    updateProgress();
    // updateNodes();
  }
  // else add it
  else{
    // add_elem_to_symbol_table(url,term,image_id);
    // selected_symbols[url] = term
    selected_symbols[url] = {};
    selected_symbols[url]["google_search_term"] = term;
    selected_symbols[url]["concept"] = concept;
    selected_symbols[url]["confirm_time"] = confirm_time - start_time;
    updateProgress();
    // updateNodes();
  }

  if(showing_selected_symbols){
    create_selected_symbol_table();
  }
  // update_progress_info();
  update_saved_symbols(url,term,to_remove);
}

/*create_image_grid = function(term,urls){
  console.log(term)
  // var urls = ["https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg"]
  image_table = document.createElement('table');
  row_num = 0;
  col_num = 5; 
  var row = image_table.insertRow(row_num)
  row.style.display = "block";
  cell_num = 0;
  for(var i = 0; i < urls.length; i++){
    var url = urls[i];
    image_and_button_div = document.createElement("div");
    cell = row.insertCell(-1);
    image = document.createElement('img');
    image.setAttribute('src',url);
    cell_id = term + '_' +String(i)
    image.setAttribute('id',cell_id)
    image.setAttribute('class','img_in_table');
    image.setAttribute('onclick','confirm_image(\"'+term+'\",\"'+url+'\",\"'+cell_id+'\")')
    image_and_button_div.appendChild(image);
    cell.appendChild(image_and_button_div);

    if((i+1)%col_num == 0 && row_num < 2){
      row_num++;
      row = image_table.insertRow(row_num);
      row.setAttribute("id",String(term) + "_row_2");
      row.style.display = "none";
      // console.log("ROW")
      // console.log(row)
    }
  }
  return image_table;
}*/

create_cluster_image_grid = function(term,urls,url_to_gs_dict){
  console.log(term)
  // var urls = ["https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg"]
  image_table = document.createElement('table');
  row_num = 0;
  col_num = 5; 
  var row = image_table.insertRow(row_num)
  row.style.display = "block";
  cell_num = 0;
  for(var i = 0; i < urls.length; i++){
    var url = urls[i];
    image_and_button_div = document.createElement("div");
    cell = row.insertCell(-1);
    image = document.createElement('img');
    image.setAttribute('src',url);
    cell_id = term + '_' +String(i)
    image.setAttribute('id',cell_id)
    image.setAttribute('class','img_in_table');
    var concept = url_to_gs_dict[url];
    image.setAttribute('onclick','confirm_image2(\"'+concept+'\",\"'+term+'\",\"'+url+'\",\"'+cell_id+'\")');
    image_and_button_div.appendChild(image);
    cell.appendChild(image_and_button_div);

    if((i+1)%col_num == 0 && row_num < 2){
      row_num++;
      row = image_table.insertRow(row_num);
      row.setAttribute("id",String(term) + "_row_2");
      row.style.display = "none";
      // console.log("ROW")
      // console.log(row)
    }
  }
  return image_table;
}

create_image_grid2 = function(term,urls,concept){
  console.log(term)
  // var urls = ["https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg", "https://images-na.ssl-images-amazon.com/images/I/61YL-c2pZOL._AC_SX355_.jpg"]
  image_table = document.createElement('table');
  row_num = 0;
  col_num = 5; 
  var row = image_table.insertRow(row_num)
  row.style.display = "block";
  cell_num = 0;
  for(var i = 0; i < urls.length; i++){
    var url = urls[i];
    image_and_button_div = document.createElement("div");
    cell = row.insertCell(-1);
    image = document.createElement('img');
    image.setAttribute('src',url);
    cell_id = term + '_' +String(i)
    image.setAttribute('id',cell_id)
    image.setAttribute('class','img_in_table');
    image.setAttribute('onclick','confirm_image2(\"'+concept+'\",\"'+term+'\",\"'+url+'\",\"'+cell_id+'\")');
    image_and_button_div.appendChild(image);
    cell.appendChild(image_and_button_div);

    if((i+1)%col_num == 0 && row_num < 2){
      row_num++;
      row = image_table.insertRow(row_num);
      row.setAttribute("id",String(term) + "_row_2");
      row.style.display = "none";
      // console.log("ROW")
      // console.log(row)
    }
  }
  return image_table;
}


add_cluster = function(cluster_title,yes_btn){
  // console.log("adding cluster!");
  if(yes_btn.classList.contains("yes_active")){
    console.log("removing cluster!");
      yes_btn.classList.remove("yes_active");
      delete chosen_clusters.cluster_title;
  }
  else{
    console.log("adding cluster!");
    chosen_clusters[cluster_title] = true;
    yes_btn.classList.add("yes_active");
  }
}

/*yes_no_button = function(cluster_title,yn_button,button_type,other_button_id){
  var button_class = yn_button.getAttribute("class");

  if(button_type == "yes"){

    var no_button = document.getElementById(other_button_id);
    console.log("yes_button");
    if(yn_button.classList.contains("yes_active")){
      yn_button.classList.remove("yes_active") 
    }
    else{
      if(no_button.classList.contains("no_active")){
        no_button.classList.remove("no_active");
      }
      yn_button.classList.add("yes_active");
    }
  }
  if(button_type == "no"){
    var yes_button = document.getElementById(other_button_id);
    console.log("no button");
    if(yn_button.classList.contains("no_active")){
      yn_button.classList.remove("no_active") 
    }
    else{
      if(yes_button.classList.contains("yes_active")){
        yes_button.classList.remove("yes_active");
      }
      yn_button.classList.add("no_active");
    }
  }
}*/

function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

explore = function(){
  var symbol_bank = document.getElementById("symbol_bank")
  symbol_bank.style.display="block";
  fill_treeview_sidebar(concept,tree_view_json);
  topFunction();
  populate_second_step_instructions();
  var image_grids_div = document.getElementById("image_grids");
  image_grids_div.innerHTML = "";
  on_step_one = false;
}

toggle_show_second_row = function(row_id,but){
  var x = document.getElementById(row_id);
  if (x.style.display === "none") {
    x.style.display = "block";
    but.innerHTML = "show less";
  } else {
    x.style.display = "none";
    but.innerHTML = "show more";
  }

}

fill_grids_for_concept = function(url_obj,concept){
  var image_grids_div = document.getElementById("image_grids");
  image_grids_div.innerHTML = "";

  for(search_term in url_obj){
    var urls = url_obj[search_term];

    var term_image_grid = document.createElement("div");
    var term_image_grid_id = search_term + "_img_block";
    term_image_grid.setAttribute("class","term_image_grid");
    term_image_grid.setAttribute("id",term_image_grid_id);

    var headline_div = document.createElement("div");
    headline_div.setAttribute("class","headline");

    var term_headline = document.createElement("h4"); 
    term_headline.setAttribute("class","img_table_title");
    term_headline.innerHTML = "<b>" + String(search_term) + "</b> "
    
    headline_div.appendChild(term_headline);
    
    term_image_grid.appendChild(headline_div);

    var padding_div = document.createElement("div");
    padding_div.setAttribute("class","padding_div");

    image_table = create_image_grid2(search_term,urls,concept);

    var show_second_row_button = document.createElement("button");
    show_second_row_button.setAttribute("onclick","toggle_show_second_row(\""+search_term+"_row_2\",this)");
    show_second_row_button.setAttribute("class","show_second_row_button");
    show_second_row_button.innerHTML = "show more";

    term_image_grid.appendChild(image_table);
    term_image_grid.appendChild(show_second_row_button);
    padding_div.appendChild(term_image_grid);
    image_grids_div.appendChild(padding_div);
  }

  var myDiv = document.getElementById('image_grids');
  myDiv.scrollTop = 0;
}

fill_grids_for_cluster_concept = function(url_obj,concept,order){
  console.log(concept)
  console.log(url_obj)
  var image_grids_div = document.getElementById("image_grids");
  image_grids_div.innerHTML = "";

  for(var i = 0; i < order.length; i++){
  // for(search_term in url_obj){

    var search_term = order[i].search_term;
    var concept = order[i].concept;
    var urls = url_obj[search_term];

    var term_image_grid = document.createElement("div");
    var term_image_grid_id = search_term + "_img_block";
    term_image_grid.setAttribute("class","term_image_grid");
    term_image_grid.setAttribute("id",term_image_grid_id);

    var headline_div = document.createElement("div");
    headline_div.setAttribute("class","headline");

    var term_headline = document.createElement("h4"); 
    term_headline.setAttribute("class","img_table_title");
    term_headline.innerHTML = "<b>" + String(search_term) + "</b> "
    
    headline_div.appendChild(term_headline);
    
    term_image_grid.appendChild(headline_div);

    var padding_div = document.createElement("div");
    padding_div.setAttribute("class","padding_div");

    image_table = create_image_grid2(search_term,urls,concept);
    var show_second_row_button = document.createElement("button");
    show_second_row_button.setAttribute("onclick","toggle_show_second_row(\""+search_term+"_row_2\",this)");
    show_second_row_button.setAttribute("class","show_second_row_button");
    show_second_row_button.innerHTML = "show more";

    term_image_grid.appendChild(image_table);
    term_image_grid.appendChild(show_second_row_button);
    padding_div.appendChild(term_image_grid);
    image_grids_div.appendChild(padding_div);
  }

  var myDiv = document.getElementById('image_grids');
  myDiv.scrollTop = 0;
}

fill_cluster_image_grids = function(clusters){
  var image_grids_div = document.getElementById("image_grids");
  for(var i = 0; i < clusters.length; i++){
    var cluster_title = clusters[i];

    var cluster_div = document.createElement("div");
    cluster_div.setAttribute("class","cluster_div");


    var within_cluster_div = document.createElement("div");
    within_cluster_div.setAttribute("class","within_cluster_div");

    word_instruction_div = document.createElement("div");
    word_question_span = document.createElement("span");
    word_question_span.setAttribute("class","question_span");
    word_question_span.innerHTML = "Could symbols of: <b>" + String(cluster_title)  + "</b> represent <b> " + concept + "</b>?";

    yes_button_id = "yes_ " + cluster_title;
    var yes_button = document.createElement("button");
    yes_button.setAttribute("class","yes_button");
    yes_button.setAttribute("id",yes_button_id)
    yes_button.setAttribute("onclick","add_cluster(\""+cluster_title+"\",this)");
    yes_button.innerHTML = "yes";

    word_instruction_div.appendChild(word_question_span);
    word_instruction_div.appendChild(yes_button);

    var image_instruction_and_grid_div = document.createElement("div");
    image_instruction_and_grid_div.setAttribute("class","image_instruction_div");
    image_instruction_span = document.createElement("span");
    image_instruction_span.innerHTML = "Select any images below that you think is a good symbol for " + concept + ".";

    var urls = concept_dict[cluster_title].urls[cluster_title];
    var url_to_gs_dict = concept_dict[cluster_title].url_to_gsterm;
    console.log("url_to_gs_dict")
    console.log(url_to_gs_dict);
    // image_table = create_image_grid(cluster_title,urls);
    var image_table = create_cluster_image_grid(cluster_title,urls,url_to_gs_dict);

    image_instruction_and_grid_div.appendChild(image_instruction_span);
    image_instruction_and_grid_div.appendChild(image_table);


    within_cluster_div.appendChild(word_instruction_div);
    within_cluster_div.appendChild(image_instruction_and_grid_div);
    cluster_div.appendChild(within_cluster_div);
    // cluster_div.appendChild(word_instruction_div);
    // cluster_div.appendChild(image_instruction_and_grid_div);
    image_grids_div.appendChild(cluster_div);




    /*
    var term_image_grid = document.createElement("div");
    var term_image_grid_id = concept + "_img_block";
    term_image_grid.setAttribute("class","term_image_grid");
    term_image_grid.setAttribute("id",term_image_grid_id);

    var headline_div = document.createElement("div");
    headline_div.setAttribute("class","headline");

    var term_headline = document.createElement("h4"); 
    term_headline.setAttribute("class","img_table_title");
    term_headline.innerHTML = "<b>" + String(cluster_title) + "</b> "
    
    headline_div.appendChild(term_headline);
    
    term_image_grid.appendChild(headline_div);

    var padding_div = document.createElement("div");
    padding_div.setAttribute("class","padding_div");

    console.log(concept_dict)
    console.log(concept_dict[cluster_title])

    var urls = concept_dict[cluster_title].urls[cluster_title];

    image_table = create_image_grid(cluster_title,urls);

    var question_div = document.createElement("div");
    question_div.setAttribute("class","question_div");

    var question_span = document.createElement("span");
    question_span.innerHTML = "Would you like to explore more images and related words for this cluster?"

    no_button_id = "no_" + cluster_title;
    yes_button_id = "yes_ " + cluster_title;

    var yes_button = document.createElement("button");
    yes_button.setAttribute("class","yes_button");
    yes_button.setAttribute("id",yes_button_id)
    yes_button.setAttribute("onclick","yes_no_button(\""+cluster_title+"\",this,\"yes\",\""+no_button_id+"\")");
    yes_button.innerHTML = "yes";*/

    /*
    var no_button = document.createElement("button");
    no_button.setAttribute("class","no_button");
    no_button.setAttribute("id",no_button_id);
    no_button.setAttribute("onclick","yes_no_button(\""+cluster_title+"\",this,\"no\",\""+yes_button_id+"\")");
    no_button.innerHTML = "no";
    question_div.appendChild(question_span);
    question_div.appendChild(yes_button);
    question_div.appendChild(no_button);


    term_image_grid.appendChild(image_table);
    term_image_grid.appendChild(question_div);
    padding_div.appendChild(term_image_grid);
    image_grids_div.appendChild(padding_div);*/
  }

  var explore_button = document.createElement("button");
  explore_button.setAttribute("id","explore_button");
  explore_button.innerHTML = "Explore selected clusters"
  explore_button.setAttribute("class","explore_btn");
  explore_button.setAttribute("onclick","explore()");
  image_grids_div.appendChild(explore_button);


  start_time = performance.now();
}


function see_more_tree(){
  console.log("see more!")


}

function fill_treeview_sidebar(node_name,tree_view_json){

  var sb = document.getElementById('sidebar');
  sb.innerHTML = '';
  $("#sidebar").animate({scrollTop: 0},2000);
  var cluster_num = tree_view_json.length;
  

  // ========================OVERVIEW SECTION of sidebar ===========================

  var overview_div = document.createElement("div");
  overview_div.setAttribute("class", "overview_body");

  var overview_panel_div = document.createElement("div");
  overview_panel_div.setAttribute("class", "overview_panel");

  overview_div.appendChild(overview_panel_div);

  var newlink = document.createElement('p');
  newlink.innerHTML = '<h3>' + node_name + '</h3>'
  newlink.setAttribute('class','sidebar_title')


  var info_div = document.createElement("div");
  info_div.setAttribute("class", "info_list");
  var info_list = document.createElement("ul");
  info_list.setAttribute("id","progress_info");
  var cluster_explore_info = document.createElement("li");
  cluster_explore_info.setAttribute("id","clusters_explored_info");
  cluster_explore_info.innerHTML = String(clusters_explored.length) + " of " + String(cluster_num) + " clusters explored.";
  info_list.appendChild(cluster_explore_info);
  
  var symbol_image_count_info = document.createElement("li");
  symbol_image_count_info.setAttribute("id","symbol_image_count_info");
  var num_of_symbols = Object.keys(selected_symbols).length;
  symbol_image_count_info.innerHTML = String(num_of_symbols) + " of ideally 25 symbols found."
  info_list.appendChild(symbol_image_count_info);


  info_div.appendChild(info_list);


  // close all clusters button
  var close_all_button = document.createElement("a");
  close_all_button.innerHTML = "close all";
  close_all_button.setAttribute("onclick","close_all()");
  close_all_button.setAttribute("href","#");
  close_all_button.setAttribute("id","close_all");

  overview_panel_div.appendChild(newlink);
  overview_panel_div.appendChild(info_div);
  overview_panel_div.appendChild(close_all_button);
  

  overview_div.appendChild(overview_panel_div);
  sb.appendChild(overview_div);

  console.log("TREE VIEW JSON")
  console.log(tree_view_json)

  new_tree_view_json = [];
  for(var i = 0; i < tree_view_json.length; i++)
  {
    var cluster_title = tree_view_json[i].title;
    if(chosen_clusters.hasOwnProperty(cluster_title)){
      new_tree_view_json.push(tree_view_json[i]);
    }
  }

  tree_view_json = new_tree_view_json;

  

  // ===============================================================================

  console.log("tree_view_json")
  console.log(tree_view_json)

  var treeview = document.createElement("div");
  treeview.setAttribute("id","tree");
  treeview.setAttribute("class","panel-body fancytree-colorize-hover fancytree-fade-expander");

   var glyph_opts = {
      preset: "bootstrap3",
      map: {}
   };

  sb.appendChild(treeview);


  $("#tree").fancytree({
      extensions: ["glyph"],
      checkbox: false,
      keyboard: false,
      selectMode: 2,
      generateIds: true,
      glyph: glyph_opts,
      source: tree_view_json,
      expand: function (event, data){
          
          console.log('expand event!')
          var node = data.node;
          var children_list = node.children; 
          console.log(node)
          console.log(node.expanded)
          if(node.data.expanded_once == false) {


            // unbold cluster title, since expanded!
            if(node.data.is_cluster){
              node.addClass("explored");
              clusters_explored.push(node.title);
              update_progress_info();
            }


            var path = data["node"].getPath()
            var path_split = path.split("/")

            if(path_split.length < 2){

              for(var i = 0; i < children_list.length; i++){
                  var child_node = children_list[i];
                  var node_title = child_node.title; 
                  // var regular_swow_words = concept_dict[node_title]["master_words"];
                  var regular_swow_words = concept_dict[node_title]["comb_words"];
                  var max_nodes = 5;
                  for(var j = 0; j < regular_swow_words.length; j++){
                    if(j >= max_nodes){
                      break;
                    }
                    var swow_word = regular_swow_words[j];
                    var new_node = {title: swow_word, icon: false, is_cluster: false, expanded_once: false};
                    child_node.addNode(new_node);
                  }
                }
            }


            /*
            if(data.node.data.is_clister){
              for(var i = 0; i < children_list.length; i++){
                var child_node = children_list[i];
                var node_title = child_node.title; 
                // var regular_swow_words = concept_dict[node_title]["master_words"];
                var regular_swow_words = concept_dict[node_title]["comb_words"];
                for(var j = 0; j < regular_swow_words.length; j++){
                  var swow_word = regular_swow_words[j];
                  var new_node = {title: swow_word, icon: false, is_cluster: false, expanded_once: false};
                  child_node.addNode(new_node)
                }
              }
            }
            else{
              for(var i = 0; i < children_list.length; i++){
                var child_node = children_list[i];
                var node_title = child_node.title; 
                // var regular_swow_words = concept_dict[node_title]["master_words"];
                var regular_swow_words = concept_dict[node_title]["comb_words"];
                var max_nodes = 5;
                for(var j = 0; j < regular_swow_words.length; j++){
                  if(j >= max_nodes){
                    break;
                  }
                  var swow_word = regular_swow_words[j];
                  var new_node = {title: swow_word, icon: false, is_cluster: false, expanded_once: false};
                  child_node.addNode(new_node);
                }
              }
            }*/

            // var text_area = "<input type=\"text\" placeholder=\"write your own!\" onkeydown=\"add_custom_node(\""+String(node.data.key)+"\",this)\">"
            

            var text_area = '<input type=\"text\" placeholder=\"write your own!\" class=\"inp\" nkey=\"'+String(node.key)+'\"onkeydown=\"add_custom_node(this)\">'
            var write_your_own_node = {"title": text_area, "icon": "glyphicon glyphicon-pencil", "checkbox": false, "is_add_your_own": true, "unselectable": true}
            node.addNode(write_your_own_node,"firstChild"); 


            /*
            if(node.data.is_cluster != true){
              // var btn_text_area = '<a onclick="see_more_tree()" class="see_more_tree" href="#" id="see_more_'+String(data.node.title)+'">see more</a>';

              var swow_words_for_node = concept_dict[node.title]["comb_words"];
              if(node.children.length < swow_words_for_node.length){
                var btn_text_area = '<button class="see_more_tree_btn" id="see_more_'+String(data.node.title)+'">see more</button>';
                var see_more_btn = {"title": btn_text_area, "icon": "glyphicon glyphicon-plus", "checkbox": false, "is_add_your_own": false, "is_cluster": false, "is_see_more": true};
                node.addNode(see_more_btn,"child");
              }
            }*/

            var swow_words_for_node = concept_dict[node.title]["comb_words"];
            console.log(node.title)
            console.log(concept_dict[node.title])
              if(node.children.length < swow_words_for_node.length){
                var btn_text_area = '<button class="see_more_tree_btn" id="see_more_'+String(data.node.title)+'">see more</button>';
                var see_more_btn = {"title": btn_text_area, "icon": "glyphicon glyphicon-plus", "checkbox": false, "is_add_your_own": false, "is_cluster": false, "is_see_more": true};
                node.addNode(see_more_btn,"child");
              }
            
            node.data.expanded_once = true;
          }
      },
      click: function(event, data){
        console.log(event)
        console.log(data)
        var node = data.node;
        var node_title = data["node"]["title"];
        var node_data = data.node.data

        var target = data.targetType;

        if(target == "expander"){
          if(data.node.isExpanded() == false){
            if(data.node.data.is_cluster){
              cluster_google_search(node_title);
              var other_clusters = node.getParent().children;
              for(var i = 0; i < other_clusters.length; i++){
                var oc = other_clusters[i];
                console.log(oc.title);
                console.log(node.title);
                if(oc.title != node.title){
                  oc.setExpanded(false);
                }
              }
            }
            else{
              var this_node_title = data.node.title;
              var parent_title = data.node.parent.title;
              // check if parent is cluster:
              if(data.node.parent.data.is_cluster){
                var split_parent = parent_title.split(",");
                parent_title = split_parent[0];
              }

              multi_google_search(this_node_title,parent_title,true,data.node.key); 
            }
          }
        }
        if(target == "title"){

          if(data.node.data.is_cluster)
          {
            cluster_google_search(node_title);
            if(data.node.isExpanded() == false){
              var other_clusters = node.getParent().children;
                for(var i = 0; i < other_clusters.length; i++){
                  var oc = other_clusters[i];
                  console.log(oc.title);
                  console.log(node.title);
                  if(oc.title != node.title){
                    oc.setExpanded(false);
                  }
                }
            }
          }
          else
          {

            var this_node_title = data.node.title;
            var parent_title = data.node.parent.title;

            // check if parent is cluster:
            if(data.node.parent.data.is_cluster){
              var split_parent = parent_title.split(",");
              parent_title = split_parent[0];
            }

            var key_path = data["node"].getKeyPath();
            var title_path = data["node"].getPath();
            multi_google_search(this_node_title,parent_title,true,data.node.key); 
          }







          // multi_google_search

          // ==================================================================================================================
          // ==================================================================================================================
          // SEE MORE BUTTON ON FANCY TREE CLICKED
          // ==================================================================================================================
          // ==================================================================================================================
          if(data.node.data.is_see_more){

            var path = data["node"].getPath()
            var path_split = path.split("/")

            var parent = data.node.getParent();
            console.log("PARENT")
            console.log(parent)
            console.log(parent.title)
            
            var node = data.node;
            var children_list = parent.children; 
            var regular_swow_words = concept_dict[parent.title]["comb_words"];

            if(children_list.length < regular_swow_words.length){

              var i = children_list.length - 1;
              var nodes_added = 0;
              var new_node_num = 10;
              while(i < regular_swow_words.length && nodes_added < new_node_num){
                console.log("i: " + String(i));
                console.log(regular_swow_words.length)
                console.log("nodes_added: " + String(nodes_added))
                console.log("new_node_num: " + String(new_node_num))
                var swow_word = regular_swow_words[i];
                var new_node = {title: swow_word, icon: false, is_cluster: false, expanded_once: false};
                new_child = node.addNode(new_node,"before");
                i++;
                nodes_added++;
                // make grand children
                var j = 0;
                var gc_swow_words = concept_dict[swow_word]["comb_words"];
                console.log("PATH_SPLIT LENGTH: " + String(path_split.length))
                if(path_split.length < 4){
                  while(j < gc_swow_words.length && j < 5){
                    gc_swow_word = gc_swow_words[j];
                    var new_gc_node = {title: gc_swow_word, icon: false, is_cluster: false, expanded_once: false};
                    new_child.addNode(new_gc_node);
                    j++;
                  }
                }
              }
            }

          }
          // ==================================================================================================================
          // ==================================================================================================================


          if(data.node.data.is_add_your_own != true){

              if(data.node.isExpanded()){
                data.node.setExpanded(false); 
              }
              else{
                data.node.setExpanded(true); 
              }

            if(data.node.isExpanded()){
              if(data.node.data.is_cluster)
              {
                cluster_google_search(node_title);
              }
              else
              {

                var this_node_title = data.node.title;
                var parent_title = data.node.parent.title;

                // check if parent is cluster:
                if(data.node.parent.data.is_cluster){
                  var split_parent = parent_title.split(",");
                  parent_title = split_parent[0];
                }

                var key_path = data["node"].getKeyPath();
                var title_path = data["node"].getPath();
                multi_google_search(this_node_title,parent_title,true,data.node.key); 
              }
            }

          }
        }

      }
  });

}


function get_color(value){
  value = value / 100;
  value = (value - 0.2) / (1.0 - 0.2)
  var aR = 0; var aG = 0; var aB = 255;
  var bR = 255; var bG = 0; var bB = 0;
  var red = (bR - aR) * value + aR; 
  var green = (bG - aG) * value + aG;
  var blue = (bB - aB) * value + aB;
  return "rgb("+red+","+blue+","+green+")";
}

/*
function show_found_symbols(){
  console.log('time to show those symbols!')
  var urls = Object.keys(selected_symbols);
  create_symbol_sidebar(urls,concept_searched)
  viewing_symbols = true;
}*/

function create_selected_symbol_table(){
  var cst_div = document.getElementById("chosen_symbol_table_div");
  cst_div.innerHTML = "";
  var symbol_entries = Object.entries(selected_symbols);
  concept_to_url_dict = {};

  for(var i = 0; i < symbol_entries.length; i++){
    var symbol_entry = symbol_entries[i];
    var url = symbol_entry[0];
    var concept = symbol_entry[1]["concept"];
    if(concept in concept_to_url_dict){
      var url_list = concept_to_url_dict[concept]
      console.log(url_list);
      url_list.push(url);
      concept_to_url_dict[concept] = url_list;
    }
    else{
      concept_to_url_dict[concept] = [url];
    }
  }

  image_table = document.createElement('table');
  row_num = 0;
  col_num = 5; 
  var row = image_table.insertRow(row_num);
  row.style.display = "block";
  cell_num = 0;
  var concept_to_url_entries = Object.entries(concept_to_url_dict);
  console.log("CONCEPT TO URL ENTRIES")
  console.log(concept_to_url_entries)
  for(var i = 0; i < concept_to_url_entries.length; i++){
    var concept_to_url_entry = concept_to_url_entries[i];
    var concept = concept_to_url_entry[0];
    var urls = concept_to_url_entry[1];
    console.log("concept: " + String(concept));
    console.log("urls: " + String(urls));

    var cell = row.insertCell(-1);
    cell.innerHTML = concept;

    for(var j = 0; j < urls.length; j++){
      var url = urls[j];
      image_and_button_div = document.createElement("div");
      cell = row.insertCell(-1);
      image = document.createElement('img');
      image.setAttribute('src',url);
      cell_id = concept + '_' +String(j)
      image.setAttribute('id',cell_id)
      image.setAttribute('class','img_in_table');
      cell.appendChild(image);
    }

    row_num++;
    row = image_table.insertRow(row_num);
    row.style.display = "block";
  }
  console.log("done.")
  cst_div.appendChild(image_table);
}


/*
function add_elem_to_symbol_table(url,term,image_id){
  var symbol_found_table = document.getElementById("symbol_bank_table");

  var sym_table_size = $('#symbol_bank_table tbody tr').length;
  var row = 0;
  if(sym_table_size == 0){
    console.log("table_size == 0")
    row = symbol_found_table.insertRow(0);
  }
  else{
    row = symbol_found_table.rows[0];
  }
  var cell = row.insertCell(-1);
  var image_caption_div = document.createElement('div');
  image_caption_div.setAttribute('class','symbol_image_div');
  var image = document.createElement('img');
  image.setAttribute('src',url);
  cell.setAttribute("img_id",image_id);
  image.setAttribute('id',cell_id)
  image.setAttribute('class','symbol_image')
  var label_text_node = document.createTextNode(term);
  image_caption_div.appendChild(label_text_node);
  linebreak = document.createElement("br");
  image_caption_div.appendChild(linebreak);
  image_caption_div.appendChild(image);
  cell.append(image_caption_div);
}


function delete_elem_from_table(url, term, image_id){
  var symbol_found_table = document.getElementById("symbol_bank_table");
  var row = symbol_found_table.rows[0];
  for(var i = 0; i < row.children.length; i++){
    var c = row.children[i];
    var c_img_id = c.getAttribute("img_id")
    console.log("HEHEHEHE")
    console.log(c)
    console.log(c_img_id)
    console.log(image_id)
    if(c_img_id == image_id){
      row.deleteCell(i);
    }
  }

}*/

function compare(a, b) {
  // Use toUpperCase() to ignore character casing
  const countA = a.count;
  const countB = b.count;

  let comparison = 0;
  if (countA > countB) {
    comparison = -1;
  } else if (countA < countB) {
    comparison = 1;
  }
  return comparison;
}

function get_sorted_object_count(concept_counts_dict){
  var concept_count_list = [];
  for (var concept in concept_counts_dict) {
    if (concept_counts_dict.hasOwnProperty(concept)) {
      var concept_entry = concept_counts_dict[concept]
      var c_new_entry = {};
      c_new_entry.concept = concept;
      c_new_entry.urls = concept_entry.urls;
      c_new_entry.count = concept_entry.count;
      concept_count_list.push(c_new_entry);
    }
  }

  concept_count_list.sort(compare);
  return concept_count_list;
}

/*function toggle_show_all_symbols(but){
  var x = document.getElementById("symbol_bank_table");
  if (x.style.display === "none") {
    create_selected_symbol_table();
    showing_selected_symbols = true;
    x.style.display = "block";
    but.innerHTML = "hide symbols"
  } else {
    var cst_div = document.getElementById(chosen_symbol_table_div);
    cst_div = "";
    showing_selected_symbols = false;
    x.style.display = "none";
    but.innerHTML = "show symbols";
  }
}*/

function toggle_show_all_symbols(but){
  if (showing_selected_symbols == false) {
    var symbol_bank = document.getElementById("symbol_bank");
    symbol_bank.setAttribute("style","height:75%");
    create_selected_symbol_table();
    showing_selected_symbols = true;
    but.innerHTML = "hide symbols"
  } else {
    var symbol_bank = document.getElementById("symbol_bank");
    symbol_bank.setAttribute("style","height:auto");
    var cst_div = document.getElementById("chosen_symbol_table_div");
    cst_div.innerHTML = "";
    showing_selected_symbols = false;
    but.innerHTML = "show symbols";
  }
}

function updateProgress(){
  console.log()
  p = document.getElementById('progress_summary');
  empty_dom(p)
  num_of_symbols = Object.keys(selected_symbols).length;
  // var title_div = document.createElement('div');
  // title_div.innerHTML = concept_searched;
  // p.appendChild(title_div);
  var div3 = document.createElement('div');
  div3.setAttribute("class","progress_concept_info");
  var concept_counts_dict = getConceptCounts();
  var number_of_concepts = Object.keys(concept_counts_dict).length;
  var concept_string = '';
  var concept_count_list = get_sorted_object_count(concept_counts_dict);
  var target_number = 20;
  /*for(var i = 0; i < concept_count_list.length; i++){
    var concept_obj = concept_count_list[i];
    concept_string = concept_string + " <b>" + String(concept_obj.concept) + "</b> (" + String(concept_obj.count) + "),";
  }*/
  // div3.innerHTML = String(String(num_of_symbols) + " symbols found from " + String(number_of_concepts) + " concepts:" + concept_string + " <hr>");
  div3.innerHTML = String(number_of_concepts) + " / " + String(target_number) + "  unique symbols found for: <b>" + concept_searched + "</b>";

  p.appendChild(div3);
}
