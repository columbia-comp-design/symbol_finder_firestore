# Symbol Finder 
A neat webapp for brainstorming associations for concepts and finding images for them. 

##### Tech Overview 
- Database: Firestore 
- Server: Flask 
- Intereface:  Browser 

Note: Here is the [repo](https://github.com/savvaspetridis/symbol_finder) for a version that stores the images locally on your computer 

# Steps for running the webapp on your computer 
1. cloning the repo
2. Setting Firstore
3. Setting Google Custom Search API
4. Install dependencies (libraries)
5. Running the app 


## 1. cloning the repo
```shell
git clone https://github.com/COLUMBIA-COMPUTATIONAL-DESIGN-LAB/symbol_finder_firestore.git
```
## 2. Setting Firestore
You can use Visiblends' Firestore database or setup your own Firestore database
* [Click here to see intructions on how to setup your own Firestore](./SettingFirestore.md)

### Using Visiblends's Database 
1. Ask a Visiblends team member for the Firestore private key
3. In the root directory of your application, create a file with the name of **symbolFinderSecret.json** 
2. copy and past the key into **./symbolFinderSecret.json** file
- The key should look like this on your **./symbolFinderSecret.json** file 
```js
// (this one is fake, so don't use it!)
{
  "type": "service_account",
  "project_id": "symbol-finder-db",
  "private_key_id": "e456821872b1fewjwdhlwijeiab01elkjw",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDlH702SkDZgMqH\njM+/pMxW6Gm0k7BbF7vRN34IoijreoijI8AlUE61JuFDW7nG7nSW9q\nJxLBmp0xwUpoi9FPs1guNyjkqdlxp2dv4Llmhg//ySQbn9Zt8GTIAMydlE9S02... V5\n-----END PRIVATE KEY-----\n",
  "client_email": "someValue@symbol-finder-db.iam.gserviceaccount.com",
  "client_id": "598729357390895",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x539/firebase-adminsdk-app-project.iam.gserviceaccount.com"
}

```

## 3. Setting Google Custom Search API
1. Go to the Google Cloud Platform Console: [https://console.developers.google.com/apis/](https://console.developers.google.com/apis/)
2. search for **custom search api**
3. Click on **enable**
4. Click on **CREATE CREDENTIALS**
5. Under **Add credential to your project**, 
-  select under *Which API are you using*:  **custom search api**
-  select under *Which API are you using*:  **web server**
-  select under *What data will you be accessing?*:  **Application data**
-  select *Are you planning to use this API with App Engine or Compute Engine?*: **No, I’m not using them**
- then click on the button **what credentials do I need?**
- under **Service account name*, just write any valid name
- then click on **continue** button
- it would pop a message: *Service account has no role*, click on **CREATE WITHOUT A ROLE**
6. click on **CREATE CREDENTIALS**
- click on **API key**
7. Use this key for your project 
- go to static/js/google.js edit this line:
```js
var api_key = "enter your api key here"
```
- The API looks something like this: (but this one is fake, so don't use it!)
```js
var api_key = "AIzXXXXSyByCCQQGfVOYjE-Eceg-Yq4rXOA27fxopyashg"
```




## 4. Install dependencies (libraries)
It is recommended to use a [virtual enviroment](https://docs.python.org/3/library/venv.html)
```js
pip3 install flask
pip3 install networkx
pip3 install community
pip3 install python-louvain
pip3 install firebase_admin
```

- Note: If you encounter this error : *ImportError: cannot import name 'opentype'*
```
pip install --upgrade pyasn1-modules
```

## 5. Running the app 
```
python3 main.py
```




