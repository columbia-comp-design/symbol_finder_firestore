import operator
import json


def create_word_to_concreteness_dict():
	word_to_concreteness_dict = {}
	turker_file = open('./../data/abstract_concrete_5point_turk.csv','r')
	turker_file = turker_file.read()
	turker_file = turker_file.split('\n')
	for line in turker_file:
		line = line.split(',')
		if line[2] != 'Conc.M': 
			word = line[0]
			word_to_concreteness_dict[word] = round(float(line[2]) / 5.0,3)
	return word_to_concreteness_dict

def load_thesaurus():
	mac_thes_dict = {}
	mac_thes_f = open("mac_thes.txt","r")
	mac_thes_f = mac_thes_f.read()
	mac_thes_f = mac_thes_f.split("\n")
	for word_line in mac_thes_f:
		word_and_synonyms = word_line.split(':')
		if len(word_and_synonyms) > 1:
			word_pos = word_and_synonyms[0]
			word_and_pos = word_pos.split(" ")
			if len(word_and_pos) > 2:
				print word_and_pos
			word = word_and_pos[0]
			pos = word_and_pos[1]
			synonyms = word_and_synonyms[1]
			synonyms = synonyms.split(', ')
			if "" in synonyms:
				synonyms.remove("")
			wp_set = (word,pos)
			mac_thes_dict[frozenset(wp_set)] = synonyms
	return mac_thes_dict

def load_concept_set():
	concept_set_dict = {}
	concept_set_file = open("concept_set.txt","r")
	concept_set_file = concept_set_file.read()
	concept_set_file = concept_set_file.split("\n")
	for concept_line in concept_set_file:
		concept_pos = concept_line.split(',')
		concept = concept_pos[0]
		pos = concept_pos[1]
		if concept not in concept_set_dict:
			concept_set_dict[concept] = pos
	return concept_set_dict

def create_master_list(swow_dict): 
	for word in swow_dict:
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
	return swow_dict

def load_swow():
	swow_dict = {}
	swow_f = open("strength.SWOW-EN.R123.csv","r")
	swow_f = swow_f.read()
	swow_f = swow_f.split("\n")
	i = 0 
	for line in swow_f:
		line = line.split('\t')
		if i != 0 and len(line) > 1:
			cue = line[0].lower()
			response = line[1]
			count = int(line[2])
			strength = float(line[4])
			if count >= 2:
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
						backwards_dict[cue] = {"strength": float(strength), "count":int(count)}
					else:
						backwards_dict = {}
						backwards_dict[cue] = {"strength": float(strength), "count":int(count)}
						swow_dict[cue]["backward"] = backwards_dict
				else: 
					swow_dict[response] = {}
					backwards_dict = {}
					backwards_dict[cue] = {"strength": float(strength), "count":int(count)}
					swow_dict[response]["backward"] = backwards_dict
		i = i + 1
	return swow_dict



thesaurus = load_thesaurus()

concept_set = load_concept_set()
swow_dict = load_swow()
swow_dict = create_master_list(swow_dict)

wtc_dict = create_word_to_concreteness_dict()

# print swow_dict


'''
concept_num = len(concept_set)
num_in_thes = 0
for concept in concept_set:
	cp_set = (concept,concept_set[concept])
	if frozenset(cp_set) in thesaurus:
		num_in_thes = num_in_thes + 1
	else:
		print cp_set

print num_in_thes
'''

output_dict = {}

num_in_swow = 0
for concept in concept_set:
	if concept in swow_dict:

		c_swow_entry = swow_dict[concept]
		cm_dict = c_swow_entry["master"]
		sorted_master = sorted(cm_dict.items(), key=operator.itemgetter(1),reverse=True)
		just_w = [i[0] for i in sorted_master]

		syn_to_conc_dict = {}
		for w in just_w:
			if w in wtc_dict:
				conc_scr = wtc_dict[w]
				syn_to_conc_dict[w] = conc_scr
		sorted_conc = sorted(syn_to_conc_dict.items(), key=operator.itemgetter(1),reverse=True)
		sorted_conc = [i[0] for i in sorted_conc]

		pos = concept_set[concept]
		wp_set = (concept,pos)
		if frozenset(wp_set) in thesaurus:
			output_dict[concept] = {}
			output_dict[concept]["regular_swow_words"] = sorted_conc
			print "CONCEPT: " + str(concept)
			synonyms = thesaurus[frozenset(wp_set)]
			full_word_list = []
			# get swow related words for each synonym
			synonym_dict = {}
			if len(synonyms) > 15:
				synonyms = synonyms[:15]
			for synonym in synonyms:
				if synonym in swow_dict:
					synonym_dict[synonym] = {}
					synonym_dict[synonym]["swow_words"] = []
					# print "SYNONYM: " + synonym
					swow_entry = swow_dict[synonym]
					master_dict = swow_entry["master"]
					sorted_master = sorted(master_dict.items(), key=operator.itemgetter(1),reverse=True)
					for word in sorted_master:
						synonym_dict[synonym]["swow_words"].append(word[0])
						full_word_list.append(word[0])
			# assess concreteness of the words collected from all the synonyms


			output_dict[concept]["synonyms"] = synonym_dict
			syn_to_conc_dict = {}
			not_in_conc_dict = []
			for word in full_word_list:
				if word in wtc_dict:
					conc_scr = wtc_dict[word]
					syn_to_conc_dict[word] = conc_scr
				else:
					not_in_conc_dict.append(word)
			# sort by concreteness 
			sorted_conc_words = sorted(syn_to_conc_dict.items(), key=operator.itemgetter(1),reverse=True)
			only_words = [i[0] for i in sorted_conc_words]
			output_dict[concept]["full_concrete_list"] = only_words
			output_dict[concept]["words_without_concrete_scores"] = not_in_conc_dict

out = {}
out["concepts"] = output_dict

with open("swow_results.json","w") as fp:
	json.dump(out,fp)






'''
num_in_swow = num_in_swow + 1
print concept
swow_entry = swow_dict[concept]
if "forward" in swow_entry:
	forwards = swow_entry["forward"]
	forwards_sorted = []
	for f in forwards:
		st = forwards[f]['count']
		forwards_sorted.append((f,st))

	forwards_sorted = sorted(forwards_sorted,key=lambda x:x[1], reverse=True)
	print 'forwards:'
	print forwards_sorted
	print
if "backward" in swow_entry:
	backwards = swow_entry["backward"]
	backwards_sorted = []
	for b in backwards:
		st = backwards[b]['count']
		backwards_sorted.append((b,st))

	backwards_sorted = sorted(backwards_sorted,key=lambda x:x[1], reverse=True)
	print 'backwards:'
	print backwards_sorted
	print 
'''

	## else:
		#print concept
#print num_in_swow




