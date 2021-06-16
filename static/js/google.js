/*
 * Functions pertaining to the google image search
 * Savvas Petridis
 * March 27, 2019
 *
*/
//new repo
//change it to your own keys
// var api_key = "AIzaSyC8IhKmkYCKLLd2lNKx42UBGT268f9k8ew"
var api_key = "AIzaSyB8cr4TYHQ_1hekmF0qT6m6UYW-Jlyr1dE"


// Extracts the actual urls from the Google API results
extract_links = function (search_results) {
  urls = [];
  for (i = 0; i < 10; i++) {
    url = search_results['items'][i]['link'];
    urls.push(url);
  }
  return urls;
}

goog = function (t) {
  return $.ajax({
    type: "GET",
    dataType: 'JSON',
    url: "https://www.googleapis.com/customsearch/v1",
    data: ({
      'key': api_key,
      'cx': '015890050991066315514:iz21fmvdyja',
      'alt': 'json',
      'q': t,
      'searchType': 'image',
      'filter': '1', // removes duplicates?
      'start': '1', // starting image for search (can only return 10 at a time)
      'safe': 'active',
    }),
    jsonp: "$callback",
    success: function (e, data) {
      console.log("google search success for " + t + "!");
    }, 
    error: function (request, status, error) {
      console.log("Google Search Api is not working, API: ", api_key, "for :" , t);
      console.log(request)
      console.log(status)
      console.log(error)
    }
  });
}

cluster_google_search = function (cluster_title) {
  var async_request = [];
  var responses = [];
  var cluster_words = cluster_title.split(",");
  var order = [];
  for (var i = 0; i < cluster_words.length; i++) {
    var cluster_word = cluster_words[i];
    async_request.push($.ajax({
      type: "GET",
      dataType: 'JSON',
      url: "https://www.googleapis.com/customsearch/v1",
      data: ({
        'key': api_key,
        'cx': '015890050991066315514:iz21fmvdyja',
        'alt': 'json',
        'q': cluster_word,
        'searchType': 'image',
        'filter': '1', // removes duplicates?
        'start': '1', // starting image for search (can only return 10 at a time)
        'safe': 'active',
      }),
      jsonp: "$callback",
      success: function (e, data) {
        // console.log(i)
        responses.push(e);
      }
    }));

    async_request.push($.ajax({
      type: "GET",
      dataType: 'JSON',
      url: "https://www.googleapis.com/customsearch/v1",
      data: ({
        'key': api_key,
        'cx': '015890050991066315514:iz21fmvdyja',
        'alt': 'json',
        'q': concept_searched + " " + cluster_word,
        'searchType': 'image',
        'filter': '1', // removes duplicates?
        'start': '1', // starting image for search (can only return 10 at a time)
        'safe': 'active',
      }),
      jsonp: "$callback",
      success: function (e, data) {
        // console.log(i)
        responses.push(e);
      }
    }));

    order_obj = {};
    order_obj.search_term = cluster_word;
    order_obj.concept = cluster_word;

    order_obj2 = {};
    order_obj2.search_term = concept_searched + " " + cluster_word;
    order_obj2.concept = cluster_word;

    order.push(order_obj);
    order.push(order_obj2);

  }

  //find key 
  var node_key;
  for (var i = 0; i < tree_view_json.children.length; i++) {
    if (tree_view_json.children[i].title == cluster_title) {
        node_key = tree_view_json.children[i].key;
        console.log("matched cluster");
    }
  }

  var tree = $("#tree").fancytree("getTree");

  $.when.apply(null, async_request).done(function () {
    console.log("all requests complete.")
    console.log(responses);
    var url_obj = {};
    for (var i = 0; i < responses.length; i++) {
      var response = responses[i];
      var search_term = response.queries.request[0].searchTerms;
      var urls = extract_links(response);
      url_obj[search_term] = urls;
    }
    console.log("before fill_grids_for_cluster_concept", cluster_title);
    fill_grids_for_cluster_concept(url_obj, cluster_title, order);
  });

}

function isObjEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key))
      return false;
  }
  return true;
}


// path should be an array of strings ex :  [ "_1", "_3", "_193", "_1" ]
// node has to be the root node 
search_node_by_path = function(node, path){
    
   for(let i=0;i<path.length;i++){
    // console.log("first for path val ", path[i], " and i: ", i);


    for(let j=0; j<node.children.length;j++){
      // console.log("second for j: ", j)
      if(node.children[j].key == path[i]){
         node = node.children[j];
        //  console.log("node in for loop: ", node)
         break;
      }
    }
  }

  return node; 

}

multi_google_search = function (term, parent_term, tree_title_click, node_path_key) {
  console.log("calling multi_google_search!!, term: ", term, " ,tree_title_click: ", tree_title_click, "node_path_key: ", node_path_key);

  var parent_child_search = parent_term + " " + term;
  var icon_search = term + " icon";
  var root_term_search = concept_searched + " " + term;

  //search by the node's direct children 

  var tree = $("#tree").fancytree("getTree");
  //find the node's path 
  let keySeq = node_path_key.split('/');
  let node =  tree.rootNode;
  // console.log("KeySeq ", keySeq);
  // console.log("node tree.rooNode before for loop: ", node)

  node = search_node_by_path(node, keySeq);

  console.log("multi_google_search: Selected node" , node);
  if (isObjEmpty(node.data.google_image_urls)) {
    console.log("node.data.google_image_urls is empty")

    //use google Search API 
    $.when(goog(term), goog(parent_child_search), goog(icon_search), goog(root_term_search)).done(function (g1, g2, g3, g5) {
      console.log("used Google Search API")
      var url_obj = {};
      var urls_1 = extract_links(g1[0]);
      var urls_2 = extract_links(g2[0]);
      var urls_3 = extract_links(g3[0]);
      // var urls_4 = extract_links(g4[0]);
      var urls_5 = extract_links(g5[0])

      url_obj[term] = urls_1;
      url_obj[parent_child_search] = urls_2;
      url_obj[root_term_search] = urls_5;
      url_obj[icon_search] = urls_3;

      //using 1% of swow_dict
      if (term in swow_data_for_tree_view) {
        swow_data_for_tree_view[term].urls = url_obj;
      }
      else {
        // concept_dict[term] = {}
        // concept_dict[term].urls = url_obj;
        swow_data_for_tree_view[term] = {}
        swow_data_for_tree_view[term].urls = url_obj;
      }

      node.data.google_image_urls = url_obj;
      var updated_tree_view_json = tree.toDict(true);
      update_tree_view_json_to_server(updated_tree_view_json);
      console.log("calling fill_grids_for_concept, using Google Search API ")
      fill_grids_for_concept(url_obj, term, node_path_key);

    });
  }
  else {
    console.log("calling fill_grids_for_concept, RE-using Google Search API ")
    url_obj = node.data.google_image_urls;
    fill_grids_for_concept(url_obj, term, node_path_key);
  }
}




google_all_clusters = function (clusters) {
  var async_request = [];
  var responses = [];
  var cluster_dict = {};
  var cdict = {};
  for (var i = 0; i < clusters.length; i++) {
    
    var cluster_title = clusters[i];
    cdict[cluster_title] = {};
    var cluster_words = cluster_title.split(",");


    for (var j = 0; j < cluster_words.length; j++) {
      var cluster_word = cluster_words[j];
      var cluster_word = cluster_word.trim();
      cluster_dict[cluster_word] = cluster_title;
    }

    for (var j = 0; j < cluster_words.length; j++) {
      var cluster_word = cluster_words[j];
      async_request.push($.ajax({
        type: "GET",
        dataType: 'JSON',
        url: "https://www.googleapis.com/customsearch/v1",
        data: ({
          'key': api_key,
          // 'cx': '015890050991066315514:iz21fmvdyja',
          'cx': '015314052705546372023:zcpr29-rprc', // NEW IMPROVED CX FROM EVAN!
          'alt': 'json',
          'q': concept_searched + " " + cluster_word,
          'searchType': 'image',
          'filter': '1', // removes duplicates?
          // 'start': '1', // starting image for search (can only return 10 at a time)
          'safe': 'active',
        }),
        jsonp: "$callback",
        success: function (e, data) {
          // console.log(i)
          responses.push(e);
        }
      }));
    }



  //   //SPARE COPY IN CASE I MESS UP!
  $.when.apply(null, async_request).done(function () {
    console.log("Google_all_clusters complete. Responses:")
    console.log(responses);
    console.log(responses.length);
    // for (i in responses) {

    for (var i = 0; i < responses.length; i++) {
      var response = responses[i];
      var search_term = response.queries.request[0].searchTerms;
      var urls = extract_links(response);
      // console.log("response: "+i)
      // console.log(search_term)
      // console.log(urls)

      
      var actual_word = search_term.replace(concept_searched, "")
      actual_word = actual_word.trim();
      var cluster_title = cluster_dict[actual_word]
      cdict[cluster_title][actual_word] = urls;
    }


    for (var cluster_title in cdict) {
      var cluster_words = cluster_title.split(",");
      var final_urls = [];
      var final_url_dict = {};
      for (var j = 0; j < cluster_words.length; j++) {
        var cluster_word = cluster_words[j];
        var cluster_word = cluster_word.trim();
        // cluster_dict[cluster_word] = cluster_title;

        // console.log("cluster_title: "+cluster_title)
        // console.log("cluster_word: "+cluster_word)
        // console.log("cdict[cluster_title]")
        // console.log(cdict[cluster_title])

        if (cluster_word in cdict[cluster_title]){
          cword_urls = cdict[cluster_title][cluster_word];
          cword_urls_first_2 = cword_urls.slice(0, 2);
          final_urls = final_urls.concat(cword_urls_first_2);
          final_url_dict[cword_urls[0]] = cluster_word;
          final_url_dict[cword_urls[1]] = cluster_word;
        }else{
          console.log("did not find images in cdict for cluster_title"+cluster_title+" cluster_word"+cluster_word)
        }
      }

      var url_obj = {};
      url_obj[cluster_title] = final_urls;

      swow_data_for_tree_view[cluster_title].urls = url_obj;
      swow_data_for_tree_view[cluster_title].url_to_gsterm = final_url_dict;
    }

    fill_cluster_image_grids(clusters);
  });

  }

}



root_google_search = function (term, term_image_grid, padding_div, main_div) {
  // var api_key = "";
  $.ajax({
    type: "GET",
    dataType: 'JSON',
    url: "https://www.googleapis.com/customsearch/v1",
    data: ({
      'key': api_key,
      'cx': '015890050991066315514:iz21fmvdyja',
      'alt': 'json',
      'q': term,
      'searchType': 'image',
      'filter': '1', // removes duplicates?
      'start': '1', // starting image for search (can only return 10 at a time)
      'safe': 'active',
    }),
    jsonp: "$callback",
    success: function (e, data) {
      urls = extract_links(e);
      image_table = create_image_grid(term, urls);
      term_image_grid.appendChild(image_table);
      padding_div.appendChild(term_image_grid);
      main_div.appendChild(padding_div);


    }
  });
}





// Conducts a google image search! returns the urls
google_search = function (term, is_start, tree_click) {
  console.log('performing google search!')
  // var api_key = "";
  $.ajax({
    type: "GET",
    dataType: 'JSON',
    url: "https://www.googleapis.com/customsearch/v1",
    data: ({
      'key': api_key,
      'cx': '015890050991066315514:iz21fmvdyja',
      'alt': 'json',
      'q': term,
      'searchType': 'image',
      'filter': '1', // removes duplicates?
      'start': '1', // starting image for search (can only return 10 at a time)
      'safe': 'active',
    }),
    jsonp: "$callback",
    success: function (e, data) {
      urls = extract_links(e);
      console.log(urls)

      if (is_start) {
        //using 1% of swow_dict
        // concept_dict[term].urls = urls;
        swow_data_for_tree_view[term].urls = urls;
      }
      else {
        // console.log(term)
        //  console.log(concept_dict)
        //  console.log(concept_dict[term])

        //using 1% of swow_dict
        //  concept_dict[term].urls = urls;
        swow_data_for_tree_view[term].urls = urls;

        // var term_entry = {};
        // term_entry.urls = urls;
        // concept_dict[term] = term_entry;
      }

      if (tree_click == false) {
        set_node_image(term);
      }
      create_image_sidebar(urls, term);
    }
  });
}
