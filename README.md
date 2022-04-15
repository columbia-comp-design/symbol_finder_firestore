
# Symbol Finder 
A neat webapp for brainstorming associations for concepts and finding images for them. 
Learn more about https://columbia-comp-design.github.io/symbol_finder_web/

##### Tech Overview 
SymbolFinder uses:
- Firestore for data storage 
- Flask for backend (web server)
- Chrome for viewing the application


# Steps for running the webapp on your computer 
1. Clone the repository
2. Set up database with Firestore
3. Set up Google Custom Search API
4. Install dependencies (libraries)
5. Run the application
6. Others
6. 1. How to insert a new word to the dictionary (SWOW)


## 1. Clone the repository
```shell
git clone https://github.com/COLUMBIA-COMPUTATIONAL-DESIGN-LAB/symbol_finder_firestore.git
```
## 2. Set up Database with Firestore
There are 2 ways to set up Firestore:

### Option 1 (Default): Create your own Firestore database
* [Click here to see intructions to create your own Firestore database](https://github.com/COLUMBIA-COMPUTATIONAL-DESIGN-LAB/symbol_finder_firestore/blob/master/SettingFirestore.MD)

### Option 2 (For VisiBlends Team only): Get access to existing database
1. Ask a VisiBlends team member for the Firestore private key
2. In the root directory of your application, create a file with the name of **symbolFinderSecret.json** 
3. Copy and paste the key into **./symbolFinderSecret.json** file
- The key should look like this on your **./symbolFinderSecret.json** file 
// (this one is fake, so don't use it!)
```js
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

## 3. Set up Google Custom Search API
1. Go to the Google Cloud Platform Console: [https://console.developers.google.com/apis/](https://console.developers.google.com/apis/)
2. Search for **custom search api**
3. Click on **enable**
4. Click on **CREATE CREDENTIALS**
5. Under **Add credentials to your project**, 
  -  under *Which API are you using?*: select **custom search api**
  -  under *Where will you be calling the API from?*: select **web server**
  -  under *What data will you be accessing?*: select **Application data**
  -  under *Are you planning to use this API with App Engine or Compute Engine?*: select **No, I’m not using them**
  -  then click on the button **what credentials do I need?**
  -  under *Service account name*, **just write any valid name**
  -  then click on the **continue** button
  -  a message should pop up: *Service account has no role*, click on **CREATE WITHOUT A ROLE**
6. click on **CREATE CREDENTIALS**
  -  click on **API key**
7. Copy this key for your project 
  -  go to static/js/google.js edit this line:
```js
var api_key = "enter your api key here"
```
  -  The API looks something like this: (but this one is fake, so don't use it!)
```js
var api_key = "AIzXXXXSyByCCQQGfVOYjE-Eceg-Yq4rXOA27fxopyashg"
```

## 4. Install dependencies (libraries) using a virtual enviroment 

### step 1 (virtual enviroment):
1. Install VE software
```s
$ sudo /usr/bin/easy_install virtualenv
```
2. Go to the folder you want to be in and instantiate a new VE
```s
 $ python3 -m virtualenv yourenv
 ```

3. Activate your Virtual Environment: 
```s
$ source yourenv/bin/activate
```
- Note: to deactivate your virtual enviroment, go to the root directory:
```s
$ deactivate 
```
[learn more about virtual enviroment](https://docs.python.org/3/library/venv.html)


### step 2 (install libraries):
```s
$ pip3 install flask
$ pip3 install networkx
$ pip3 install community
$ pip3 install python-louvain
$ pip3 install firebase_admin
```

- Note: If you encounter this error : *ImportError: cannot import name 'opentype'*
```s
$ pip install --upgrade pyasn1-modules
```

## 5. Run the application 
```s
$ python3 main.py
```
Go to http://0.0.0.0:8081/ in your web browser

### Video Demo
<a href="https://www.youtube.com/watch?v=5N22-DSmy3s&feature=youtu.be" target= "_blank">
<img src="https://github.com/COLUMBIA-COMPUTATIONAL-DESIGN-LAB/symbol_finder_firestore/blob/master/videoDemo.png" width="350"/>
</a>

https://www.youtube.com/watch?v=5N22-DSmy3s&feature=youtu.be

# 6 Others
## 6. 1. How to insert a new word to the dictionary (SWOW)

1. **Find associations**
#### **Option 1: Search for the word in [https://smallworldofwords.org/en/project/explore]**(https://smallworldofwords.org/en/project/explore)
- The word **Covid-19**

### You will see three grids:
- Forward associations 
- Backward associations
- Related words

You will see words that are associated with the concept you searched for 

#### **Option 2: Manually input associated words** 
- The associations for the word **Columbia University** could be:
```
Butler Library 
King’s College
Morningside Heights
Core Curriculum 
University 
New York City
Orgo Night
Tree Lighting
The Varsity Show

```


2. **Write down the association in *data/strength.SWOW-EN.R123.cvs***
## Note: your N field must be greater than 1 
- Forward associations 
For the word covid-19
```
cue	response	R123	N	R123.Strength
covid-19	pandemic	24	-1	-1
covid-19	lockdown	7	-1	-1
covid-19	isolation	7	-1	-1
```

For the word columbia 
```
cue	response	R123	N	R123.Strength
columbia university  Butler Library	2	-1	-1
columbia universtiy	University 	2	-1	-1
columbia university	Tree Lighting	2	-1	-1
```
- Backward associations
```
quarantine	covid-19	2	-1	-1
pandemic	covid-19	2	-1	-1
```
### NOTE
- The separator for the **strength.SWOW-EN.R123.cvs** is a **Tab**
- Make sure that "Insert spaces when pressing tab" is disable
- You should use **space** if an associated word has a space in between like "Butler Library" 

3. **Delete *swow_dict.json* from your local machine located in the root directory of this application**



## Issues with search engine
If the resulting images on your searches for symbols seem to be significantly different from/worse than the results on the actual google search, you can fix this.

You should already have an API key, so all you'll need to do to fix this is create a programmable search engine with google, and get the search engine ID.
Head to https://programmablesearchengine.google.com/about/ and press "Get Started". Then, press "Add" to create a new search engine:
![](https://i.imgur.com/g9Jonom.png)

In "Sites to search", enter www.google.com, and press "Create".

![](https://i.imgur.com/17BPDAR.png)

Then, head to the Control Panel:
![](https://i.imgur.com/AFUIG3n.png)

Scroll down on the control panel, and there are three important things for us here:
![](https://i.imgur.com/ffVfP6x.png)

1. Make sure you enable "Image search"
2. Make sure you enable "Search the entire web"
3. Copy the "Search engine ID" value, this is what we'll put into our code.

Once you're here, you're all set, all you have to do is swap out your cx values.

In /static/js/google.js there are a few ajax calls:
![](https://i.imgur.com/Y3syFhX.png)

in each of these calls, replace the 'cx' value with the your Search engine ID and the resulting symbol searches should closely resemble the results from www.google.com.
