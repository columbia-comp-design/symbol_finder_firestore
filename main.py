from flask import Flask, request, render_template, g, redirect, Response, url_for
from flask import jsonify, json
import operator
import os, json
import sys
import urllib
from datetime import datetime
from word import *
from time import gmtime, strftime

import firebase_admin
from firebase_admin import credentials, firestore
import json 

projecstDate = "summer2020"
cred = credentials.Certificate("./symbolFinderSecret.json")
firebase_admin.initialize_app(cred, {
    'projectId' : 'symbolfinder-visiblends'
})
# from google.cloud import firestore

db = firestore.client()
#document has the json data backup for each month 
doc_ref = db.collection(u'jsonByDate').document(u'testing6')
all_user_doc_ref = db.collection(u'projects').document(u'allUsers')



tmpl_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
app = Flask(__name__, template_folder=tmpl_dir)

# #done
# @app.route('/<username>/finder/save_symbols',  methods=['POST','GET'])
# def save_symbols(username):
# 	json_data = request.get_json() 
# 	username = json_data['username']
# 	url = json_data['url']
# 	search_term = json_data['term']
# 	to_remove = json_data['to_remove']
# 	concept = json_data['concept']
# 	confirm_time = json_data['confirm_time']
# 	on_step_one = json_data['step_one']
# 	new_symbol = {"url":url,"search_term":search_term,"on_step_one":on_step_one,"confirm_time":confirm_time}

# 	if to_remove:
# 		print("DELETING SYMBOL:")
# 	else:
# 		print("SAVING SYMBOL:")
# 	#print(json_data)
# 	print()
# 	data = 0
# 	concept_symbols = []

# 	#read
# 	# with open('username_symbols.json') as symbol_file:
# 	# 	username_dict = json.load(symbol_file)

# 	#get data from firestore
# 	doc = doc_ref.get()
# 	json_data = doc.to_dict()
# 	username_dict = json_data

# 	img_list = username_dict[username]["concepts"][concept]['img_list']
# 	# img_dict = username_dict[username]["concepts"][concept]['img_dict']
# 	if to_remove:
# 		for img in img_list:
# 			if img['url'] == url:
# 				img_list.remove(img)
# 				break
# 		username_dict[username]["concepts"][concept]['img_list'] = img_list
# 		# del username_dict[username]["concepts"][concept]['img_dict'][url]
# 	else:
# 		username_dict[username]["concepts"][concept]['img_list'].append(new_symbol)
# 		# if url not in img_dict:
# 			# username_dict[username]["concepts"][concept]['img_dict'][url] = True
			

# 	#write data 
# 	doc_ref.set(username_dict)
# 	return 'ok'




#done
@app.route('/update_selected_symbols',  methods=['POST','GET'])
def modified_selected_symbols():
	print("/update_selected_symbols")
	json_data = request.get_json() 
	selected_symbols = json_data['selected_symbols']
	username = json_data['username']
	concept = json_data['concept']

	doc_ref = db.collection(u'projects').document(u''+projecstDate)
	doc = doc_ref.get()
	username_dict = doc.to_dict()
	username_dict[username]['concepts'][concept]['selected_symbols'] = selected_symbols

	
	dicPath =  username +'.concepts.' + concept + '.selected_symbols'
	doc_ref.update({u''+dicPath:selected_symbols})
	return jsonify(selected_symbols)

# @app.route('/update_tree_view', method=['POST'])
# def update_tree_view():
# 	print("update_tree_view_json() called")
# 	json_data = request.get_json()
# 	retrieved_username = json_data["username"]
# 	retrieved_concept = json_data["concept"]
# 	retrieved_tree_view_json = json_data["tree_view_json"]
# 	hi = "d"





@app.route('/update_tree_view_json', methods=['POST'])
def update_tree_view_json():
	print("update_tree_view_json() called")
	json_data = request.get_json()
	retrieved_username = json_data["username"]
	retrieved_concept = json_data["concept"]
	retrieved_tree_view_json = json_data["tree_view_json"]

	user_concept_tree_ref = db.collection(u'projects').document(u''+projecstDate).collection(u''+retrieved_username).document(retrieved_concept)
	user_concept_tree_doc = user_concept_tree_ref.get()
	doc_json = user_concept_tree_doc.to_dict()
	doc_json['tree_view_json'] = json.dumps(retrieved_tree_view_json)

	print ("\n\n\n Here's the retrieved_username ", retrieved_username)
	print ("Here's the retrieved_concept: ", retrieved_concept)

	# dicPath =  retrieved_username +'.concepts.' + retrieved_concept + '.tree_view_json'
	user_concept_tree_ref.set(doc_json)
	return jsonify(retrieved_tree_view_json)

@app.route('/get_selected_symbols', methods=['POST'])
def get_selected_symbols():
	json_data = request.get_json() 
	username = json_data['username']
	concept = json_data['concept']

	# doc = doc_ref.get()
	# username_dict = doc.to_dict()

	doc_ref = db.collection(u'projects').document(u''+projecstDate)
	doc = doc_ref.get()
	username_dict = doc.to_dict()
	selected_symbols = username_dict[username]['concepts'][concept]['selected_symbols']
	return jsonify(selected_symbols)

@app.route('/get_project_json', methods=['POST'])
def get_project_json():
	# doc_ref = db.collection(u'jsonByDate').document(u'testing6')
	doc_ref = db.collection(u'projects').document(u''+projecstDate)
	doc = doc_ref.get()
	username_dict = doc.to_dict()
	return jsonify(username_dict)

@app.route('/is_concept_in_swow_dict', methods=['POST'])
def is_concept_in_swow_dict():

	json_data = request.get_json() 
	concept = json_data['concept']

	if concept in swow_dict:
		isConceptInSwowDict = True
	else:
		isConceptInSwowDict = False

	return jsonify({"isConceptInSwowDict": isConceptInSwowDict})

@app.route('/get_tree_view_json', methods=['POST'])
def get_tree_view_json():
	json_data = request.get_json() 
	username = json_data['username']
	concept = json_data['concept']

	user_concept_tree_ref = db.collection(u'projects').document(u''+projecstDate).collection(u''+username).document(concept)
	user_concept_tree_doc = user_concept_tree_ref.get()
	doc_json = user_concept_tree_doc.to_dict()
	tree_view_json = doc_json['tree_view_json']
	return jsonify(tree_view_json)


# #done
# @app.route('/<username>/symbols/get_symbols_for_username', methods=['POST'])
# def get_symbols_for_username(username):
# 	request_dict = request.get_json()
# 	username = request_dict["username"]
# 	print("USERNAME: " + username)
# 	concept = request_dict["concept"]

# 	doc = doc_ref.get()
# 	json_data = doc.to_dict()

# 	# with open('username_symbols.json') as json_file:
# 	username_dict = json_data
# 	return jsonify(username_dict[username]["concepts"][concept]["img_list"])

'''
@app.route('/get_concepts', methods=['POST'])
def get_concepts():
	# check if symbols.json exists
	if not os.path.exists('./symbols.json'): 
		concept_dict = {}; 
		# if not, make it
		with open('symbols.json','w') as outfile:
			json.dump(concept_dict, outfile)
	# if exists, get the full concept_dict
	with open('symbols.json') as json_file:
		concept_dict = json.load(json_file)
		return jsonify(concept_dict)
'''
#done
@app.route('/get_usernames_and_concepts', methods=['POST'])
def get_usernames_and_concepts():
	# doc_ref = db.collection(u'jsonByDate').document(u'testing6')
	# doc_ref = db.collection(u'projects').document(u''+projecstDate)
	# doc = doc_ref.get()

	users_concepts_doc_ref = db.collection(u'projects').document(u''+projecstDate)
	users_concepts_doc = users_concepts_doc_ref.get()

	if users_concepts_doc.exists:
		print('hi doc exists')
		# print(u'Document data: {}'.format(doc.to_dict()))
	else:
		# db.collection(u'jsonByDate').document(u'testing2').set(username_dict)
		db.collection(u'projects').document(u''+projecstDate).set({'VisiBlends':{}})
		db.collection(u'projects').document(u''+projecstDate).collection(u''+'VisiBlends').document(u'concept_data').set({"concepts_dict":{}})
		print("created a new collection named projects and it's document is ", projecstDate)

	# # if exists, get the full concept_dict
	#with open('username_symbols.json') as json_file:
	# 	username_dict = json.load(json_file)
	# username_dict = doc.to_dict()
	users_concepts_doc = users_concepts_doc_ref.get()
	doc_json = users_concepts_doc.to_dict()

	return jsonify(doc_json)

'''
@app.route('/symbols/get_concepts', methods=['POST'])
def get_sconcepts():
	# check if symbols.json exists
	if not os.path.exists('./symbols.json'): 
		concept_dict = {}; 
		# if not, make it
		with open('symbols.json','w') as outfile:
			json.dump(concept_dict, outfile)
	# if exists, get the full concept_dict
	with open('symbols.json') as json_file:
		concept_dict = json.load(json_file)
		return jsonify(concept_dict)
'''
#done
@app.route('/save_concept', methods=['POST'])
def save_concept():
	concept_dict = request.get_json()
	concept = concept_dict["concept"]
	username = concept_dict["username"]
	print("save_concept: ", concept)

	doc_ref = db.collection(u'projects').document(u''+projecstDate).collection(u''+username).document(concept)
	doc = doc_ref.get()


	if doc.exists:
		print("project->user-> concept exist")
		# print(u'Document data: {}'.format(doc.to_dict()))
	else:
		# create tree 
		tree_view_json, all_cluster_words = get_cluster_json_for_root(concept)
		db.collection(u'projects').document(u''+projecstDate).collection(u''+username).document(concept).set({"tree_view_json":json.dumps(tree_view_json)})

		# concept_doc = all_user_doc_ref.get()
		users_concepts_doc_ref = db.collection(u'projects').document(u''+projecstDate)
		users_concepts_doc = users_concepts_doc_ref.get()
		doc_json = users_concepts_doc.to_dict()
		doc_json[username]["concepts"][concept] = {}
		doc_json[username]["concepts"][concept]["selected_symbols"] = {}

		users_concepts_doc_ref.update(doc_json)


	# #get json from firestore
	# doc = doc_ref.get()
	# json_data = doc.to_dict()
	# username_dict = json_data

	# if concept not in username_dict[username]["concepts"]:
	# 	#concept fields
	# 	concept_data = {}
	# 	concept_data["tree_view_json"] = {}
	# 	concept_data["selected_symbols"] = {}
	
	# 	#generate tree view json 
	# 	tree_view_json, all_cluster_words = get_cluster_json_for_root(concept)
	# 	concept_data["tree_view_json"] = json.dumps(tree_view_json)

	# 	#add new concept to user 
	# 	path =  username +'.concepts.' + concept
	# 	doc_ref.update({u''+path:concept_data})

	# doc = doc_ref.get()
	# username_dict = doc.to_dict()
	return jsonify(doc_json)

#done
@app.route('/save_username', methods=['POST'])
def save_username():
	username = request.get_json()
	print("save_username ", username)

	doc_ref = db.collection(u'projects').document(u''+projecstDate).collection(u''+username).document(u'allConcepts')
	doc = doc_ref.get()
	
	if doc.exists:
		print("project->user-> exists")
		# print(u'Document data: {}'.format(doc.to_dict()))
	else:
		#new document for concepts 
		db.collection(u'projects').document(u''+projecstDate).collection(u''+username).document(u'concept_data').set({"concepts_dict":{}})
		all_user_doc_ref = db.collection(u'projects').document(u''+projecstDate)
		# add new username to allUsers document 
		allUser_doc = all_user_doc_ref.get()
		doc_json = allUser_doc.to_dict()
		doc_json[username] = {"concepts":{}}

		# path =  "users_dict" 
		all_user_doc_ref.update(doc_json)

	return jsonify(doc_json)


'''
@app.route('/symbols/<concept>', methods=['POST','GET'])
def symbols_for_concept(concept):
	return render_template("symbols_for_concept.html", concept=concept);
'''

@app.route('/<username>/symbols/<concept>', methods=['POST','GET'])
def symbols_for_concept(username,concept):
	return render_template("symbols_for_concept.html", concept=concept, username=username);

@app.route('/<username>/finder/<concept>', methods=['POST','GET'])
def finder_for_concept(username,concept):
	print("/<username>/finder/<concept> called. username: ", username, " concept: ", concept)
	# Call this function because modified swow_dict must be returned 
	get_cluster_json_for_root(concept)
	# Get data from firestore
	doc = doc_ref.get()
	json_data = doc.to_dict()
	username_dict = json_data

	user_concept_tree_ref = db.collection(u'projects').document(u''+projecstDate).collection(u''+username).document(concept)
	user_concept_tree_doc = user_concept_tree_ref.get()
	doc_json = user_concept_tree_doc.to_dict()
	tree_view_json = json.loads(doc_json['tree_view_json'])

	# Retrieve tree_view_json and all_cluster_words, and convert them from string to dict
	# tree_view_json = json.loads(username_dict[username]["concepts"][concept]["tree_view_json"])
	# all_cluster_words = json.loads(username_dict[username]["concepts"][concept]["all_cluster_words"])
	# print('Heres tree_view_json!!!\n\n\n')
	# print(json.dumps(tree_view_json, indent=4))

	# print('Heres all_cluster_words!!!\n\n\n')
	# print(json.dumps(all_cluster_words, indent=4))

	print("\n\n\n")
	print("swow_data_for_tree_view: ")
	print(json.dumps(swow_data_for_tree_view))


	# print("done with /<username>/finder/<concept> called.")
	# return render_template("finder.html",concept=concept, username=username, tree_view_json=json.dumps(tree_view_json), swow_dict=json.dumps({}), all_cluster_words = all_cluster_words)
	# swow_data_for_tree_view
	return render_template("finder.html",concept=concept, username=username, tree_view_json=json.dumps(tree_view_json), swow_dict=json.dumps(swow_dict), swow_data_for_tree_view=json.dumps(swow_data_for_tree_view))


# Function to expand child term into phase 2 of SF
# @app.route('/<username>/finder_for_child_term/<concept>/<node_path>', methods=['POST','GET'])
@app.route('/<username>/finder_for_child_term/<concept>', methods=['POST','GET'])

def finder_for_child_term(username,concept):

	# print("/<username>/finder_for_child_term/<concept> called TESTING. username: ", username, " concept: ", concept, " node_path: ", node_path)
	print("/<username>/finder_for_child_term/<concept> called TESTING. username: ", username, " concept: ", concept)

	# Call this function because modified swow_dict must be returned 
	get_cluster_json_for_root(concept)
	# Get data from firestore
	doc = doc_ref.get()
	json_data = doc.to_dict()
	username_dict = json_data

	user_concept_tree_ref = db.collection(u'projects').document(u''+projecstDate).collection(u''+username).document(concept)
	user_concept_tree_doc = user_concept_tree_ref.get()
	doc_json = user_concept_tree_doc.to_dict()
	tree_view_json = json.loads(doc_json['tree_view_json'])
	print("Reached end of finder_for_child_term function in main.py!")

	return render_template("finder_for_child_term.html",concept=concept, username=username, tree_view_json=json.dumps(tree_view_json), swow_dict=json.dumps(swow_dict), swow_data_for_tree_view=json.dumps(swow_data_for_tree_view))



@app.route('/', methods=['POST','GET'])
def start():
	return render_template("start.html")


if __name__ == "__main__":
  import click

  @click.command()
  @click.option('--debug', is_flag=True)
  @click.option('--threaded', is_flag=True)
  @click.argument('HOST', default='0.0.0.0')
  @click.argument('PORT', default=8081, type=int)
  def run(debug, threaded, host, port):

    debug = True;
    HOST, PORT = host, port
    print("running on %s:%d" % (HOST, PORT))
    # reload(sys)  
    # sys.setdefaultencoding('utf8')
    app.run(host=HOST, port=PORT, debug=debug, threaded=threaded)

  run()