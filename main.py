from flask import Flask, request, render_template, g, redirect, Response, url_for
from flask import jsonify, json
import operator
import os, json
import sys
import urllib
from datetime import datetime
from word import *
import time

import firebase_admin
from firebase_admin import credentials, firestore
import json 
cred = credentials.Certificate("./symbolFinderSecret.json")
firebase_admin.initialize_app(cred, {
    'projectId' : 'symbolfinder-visiblends'
})
# from google.cloud import firestore

db = firestore.client()
#document has the json data backup for each month 
doc_ref = db.collection(u'jsonByDate').document(u'june2020')


tmpl_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
app = Flask(__name__, template_folder=tmpl_dir)

#done
@app.route('/<username>/finder/save_symbols',  methods=['POST','GET'])
def save_symbols(username):
	json_data = request.get_json() 
	username = json_data['username']
	url = json_data['url']
	search_term = json_data['term']
	to_remove = json_data['to_remove']
	concept = json_data['concept']
	confirm_time = json_data['confirm_time']
	on_step_one = json_data['step_one']
	new_symbol = {"url":url,"search_term":search_term,"on_step_one":on_step_one,"confirm_time":confirm_time}

	if to_remove:
		print("DELETING SYMBOL:")
	else:
		print("SAVING SYMBOL:")
	#print(json_data)
	print()
	data = 0
	concept_symbols = []

	#read
	# with open('username_symbols.json') as symbol_file:
	# 	username_dict = json.load(symbol_file)

	#get data from firestore
	doc = doc_ref.get()
	json_data = doc.to_dict()
	username_dict = json_data

	img_list = username_dict[username]["concepts"][concept]['img_list']
	img_dict = username_dict[username]["concepts"][concept]['img_dict']
	if to_remove:
		for img in img_list:
			if img['url'] == url:
				img_list.remove(img)
				break
		username_dict[username]["concepts"][concept]['img_list'] = img_list
		del username_dict[username]["concepts"][concept]['img_dict'][url]
	else:
		if url not in img_dict:
			username_dict[username]["concepts"][concept]['img_dict'][url] = True
			username_dict[username]["concepts"][concept]['img_list'].append(new_symbol)

	#write data 
	doc_ref.set(username_dict)
	return 'ok'

#done
@app.route('/<username>/symbols/get_symbols_for_username', methods=['POST'])
def get_symbols_for_username(username):
	request_dict = request.get_json()
	username = request_dict["username"]
	print("USERNAME: " + username)
	concept = request_dict["concept"]

	doc = doc_ref.get()
	json_data = doc.to_dict()

	# with open('username_symbols.json') as json_file:
	username_dict = json_data
	return jsonify(username_dict[username]["concepts"][concept]["img_list"])

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
		# check if symbols.json exists
	# if not os.path.exists('./username_symbols.json'): 
	# 	concept_dict = {}; 
	# 	# if not, make it
	# 	with open('username_symbols.json','w') as outfile:
	# 		json.dump(concept_dict, outfile)
	doc = doc_ref.get()

	if doc.exists:
		print('hi doc exists')
		# print(u'Document data: {}'.format(doc.to_dict()))
	else:
		username_dict = {}
		db.collection(u'jsonByDate').document(u'testing2').set(username_dict)
		print("created a new document named testing2 ")

	# # if exists, get the full concept_dict
	#with open('username_symbols.json') as json_file:
	# 	username_dict = json.load(json_file)
	username_dict = doc.to_dict()
	return jsonify(username_dict)

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

	print("concept: ", concept)
	#get data from firestore
	doc = doc_ref.get()
	json_data = doc.to_dict()

	# with open('username_symbols.json') as json_file:
	# username_dict = json.load(json_file)
	username_dict = json_data

	if concept not in username_dict[username]["concepts"]:
		username_dict[username]["concepts"][concept] = {}
		username_dict[username]["concepts"][concept]["img_list"] = []
		username_dict[username]["concepts"][concept]["img_dict"] = {}
	
	#write data 
	doc_ref.set(username_dict)

	return 'ok'

#done
@app.route('/save_username', methods=['POST'])
def save_username():
	# concept_dict_with_new_concept = request.get_json()
	username = request.get_json()
	# print(username)
    
	#get data from firestore
	doc = doc_ref.get()
	json_data = doc.to_dict()
	# create username
	# with open('username_symbols.json') as json_file:
	#print("/save_username ->  ", json_data)
	username_dict = json_data
	# print(username_dict)
	if username not in username_dict:
		username_dict[username] = {"concepts": {}}
		 # create new user 
	# 		with open('new_username_symbols.json','w') as outfile:
	# 			json.dump(username_dict, outfile)
	# 			os.remove("./username_symbols.json")
	# 			os.rename("./new_username_symbols.json","./username_symbols.json")
	# print(username_dict)
	doc_ref.set(username_dict)
	return 'ok'


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
	tree_view_json, all_cluster_words = get_cluster_json_for_root(concept)
	print("done with /<username>/finder/<concept> called.")
	return render_template("finder.html",concept=concept, username=username, tree_view_json=json.dumps(tree_view_json), swow_dict=json.dumps(swow_dict), all_cluster_words = all_cluster_words)

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