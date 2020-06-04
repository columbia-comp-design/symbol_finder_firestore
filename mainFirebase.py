import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("./symbolFinderSecret.json")

firebase_admin.initialize_app(cred, {
    'projectId' : 'symbolfinder-visiblends'
})

db = firestore.client()

doc_ref = db.collection(u'users').document(u'alovelace')
doc_ref.set({
    u'first': u'Ada',
    u'last': u'Lovelace',
    u'born': 1815
})

print("here")















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