# Setting your own firestore 

## 1. Create a new project in [Firestore](https://console.firebase.google.com/)
- Give it a name

## 2. Create a database
- Under the **Develop** tab on the lefthand side, click on **Start in production mode** and the **next** button
- Choose a location. Ex: US-Central

## 3. Change permission
- Under the **Database** header, click on "Rules" tab 
- You will see this piece of code
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
- change the false value to true and click on **Publish**
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; 
    }
  }
}
```

## 4. Generate the private key 
- Go to settings
- Click on **Users and Permissions**
- Click on the **Service accounts** tab
- Click on the **Generate new private key** button
- Read the warnings!
- Click on the **Generate key** button

## 5. Use the key for your symbolFinder application 
 - In the root directory of your application, create a file with the name of **symbolFinderSecret.json** 
-  Copy and paste the key into **./symbolFinderSecret.json** file
- The key should look something like this:
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

## 6. Update the ProjectID in **main.py**
- Under *Project settings* in Firestore, click on **General**
- It would show your project ID
- replace that project ID in **main.py**
```js
cred = credentials.Certificate("./symbolFinderSecret.json")
firebase_admin.initialize_app(cred, {
    'projectId' : 'your-project-id' //replace here
})
```

