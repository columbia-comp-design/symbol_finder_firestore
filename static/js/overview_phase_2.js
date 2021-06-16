var imageTotal = 0;
var clusterTotal = 0;
var termTotal = 0; 
var cluster_imageTotal = 0;
var cluster_termTotal = 0;

render_overview_page = function (isInit) {
    console.log("render_overview_page called")


    $.ajax({
      type: "POST",
      url: "/get_tree_view_json",
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({ "username": username, "concept": concept }),
      success: function (result) {
         imageTotal = 0;
         clusterTotal = 0;
         termTotal = 0; 
         cluster_imageTotal = 0;
         cluster_termTotal = 0;
        // var tree = $("#tree").fancytree("getTree");
        // var tree_clusters = tree.rootNode.children;
        // $('#loader').attr("style", "display:none")
        let tree_view_json = JSON.parse(result);

        
        //update overview header header
        $('#concept_name').html(concept);



        if (tree_view_json.hasOwnProperty("children")) {
          let tree_view_json_children = tree_view_json.children;
          populate_clusters_images(tree_view_json_children); //pass as an argument as an array of children, (all the clusters obj) 
        }


      },
      error: function (request, status, error) {
        console.log("Error");
        console.log(request)
        console.log(status)
        console.log(error)
      }
    });

    populate_clusters_images = function (clusters_obj) {
      // var symbol_grid  = document.getElementById('symbol_grid');
      // $('#symbol_grid');
      //symbol_grid.appendChild(image_table);
      //print all clusters

      for (let i = 0; i < clusters_obj.length; i++) {
        
        //reset counts
        cluster_imageTotal = 0; 
        cluster_termTotal = 0; 

        if(!isInit){
            $('#symbol_grid')
            .append($('<div>' + '<h3 class="clusterTitle">' + clusters_obj[i].title + '<span class="clusterInfo"> [<span id = "'+ clusters_obj[i].key + 'termTotal">0 term </span>, <span id = "'+ clusters_obj[i].key + 'imageTotal">0 image</span>] </span></h3>' + '</div>')
              .attr({ "id": clusters_obj[i].key, "class": "clusterDiv fluid-container" })
            );
        }
      

        $('#'+clusters_obj[i].key).hide();

        let clusterHasImage = false;
        //let clusterImageTotal = 0; 
        // $('#'+tree_view_json[i].title).html('<h3>' +tree_view_json[i].title + '</h3>');
        //append_children_image_to_cluster(clusters_obj[i].children, clusters_obj[i].key, clusterImageTotal);
        append_term_images_to_cluster(clusters_obj[i].children, clusters_obj[i].key);

        //while children has children 

      }
    }
    //append_children_image_to_cluster = function (children, cluster_key, clusterImageTotal)
    append_term_images_to_cluster = function (children, cluster_key) {



      for (let i = 0; i < children.length; i++) {
        
        //reset clusterHasImage
        //let clusterHasImage = false;

        // if statement for each children 
        if (children[i].data.hasOwnProperty("saved_img")) {
          if (!isObjEmpty(children[i].data.saved_img)) {
            
            append_term_to_cluster(children[i], cluster_key)

            cluster_termTotal++
            termTotal++;


            if(cluster_termTotal>0 ? $('#' + cluster_key + 'termTotal').text(cluster_termTotal + " terms") :  $('#' + cluster_key + 'termTotal').text(cluster_termTotal + " term") );

            // $('#' + cluster_key + 'termTotal').text(cluster_termTotal);
            
            if(termTotal>0 ? $('#termTotal').text(termTotal + "/20 unique terms ") :  $('#termTotal').text(termTotal + "/20 term ") );
           
            $('#'+cluster_key).show();
            clusterHasImage = true;


          }
        }

        //  recursive
        if (children[i].hasOwnProperty("children")) {
          append_term_images_to_cluster(children[i].children, cluster_key);
        }
      }
    }
    //append_term_to_cluster = function (child, cluster_key, clusterImageTotal)
    append_term_to_cluster = function (child, cluster_key) {
      // $('#' + cluster_key).append($('<div id=' + child.key + ' class="termDiv"> <h4 class="cluster_child_term">' + child.title + ' (' + Object.keys(child.data.saved_img).length + ') </h4> <div id=' + cluster_key + child.key + 'flex class="imageRow"> </div> </div>'))
      child_example = child;

      var saved_image_url = Object.keys(child.data.saved_img)[0];
      var unique_tree_path = child.data.saved_img[saved_image_url].tree_path_ids;

      // Fix JQuery slash issue
      unique_tree_path = unique_tree_path.replace(/\//g, "-");
      
      if(!isInit){
         $('#' + cluster_key).append($('<div id=' + unique_tree_path + ' class="termDiv"> ' + 
            '<h4  class="cluster_child_term"> <span class="pointer" onclick="go_to_finder_for_child_term(\''+unique_tree_path+'\')" >' + child.title + ' (' + Object.keys(child.data.saved_img).length + ') </span> </h4> <div id=' + unique_tree_path + 'image_row class="imageRow"> </div> </div>'))
      }
      // update cluster_imageTotal & imageTotal
      cluster_imageTotal += Object.keys(child.data.saved_img).length;
      imageTotal += Object.keys(child.data.saved_img).length;
      
      // $('#' + cluster_key + 'imageTotal').text(cluster_imageTotal);
      if(!isInit){
        if(cluster_imageTotal>0 ? $('#' + cluster_key + 'imageTotal').text(cluster_imageTotal + " images") :  $('#' + cluster_key + 'imageTotal').text(cluster_imageTotal + " image") );
      }

      // $('#imageTotal').text(imageTotal);/
      if(imageTotal>1 ? $('#imageTotal').text(imageTotal + " images ") :  $('#imageTotal').text(imageTotal + " image ") );

      append_images_to_term(child, unique_tree_path);

      //return clusterImageTotal;
    }

    // Took out cluster_key
    append_images_to_term = function (child, node_tree_path) {
      save_img_dict_ex = child.data.saved_img;

      let countImage = 0;
      let asciiCode = 97;
    
      for (k in child.data.saved_img) {

        let googleSearch = "https://www.google.com/search?q="+child.data.saved_img[k].google_search_term+"&source=lnms&tbm=isch&sa";
        // if(countImage<26 ? asciiCode=97: asciiCode=0);
        if(!isInit){
            if(countImage<26){
            $('#' + node_tree_path + 'image_row').append($('<div class = "imgSearchTermGroup"> <a  title="perform google search" target="_blank" href="'+googleSearch+'"> <img alt="" class="node_img" src=' + k + '> </a> <div class="imageDescription"> <h6>(' + String.fromCharCode(countImage + asciiCode)  + ')</h6> <h6 class="searchTerm">' + child.data.saved_img[k].google_search_term + '</h6> <h6></h6> </div> </div>'))
            }
            else{
            $('#' + node_tree_path + 'image_row').append($('<div class = "imgSearchTermGroup"> <a  title="perform google search" target="_blank" href="'+googleSearch+'"> <img alt="" class="node_img" src=' + k + '> </a> <div class="imageDescription"> <h6>(' + (countImage - 25)  + ')</h6> <h6 class="searchTerm">' + child.data.saved_img[k].google_search_term + '</h6> <h6></h6> </div> </div>'))
            }
        }
        countImage++;

      }      
    }

    count_cluster_total = function (clusters_obj) {
      for (let i = 0; i < clusters_obj.length; i++) {
        let bool = $('#' + clusters_obj[i].key).css('display') == 'none'
        if(!bool){        
          clusterTotal++;
        }
      }
      
      if(clusterTotal>0 ? $('#clusterTotal').text(clusterTotal + " clusters, ") :  $('#clusterTotal').text(clusterTotal + " cluster, ") );
      // $('#clusterTotal').text(clusterTotal);
    }

    function isObjEmpty(obj) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key))
          return false;
      }
      return true;
    }

  };