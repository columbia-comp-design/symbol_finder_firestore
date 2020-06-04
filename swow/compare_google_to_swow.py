import glob
import json
import operator
import networkx as nx
from networkx.algorithms import community

stopwords_file = open("./../stopwords.txt","r")
stopwords_file = stopwords_file.read()
stop_words = stopwords_file.split("\n")

def create_master_list(swow_dict): 
	for word in swow_dict:
		# print(word)
		swow_entry_master_dict = {}
		swow_entry = swow_dict[word]
		if "forward" in swow_entry:
			forwards = swow_entry["forward"]
			for f in forwards:
				swow_entry_master_dict[f] = int(forwards[f]["count"])

		if "backward" in swow_entry:
			backwards = swow_entry["backward"]
			for b in backwards:
				if b in swow_entry_master_dict:
					swow_entry_master_dict[b] = swow_entry_master_dict[b] + int(backwards[b]["count"])
				else:
					swow_entry_master_dict[b] = int(backwards[b]["count"])
		swow_dict[word]["master"] = swow_entry_master_dict
		sorted_m_list = sorted(swow_entry_master_dict.items(), key=operator.itemgetter(1),reverse=True)
		sorted_m_list_words = [i[0] for i in sorted_m_list]
		swow_dict[word]["master_words"] = sorted_m_list_words
		max_count = sorted_m_list[0][1]
		comb_scr_arr = []
		# for w in swow_entry_master_dict:
		for w in sorted_m_list_words[:30]:
			count = swow_entry_master_dict[w]
			sim_score = float(count) / float(max_count)
			conc_scr = 0.5
			if w in wtc_dict:
				conc_scr = wtc_dict[w]
			comb_scr = conc_scr
			comb_scr_arr.append((w,comb_scr))

		sorted_comb_list = sorted(comb_scr_arr,key=lambda x:x[1], reverse=True)
		sorted_comb_word_list = [i[0] for i in sorted_comb_list]
		# print(sorted_comb_word_list)
		# print("\n")
		swow_dict[word]["comb_words"] = sorted_comb_word_list
	return swow_dict

def load_swow():
	swow_dict = {}
	swow_f = open("./strength.SWOW-EN.R123.csv","r")
	swow_f = swow_f.read()
	swow_f = swow_f.split("\n")
	i = 0 
	for line in swow_f:
		line = line.split('\t')
		if i != 0 and len(line) > 1:
			cue = line[0].lower()
			response = line[1].lower()
			count = int(line[2])
			strength = float(line[4])
			if count >= 2 and cue != response:
				if cue in swow_dict:
					dicts = swow_dict[cue]
					if "forward" in dicts:
						forwards_dict = swow_dict[cue]["forward"]
						if response not in forwards_dict:
							forwards_dict[response] = {"strength": float(strength), "count": int(count)}
					else:
						swow_dict[cue]["forward"] = {}
						swow_dict[cue]["forward"][response] = {"strength": float(strength), "count": int(count)}
				else:
					swow_dict[cue] = {}
					swow_dict[cue]["forward"] = {}
					swow_dict[cue]["forward"][response] = {"strength": float(strength), "count": int(count)}

				if response in swow_dict:
					dicts = swow_dict[response]
					if "backward" in dicts:
						backwards_dict = dicts["backward"]
						backwards_dict[cue] = {"strength": float(strength), "count": int(count)}
					else:
						backwards_dict = {}
						backwards_dict[cue] = {"strength": float(strength), "count": int(count)}
						swow_dict[cue]["backward"] = backwards_dict
				else: 
					swow_dict[response] = {}
					backwards_dict = {}
					backwards_dict[cue] = {"strength": float(strength), "count": int(count)}
					swow_dict[response]["backward"] = backwards_dict
		i = i + 1
	return swow_dict

def create_networkx_graph(swow_dict,root,depth):
	nodes = {}
	edges = {}
	curr_depth = 0
	G = nx.Graph()
	curr_nodes = [root]
	while curr_depth < depth:
		next_nodes = []
		for n in curr_nodes: 
			swow_entry = swow_dict[n]
			m_list = swow_entry["master"]
			sorted_m_list = sorted(m_list.items(), key=operator.itemgetter(1),reverse=True)
			max_new_nodes = 10
			new_node_cnt = 0
			top_20 = sorted_m_list[:20]
			if curr_depth == 0:
				# top_20 = sorted_m_list[:60]
				top_20 = sorted_m_list[:60]
				max_new_nodes = len(sorted_m_list)
			for word_weight_pair in top_20:
				if new_node_cnt == max_new_nodes and word not in nodes:
					continue
				word = word_weight_pair[0]
				if word not in stop_words:
					weight = word_weight_pair[1]
					if word not in nodes:
						next_nodes.append(word)
						nodes[word] = {}
						new_node_cnt = new_node_cnt + 1
					edge = (n,word)
					edge = frozenset(edge)
					if edge not in edges and len(edge) == 2:
						edges[edge] = {"weight": weight}
		curr_depth = curr_depth + 1
		curr_nodes = next_nodes
	edge_list = [e for e in edges]
	node_list = [n for n in nodes]
	G.add_nodes_from(node_list)
	G.add_edges_from(edge_list)
	return G

def create_word_to_concreteness_dict():
	turker_file = open('./../data/abstract_concrete_5point_turk.csv','r')
	turker_file = turker_file.read()
	turker_file = turker_file.split('\n')
	for line in turker_file:
		line = line.split(',')
		if line[2] != 'Conc.M': 
			word = line[0]
			wtc_dict[word] = round(float(line[2]) / 5.0,3)

def google_get_first_two_layers(word,search_obj):
	full_list = {}
	children = list(search_obj[word].keys())
	for child in children:
		if child not in full_list:
			full_list[child] = 0
		grandchildren = list(search_obj[word][child].keys())
		grandchildren.remove("href")
		grandchildren.remove("pos_in_list")
		for grandchild in grandchildren:
			if grandchild not in full_list:
				full_list[grandchild] = 0
	full_list = full_list.keys()
	return full_list

def intersection(lst1, lst2): 
	unique_lst1 = [value for value in lst1 if value not in lst2]
	unique_lst2 = [value for value in lst2 if value not in lst1]
	intersection = [value for value in lst1 if value in lst2] 
	return unique_lst1, unique_lst2, intersection

def swow_get_first_two_layers(word):
	full_list = {}
	children = swow_dict[word]["comb_words"]
	for child in children:
		if child not in full_list:
			full_list[child] = 0
		grandchildren = swow_dict[child]["comb_words"]
		for grandchild in grandchildren:
			if grandchild not in full_list:
				full_list[grandchild] = 0
	full_list = full_list.keys()
	return full_list

def sort_by_concreteness(words):
	conc_list = []
	for node in words:
		if node in wtc_dict:
				conc_list.append((node,wtc_dict[node]))
		else:
			if " " in node: 
				node_s = node.split(" ")
				highest_conc = 0
				for node_word in node_s:
					if node_word in wtc_dict:
						if wtc_dict[node_word] > highest_conc:
							highest_conc = wtc_dict[node_word]
				if highest_conc > 0:
					conc_list.append((node,highest_conc))
				else:
					conc_list.append((node,0.5))
			else:
				conc_list.append((node,0.5))
	sorted_conc_list = sorted(conc_list,key=lambda x:x[1], reverse=True)
	sorted_conc_list_words = [i[0] for i in sorted_conc_list]
	return sorted_conc_list_words

wtc_dict = {}
create_word_to_concreteness_dict()
swow_dict = load_swow()
swow_dict = create_master_list(swow_dict)

'''
word = "prehistoric"
depth = 2

# print (swow_dict[word])
# print ()
# print (swow_dict["party"])

master_list = swow_dict[word]["master"]
print("master_list")
print(master_list)
print()
n_list = create_networkx_graph(swow_dict,word,depth)
unique_master, unique_graph, inters = intersection(master_list,n_list)

print()
print("UNIQUE MASTER LIST: should be none: ")
print(unique_master)
print()

print("UNIQUE TO GRAPH: ")
print(unique_graph)
print()

print("INTERSECTION: ")
print(inters)
'''









full_google_obj = {}
for file in glob.glob("./google_json_files/*.json"):
	print(file)
	with open(file) as json_file:
		search_obj = json.load(json_file)
		word = list(search_obj.keys())
		# print(word)
		word = word[0]
		# print(word)
		depth = 2
		# words = create_networkx_graph(swow_dict,word,depth)
		# print (len(words))
		# break
		goog_list = google_get_first_two_layers(word,search_obj)
		goog_list = [x.lower() for x in goog_list]
		word = word.replace("+"," ")
		if word in swow_dict: 
			G = create_networkx_graph(swow_dict,word,depth)
			eigenvector_dict = nx.eigenvector_centrality(G)
			nx.set_node_attributes(G, eigenvector_dict, 'eigenvector')

			eigen_list = []
			for n in eigenvector_dict:
				eigen_list.append((n,eigenvector_dict[n]))

			sorted_eigen_list = sorted(eigen_list,key=lambda x:x[1], reverse=True)
			sorted_eigen_list_just_words = [i[0] for i in sorted_eigen_list]

			# swow_list = [x.lower() for x in swow_list]
			unique_goog_list, unique_swow_list, inter = intersection(goog_list,sorted_eigen_list_just_words)
			
			print ("==========================================================================================")
			print ("==========================================================================================")

			print ("concept: " + str(word))

			print ("UNIQUE_GOOG_LIST:")
			print (unique_goog_list)
			print()

			print ("UNIQUE_GOOG_LIST: (sorted by concreteness)")
			print (sort_by_concreteness(unique_goog_list))
			print()

			print ("UNIQUE_SWOW_LIST (sorted by centrality):")
			print (unique_swow_list)
			print()

			print ("UNIQUE_SWOW_LIST (sorted by concreteness):")
			print (sort_by_concreteness(unique_swow_list))
			print()

			print ("INTERSECTION:")
			print (inter)
			print()







