import firebase_admin
from firebase_admin import credentials, firestore
import json 
cred = credentials.Certificate("./symbolFinderSecret.json")
firebase_admin.initialize_app(cred, {
    'projectId' : 'symbolfinder-visiblends'
})
db = firestore.client()
# {"savvas": {"concepts": {"prehistoric": {"img_list": [{"url": "https://cdn3.vectorstock.com/i/1000x1000/77/57/cartoon-green-dinosaur-vector-20767757.jpg", "search_term": "dinosaur", "on_step_one": false, "confirm_time": null}, {"url": "https://static.thenounproject.com/png/161852-200.png", "search_term": "dinosaur icon", "on_step_one": false, "confirm_time": null}, {"url": "https://previews.123rf.com/images/cbenjasuwan/cbenjasuwan1412/cbenjasuwan141200014/34215293-ammonite-prehistoric-fossil-on-the-surface.jpg", "search_term": "prehistoric, fossil, dinosaur", "on_step_one": true, "confirm_time": 1724.2349999723956}], "img_dict": {"https://cdn3.vectorstock.com/i/1000x1000/77/57/cartoon-green-dinosaur-vector-20767757.jpg": true, "https://static.thenounproject.com/png/161852-200.png": true, "https://previews.123rf.com/images/cbenjasuwan/cbenjasuwan1412/cbenjasuwan141200014/34215293-ammonite-prehistoric-fossil-on-the-surface.jpg": true}}}}, "lydia": {"concepts": {"fun": {"img_list": [], "img_dict": {}}}}}
doc_ref = db.collection(u'jsonByDate').document(u'testing')
# doc_ref.set({
#     u'first': u'Ada',
#     u'last': u'Lovelace',
#     u'born': 1815
# })


# over write data 
doc_ref.set(
    {
    "savvas": {
        "concepts": {
            "prehistoric": {
                "img_list": [
                {
                    "url": "https://cdn3.vectorstock.com/i/1000x1000/77/57/cartoon-green-dinosaur-vector-20767757.jpg",
                    "search_term": "dinosaur",
                    "on_step_one": json.dumps(False),
                    "confirm_time": json.dumps(None)
                },
                {
                    "url": "https://static.thenounproject.com/png/161852-200.png",
                    "search_term": "dinosaur icon",
                    "on_step_one": json.dumps(False),
                    "confirm_time": json.dumps(None)
                },
                {
                    "url": "https://previews.123rf.com/images/cbenjasuwan/cbenjasuwan1412/cbenjasuwan141200014/34215293-ammonite-prehistoric-fossil-on-the-surface.jpg",
                    "search_term": "prehistoric, fossil, dinosaur",
                    "on_step_one": json.dumps(True),
                    "confirm_time": 1724.235
                }
                ],
                "img_dict": {
                "https://cdn3.vectorstock.com/i/1000x1000/77/57/cartoon-green-dinosaur-vector-20767757.jpg": json.dumps(True),
                "https://static.thenounproject.com/png/161852-200.png": json.dumps(True),
                "https://previews.123rf.com/images/cbenjasuwan/cbenjasuwan1412/cbenjasuwan141200014/34215293-ammonite-prehistoric-fossil-on-the-surface.jpg": json.dumps(True)
                }
            }
        }
    },
    "lydia": {
        "concepts": {
            "fun": {
                "img_list": [],
                "img_dict": {}
            }
        }
    }
    }
)

# print("send json to db")

# read data
# users_ref = db.collection(u'users')
# docs = users_ref.stream()
# json_data = "hey"
# for doc in docs:
#     json_data = doc.to_dict()
    #print(u'{} => {}'.format(doc.id, doc.to_dict()))

# print("pretty json:")
# print(json_data['savvas'])


#read data from a doc 
# doc_ref = db.collection(u'users').document(u'alovelace')
# doc = doc_ref.get()
# json_data = doc.to_dict()
# print(json_data) #get json

# if doc.exists:
#     print(u'Document data: {}'.format(doc.to_dict()))
# else:
#     print(u'No such document!')























# realtime DB
# import firebase_admin
# from firebase_admin import credentials, firestore, db

# cred = credentials.Certificate("./symbolFinderSecret.json")

# firebase_admin.initialize_app(cred, {
#     'databaseURL' : 'https://symbolfinder-visiblends.firebaseio.com/'
# })


# root = db.reference()

# new_user = root.child('users').push({
#     'name' : 'Mary Anning', 
#     'since' : 1700
# })


# print("here")