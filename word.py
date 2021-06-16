import os, json
import operator
import networkx as nx
# from networkx.algorithms import community
import community

#https://stackoverflow.com/questions/55765372/python-error-global-declared-variable-is-not-declared-in-the-global-scope
# https://stackoverflow.com/questions/10619600/assigning-nonetype-to-dict
swow_dict = dict()
swow_data_for_tree_view = dict()

wtc_dict = {}
new_conc_dict = {}
full_replace_dict = {}

stopwords_file = open("./stopwords.txt","r")
stopwords_file = stopwords_file.read()
stop_words = stopwords_file.split("\n")


def create_word_to_concreteness_dict():
	turker_file = open('./data/abstract_concrete_5point_turk.csv','r')
	turker_file = turker_file.read()
	turker_file = turker_file.split('\n')
	for line in turker_file:
		line = line.split(',')
		if line[2] != 'Conc.M': 
			word = line[0]
			wtc_dict[word] = round(float(line[2]) / 5.0,3)

def create_master_list(swow_dict):
	print("create_master_list(swow_dict) called") 
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
		for w in swow_entry_master_dict:
			count = swow_entry_master_dict[w]
			sim_score = float(count) / float(max_count)
			conc_scr = 0.5
			if w in wtc_dict:
				conc_scr = wtc_dict[w]
			conc_weight = 0.6
			sim_weight = 0.4
			comb_scr = (conc_scr * conc_weight) + (sim_score * sim_weight)
			comb_scr_arr.append((w,comb_scr))

		sorted_comb_list = sorted(comb_scr_arr,key=lambda x:x[1], reverse=True)
		sorted_comb_word_list = [i[0] for i in sorted_comb_list]
		# print(sorted_comb_word_list)
		# print("\n")
		swow_dict[word]["comb_words"] = sorted_comb_word_list
	
	# print(json.dumps(swow_dict, indent=4))
	return swow_dict

def load_swow():
	# print("load_swow() called")
	swow_dict = {}
	swow_f = open("./data/strength.SWOW-EN.R123.csv","r",encoding='UTF8')
	swow_f = swow_f.read()
	swow_f = swow_f.split("\n")
	i = 0 
	for line in swow_f:
		line = line.split('\t')
		if i != 0 and len(line) > 1:
			cue = line[0].lower()
			if cue in full_replace_dict:
				cue = full_replace_dict[cue]
			response = line[1].lower()
			if response in full_replace_dict:
				response = full_replace_dict[response]
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
							curr_count = forwards_dict[response]["count"]
							forwards_dict[response]["count"] = curr_count + count
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
						if cue not in backwards_dict:
							backwards_dict[cue] = {"strength": float(strength), "count": int(count)}
						else:
							curr_count = backwards_dict[cue]["count"]
							backwards_dict[cue]["count"] = curr_count + count
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



def create_word_replacement_dict():
	sts_file = open("space_to_squish_final.txt","r")
	sts_file = sts_file.read()
	sts_file = sts_file.split("\n")
	sts_dict = {}
	for pair in sts_file:
		pair_s = pair.split(",")
		f = pair_s[0]
		t = pair_s[1]
		sts_dict[f] = t
		full_replace_dict[f] = t
	
	pts_file = open("plural_to_singular_final.txt","r")
	pts_file = pts_file.read()
	pts_file = pts_file.split("\n")
	pts_dict = {}
	for pair in pts_file:
		pair_s = pair.split(",")
		f = pair_s[0]
		t = pair_s[1]
		full_replace_dict[f] = t

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
			

			max_new_nodes = 5

			'''
			if len(m_list) > 100: 
				max_new_nodes = 2
			if len(m_list) > 50 and len(m_list) <= 100:
				max_new_nodes = 5
			if len(m_list) > 15 and len(m_list) <= 50:
				max_new_nodes = 8
			if len(m_list) <= 15:
				max_new_nodes = 15
			'''


			# max_new_nodes = math.ceil(0.1 * len(m_list))
			# print(max_new_nodes)
			
			new_node_cnt = 0
			# top_20 = sorted_m_list[:20]
			top_20 = sorted_m_list
			if curr_depth == 0:
				top_20 = sorted_m_list[:60]
				# top_20 = sorted_m_list
				max_new_nodes = len(sorted_m_list)
			for word_weight_pair in top_20:
				#print("new_node_cnt: " + str(new_node_cnt))
				# word = 5
				word = word_weight_pair[0]
				if new_node_cnt == max_new_nodes and word not in nodes:
					#print(word)
					continue
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
	
	# bring back weight
	full_edge_list = []
	for edge in edge_list:
		s_edge = list(edge)
		f = s_edge[0]
		t = s_edge[1]
		w = edges[edge]["weight"]
		edge_with_weight = (f,t,w)
		full_edge_list.append(edge_with_weight)

	# print("full_edge_list")
	# print(full_edge_list)
	node_list = [n for n in nodes]
	print("NUMBER OF NODES: " + str(len(node_list)))
	G.add_nodes_from(node_list)
	G.add_weighted_edges_from(full_edge_list)
	# print(G.edges.data('weight', default=1))
	return G


def get_clusters(root_word,G):
	eigenvector_dict = nx.eigenvector_centrality(G)
	nx.set_node_attributes(G, eigenvector_dict, 'eigenvector')
	partition = community.best_partition(G,randomize=False)

	communities = {}
	for word in partition:
		c = partition[word]

		if c in communities:
			word_list = communities[c]
			word_list.append(word)
			communities[c] = word_list
		else:
			communities[c] = [word]

	# print(communities)
	# print("Number of communities: " + str(len(communities)))
	cluster_list = []
	for c in communities:
		eigen_list = []
		conc_list = []
		nodes = communities[c]
		for node in nodes:
			eigen_list.append((node,eigenvector_dict[node]))
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
		sorted_eigen_list = sorted(eigen_list,key=lambda x:x[1], reverse=True)
		sorted_eigen_list_just_words = [n[0] for n in sorted_eigen_list]
		sorted_conc_list = sorted(conc_list,key=lambda x:x[1], reverse=True)
		sorted_conc_list_just_wrods = [i[0] for i in sorted_conc_list]
		cluster_list.append((sorted_eigen_list_just_words,sorted_eigen_list[0][1],sorted_conc_list_just_wrods))
		# print(sorted_conc_list_just_wrods)
		sel_words = [n[0] for n in sorted_eigen_list]
		# print(sel_words)
		# print()

	sorted_cluster_list = sorted(cluster_list,key=lambda x:x[1], reverse=True)
	return sorted_cluster_list
	# for sc in sorted_cluster_list:
		# print()
		# print(sc)


def remove_cw_from_swow(sorted_cluster_list):
	all_cluster_words = {}
	for cluster in sorted_cluster_list:
		sorted_eigen_list_just_words = cluster[0]
		for cw in sorted_eigen_list_just_words:
			if cw not in all_cluster_words:
				all_cluster_words[cw] = True

	for cw in all_cluster_words:
		cw_comb_words = swow_dict[cw]["comb_words"]		
		to_delete = []
		for cw_comb_word in cw_comb_words:
			if cw_comb_word in all_cluster_words:
				to_delete.append(cw_comb_word)
		for dv in to_delete:
			cw_comb_words.remove(dv)
		swow_dict[cw]["comb_words"] = cw_comb_words
		# 1% of swow_dict
		# swow_data_for_tree_view[cw]["comb_words"] = cw_comb_words



def get_cluster_json_for_root(root_word):
	print("get_cluster_json_for_root called")
	depth = 2
	G = create_networkx_graph(swow_dict,root_word,depth)
	sorted_cluster_list = get_clusters(root_word,G)
	remove_cw_from_swow(sorted_cluster_list)
	# print('Getting sorted_cluster_list: ', sorted_cluster_list)

	treeview_json, all_cluster_words = generate_treeview_json(sorted_cluster_list)
	return treeview_json, all_cluster_words



def generate_treeview_json(sorted_cluster_list):
	treeview_json = []
	all_cluster_words = {}
	for cluster in sorted_cluster_list:
		parent_node = {}
		sorted_eigen_list_just_words = cluster[0]
		sorted_conc_list_just_wrods = cluster[2]
		first_three_eigen = sorted_eigen_list_just_words[:3]

		for cw in sorted_eigen_list_just_words:
			if cw not in all_cluster_words:
				all_cluster_words[cw] = True


		cluster_title = ''
		for word in first_three_eigen:
			cluster_title = cluster_title + word + ", "
		cluster_title = cluster_title[:-2]
		swow_dict[cluster_title] = {}
		# 1% of swow_dict
		swow_data_for_tree_view[cluster_title] = {}

		# swow_dict[cluster_title]["comb_words"] = sorted_conc_list_just_wrods
		swow_dict[cluster_title]["comb_words"] = sorted_eigen_list_just_words
		# 1% of swow_dict
		swow_data_for_tree_view[cluster_title]["comb_words"] = sorted_eigen_list_just_words
		# print(sorted_eigen_list_just_words[:10])
		#print()
		parent_node["title"] = cluster_title
		parent_node["icon"] = False
		parent_node["checkbox"] = False
		parent_node["children"] = []
		parent_node["is_cluster"] = True
		parent_node["expanded_once"] = False
		parent_node["saved_img"] = {}
		parent_node["google_image_urls"] = {}
		parent_node["mapping_childterm_to_path"] = {}
		# parent_node["node_key_path"] = ""


		# Field for tracking selected clusters 
		parent_node["selected"] = False
		for conc_word in sorted_eigen_list_just_words[:5]:
		# for conc_word in sorted_conc_list_just_wrods[:5]:
			child_node = {}
			child_node["title"] = conc_word
			# child_node["icon"] = "glyphicon glyphicon-plus"
			child_node["icon"] = False
			child_node["checkbox"] = False
			child_node["is_cluster"] = False
			child_node["expanded_once"] = False
			swow_entry = swow_dict[conc_word]
			m_list = swow_entry["master"]
			m_list = sorted(m_list.items(), key=operator.itemgetter(1),reverse=True)
			m_list_words = [i[0] for i in m_list]
			child_node["regular_swow"] = m_list_words
			#images 
			child_node["saved_img"] = {}
			child_node["google_image_urls"] = {}
			# child_node["node_key_path"] = ""

	
		
			parent_node["children"].append(child_node)
		treeview_json.append(parent_node)
	return treeview_json, all_cluster_words




# what we hvae before
# global swow_dict
# create_word_to_concreteness_dict()
# create_word_replacement_dict()
# swow_dict = load_swow()
# swow_dict = create_master_list(swow_dict)


# if the path exist, read from file 
def create_swow_dict_filePath():
	print("create_swow_dict_filePath() called")
	global swow_dict
	global swow_data_for_tree_view 
	create_word_to_concreteness_dict()
	create_word_replacement_dict()

	swow_dict = load_swow()
	swow_dict = create_master_list(swow_dict)

	with open('swow_dict.json','w') as outfile:
		json.dump(swow_dict, outfile)
		print("created swow_dict.json file and finished writing to file")

def load_swow_dict_filePath():
	# print("load_swow_dict_filePath() called")
	global swow_dict
	global swow_data_for_tree_view 
	# print(swow_data_for_tree_view)
	# print("path exists for swow_dict")
	# read
	with open('swow_dict.json', 'r') as swow_dict_file:
		swow_dict = json.load(swow_dict_file)
		print("finish reading from swow_dict file")
		# print(json.dumps(swow_dict))

if not os.path.exists('./swow_dict.json'): 
	create_swow_dict_filePath()
else:
	load_swow_dict_filePath()

	# 	# global swow_dict

	# 	create_word_to_concreteness_dict()
	# 	create_word_replacement_dict()
	# 	#read
	# 	# with open('username_symbols.json') as symbol_file:
	# 	# 	username_dict = json.load(symbol_file)
	# 	print("path exists for swow_dict   ")
	# 	# if not, make it
	# 	with open('swow_dict.json','w') as outfile:
	# 		json.dump(swow_dict, outfile)
	# 		print("finish writing to file ")

# if the path does not exist, create a new file 






























