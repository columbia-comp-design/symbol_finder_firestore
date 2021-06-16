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

import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

projectsDate = "summer2020"
# projectsDate = "demo"

cred = credentials.Certificate("./symbolFinderSecret.json")
firebase_admin.initialize_app(cred, {
    'projectId' : 'symbol-finder-db'
})
# from google.cloud import firestore

db = firestore.client()
#document has the json data backup for each month 
doc_ref = db.collection(u'jsonByDate').document(u'testing6')
all_user_doc_ref = db.collection(u'projects').document(u'allUsers')



tmpl_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
app = Flask(__name__, template_folder=tmpl_dir)


@app.route('/update_tree_view_json', methods=['POST'])
def update_tree_view_json():
	print("update_tree_view_json() called")
	json_data = request.get_json()
	retrieved_username = json_data["username"]
	retrieved_concept = json_data["concept"]
	retrieved_tree_view_json = json_data["tree_view_json"]

	user_concept_tree_ref = db.collection(u'projects').document(u''+projectsDate).collection(u''+retrieved_username).document(retrieved_concept)
	user_concept_tree_doc = user_concept_tree_ref.get()
	doc_json = user_concept_tree_doc.to_dict()
	doc_json['tree_view_json'] = json.dumps(retrieved_tree_view_json)

	user_concept_tree_ref.set(doc_json)
	return jsonify(retrieved_tree_view_json)


@app.route('/get_project_json', methods=['POST'])
def get_project_json():
	# doc_ref = db.collection(u'jsonByDate').document(u'testing6')
	doc_ref = db.collection(u'projects').document(u''+projectsDate)
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

	user_concept_tree_ref = db.collection(u'projects').document(u''+projectsDate).collection(u''+username).document(concept)
	user_concept_tree_doc = user_concept_tree_ref.get()
	doc_json = user_concept_tree_doc.to_dict()
	tree_view_json = doc_json['tree_view_json']
	return jsonify(tree_view_json)



@app.route('/get_usernames_and_concepts', methods=['POST'])
def get_usernames_and_concepts():
	users_concepts_doc_ref = db.collection(u'projects').document(u''+projectsDate)
	users_concepts_doc = users_concepts_doc_ref.get()

	if users_concepts_doc.exists:
		print('Document exists')
	else:
		db.collection(u'projects').document(u''+projectsDate).set({'VisiBlends':{}})
		db.collection(u'projects').document(u''+projectsDate).collection(u''+'VisiBlends').document(u'concept_data').set({"concepts_dict":{}})

		all_user_doc_ref = db.collection(u'projects').document(u''+projectsDate)
		# add new username to allUsers document 
		allUser_doc = all_user_doc_ref.get()
		doc_json = allUser_doc.to_dict()
		doc_json['VisiBlends'] = {"concepts":{}}
		all_user_doc_ref.update(doc_json)
		print("created a new collection named projects and it's document is ", projectsDate)

	users_concepts_doc = users_concepts_doc_ref.get()
	doc_json = users_concepts_doc.to_dict()

	return jsonify(doc_json)



@app.route('/save_concept', methods=['POST'])
def save_concept():
	concept_dict = request.get_json()
	concept = concept_dict["concept"]
	username = concept_dict["username"]
	print("save_concept: ", concept)

	doc_ref = db.collection(u'projects').document(u''+projectsDate).collection(u''+username).document(concept)
	doc = doc_ref.get()


	if doc.exists:
		print("project->user-> concept exist")
	else:
		# create tree 
		tree_view_json, all_cluster_words = get_cluster_json_for_root(concept)
		db.collection(u'projects').document(u''+projectsDate).collection(u''+username).document(concept).set({"tree_view_json":json.dumps(tree_view_json)})


		users_concepts_doc_ref = db.collection(u'projects').document(u''+projectsDate)
		users_concepts_doc = users_concepts_doc_ref.get()
		doc_json = users_concepts_doc.to_dict()
		doc_json[username]["concepts"][concept] = {}

		users_concepts_doc_ref.update(doc_json)

	return jsonify(doc_json)




@app.route('/save_username', methods=['POST'])
def save_username():
	username = request.get_json()
	print("save_username ", username)

	doc_ref = db.collection(u'projects').document(u''+projectsDate).collection(u''+username).document(u'allConcepts')
	doc = doc_ref.get()
	
	if doc.exists:
		print("project->user-> exists")
	else:
		#new document for concepts 
		db.collection(u'projects').document(u''+projectsDate).collection(u''+username).document(u'concept_data').set({"concepts_dict":{}})
		all_user_doc_ref = db.collection(u'projects').document(u''+projectsDate)
		# add new username to allUsers document 
		allUser_doc = all_user_doc_ref.get()
		doc_json = allUser_doc.to_dict()
		doc_json[username] = {"concepts":{}}

		all_user_doc_ref.update(doc_json)

	return jsonify(doc_json)


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

	user_concept_tree_ref = db.collection(u'projects').document(u''+projectsDate).collection(u''+username).document(concept)
	user_concept_tree_doc = user_concept_tree_ref.get()
	doc_json = user_concept_tree_doc.to_dict()
	tree_view_json = json.loads(doc_json['tree_view_json'])

	return render_template("finder.html",concept=concept, username=username, tree_view_json=json.dumps(tree_view_json), swow_dict=json.dumps(swow_dict), swow_data_for_tree_view=json.dumps(swow_data_for_tree_view))


# Function to expand child term into phase 2 of SF
@app.route('/<username>/<concept>/<node_path>/finder', methods=['POST','GET'])
def finder(username,concept,node_path):

	print("calling finder() in main.py ")
	# print("/<username>/<concept>/<node_path>/finder called TESTING. username: ", username, " concept: ", concept, " node_path: ", node_path)

	# Call this function because modified swow_dict must be returned 
	get_cluster_json_for_root(concept)
	# Get data from firestore
	doc = doc_ref.get()
	json_data = doc.to_dict()
	username_dict = json_data

	user_concept_tree_ref = db.collection(u'projects').document(u''+projectsDate).collection(u''+username).document(concept)
	user_concept_tree_doc = user_concept_tree_ref.get()
	doc_json = user_concept_tree_doc.to_dict()
	tree_view_json = json.loads(doc_json['tree_view_json'])
	print("Reached end of finder() function in main.py!")

	return render_template("finder.html", node_path=node_path ,concept=concept, username=username, tree_view_json=json.dumps(tree_view_json), swow_dict=json.dumps(swow_dict), swow_data_for_tree_view=json.dumps(swow_data_for_tree_view))



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