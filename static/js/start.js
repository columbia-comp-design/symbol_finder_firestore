var app = angular.module('welcome', []);
app.controller('welcome_controller', ['$scope', '$http', '$compile',  function($scope, $http, $compile) {


// $scope.concepts = ['lego','starbucks','gambling','winter','healthy','wealthy','spread','dawn','multifaceted','catch','blame','forget','erase','lead','conquer','attack','pride'];
// $scope.concepts = concepts

create_button_grid = function(concepts){
	var table_id = 'but_grid';
	var table = document.getElementById(table_id);
    row_num = 0;
    var row = table.insertRow(row_num);
    cell_num = 0;
    for (i = 0; i < concepts.length; i++) { 
    	concept = concepts[i]
    	console.log(concept)
		cell = row.insertCell(-1);


		var addBtn = document.createElement("button");
  		addBtn.className = "btn btn-primary"
  		addBtn.id = concept
  		addBtn.innerHTML = concept
  		addBtn.onclick = function(){
  			$scope.go_to_concept(this.id);
  		};

  		console.log(addBtn)
  		cell.innerHTML = String(i+1) + ' <form action="/" method="post" id="form1"> <button class= "btn btn-primary"> '+concept+' </button> <input type = "hidden" name = "concept" value = \"'+concept+'\" /> </form>'
		// cell.innerHTML = '<button class =\"btn btn-primary\" id=\"'+concept+'\" onclick=\"go_to_concept(this.id)\">'+concept+'</button>'
		// make new row
		if((i+1)%3 == 0){
    		row_num = row_num + 1;
    		row = table.insertRow(row_num);
    	}
	}
}

$scope.add_button = function(){
	console.log('in add_button')
	if($scope.concept_input != '')
	{	
		concept = String($scope.concept_input);
		$http.post("/save_button", {"concept": concept}).success(function(data, status, headers, config) { 
			$("#concept_input").val('')
			$scope.concepts.push(concept)
			$("#but_grid tr").remove(); 
			load_symbol_buttons()
		}).error(function(data, status) {
			console.log('oops error adding button')
    	});
	}
}

go_to_concept = function(id){
	console.log('going to concept: ' + String(id))
	$http.post("/", {"concept": id}).success(function(data, status, headers, config) { 
		console.log('yay!')
	}).error(function(data, status) {
		console.log('could not go to concept')
    });
}

load_symbol_buttons = function(){
	console.log('time to load')
	var concepts = $scope.concepts; // ['lego','starbucks','gambling','winter','healthy','wealthy','spread','dawn','multifaceted','catch','blame','forget','erase','lead','conquer','attack','pride'];
	create_button_grid(concepts); 
}

$scope.init = function (){
	load_symbol_buttons(); 
};





}]);