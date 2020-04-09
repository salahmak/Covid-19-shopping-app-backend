const express = require("express");
var firebase = require("firebase")
const cors = require('cors');
const bodyParser = require('body-parser');
var admin = require("firebase-admin");
const uuidv1 = require('uuid/v1');

var serviceAccount = require("./double-gamma-272520-firebase-adminsdk-9v88v-7689ac4fc0.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://double-gamma-272520.firebaseio.com"
});

firebase.initializeApp({
    apiKey: "AIzaSyDRvYpK6ySVnY1WbKQlrsmO1Oy6pEHq_co",
    authDomain: "double-gamma-272520.firebaseapp.com",
    databaseURL: "https://double-gamma-272520.firebaseio.com",
    projectId: "double-gamma-272520",
    storageBucket: "double-gamma-272520.appspot.com",
    messagingSenderId: "808633636014",
    appId: "1:808633636014:web:1f4b187b3e0546d551093f",
    measurementId: "G-XSN0D376E0"
})




var database = admin.firestore();

const app = express();

app.use(cors())
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('app is working')
})

app.post('/register', (req, res) => {
    firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
        .then((user) => {
            if (user) {
                let user = firebase.auth().currentUser
                user.updateProfile({
                    displayName: req.body.name,
                }).then(() => {
                    const newUser = {
                        id: uuidv1(),
                        name: user.displayName,
                        email: user.email
                    }
                    res.json(newUser);
                    database.collection('users').doc(user.uid).set(newUser)
                })
                    .catch(err => {
                        res.status(400).json('error while signing')
                    })
            } else {
                res.status(400).json('error')
            }
        })
        .catch(err => {
            res.status(400).json(err.message)
        })
})


app.post('/login', (req, res) => {
    firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.password)
        .then(user => {
            if (user) {
                let dbUser = {}
                let user = firebase.auth().currentUser
                database.collection('users').doc(user.uid).get().then(doc => {
                    const userLogin = {
                        id: doc.data().id,
                        name: user.displayName,
                        email: user.email
                    }
                    res.json(userLogin)
                }).catch(err => {
                    res.status(400).json("could not login")
                })

            } else {
                res.status(400).json('An error has occured while signing in')
            }
        })
        .catch(err => {
            res.json(err.message)
        })
})

app.post('/newstore', (req, res) => {
    const { name, type, ownerId, id, coords, items } = req.body;
    const newStore = {
        name,
        type,
        id,
        ownerId,
        coords,
        items
    }

    const dbStore = database.collection('stores').doc(id)
    dbStore.set(newStore)
        .then(() => {
            res.json(newStore)
            console.log(newStore)
        })
        .catch(err => {
            res.status(400).json(err.message)
        })
})

app.get('/getstores', (req, res) => {
    const dbStores = database.collection('stores')
    let storesList = []
    dbStores.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                storesList.push(doc.data())
            });

            res.json(storesList)
        })
        .catch(err => {
            res.status(400).json("could not get the stores")
        });
})


app.delete('/deletestore', (req, res) => {
    const { id } = req.body;
    const dbStore = database.collection('stores')
    dbStore.doc(id).delete()
        .then(() => {
            res.json('store deleted successfully')
        })
        .catch(err => {
            res.status(400).json('error deleting the store', err.message)
        })
})

app.put('/editstore', (req, res) => {
    let newStores = []
    const { name, type, ownerId, id, coords, items } = req.body;
    const editedStore = { name, type, ownerId, id, coords, items }
    database.collection('stores').doc(id).set(editedStore)
        .then(() => {
            database.collection('stores').get()
                .then(snapshot => {
                    snapshot.forEach(doc => newStores.push(doc.data()))
                    res.json(newStores)
                }).catch(err => {
                    res.status(400).json("error getting new stores")
                })
        })
        .catch(err => {
            res.status(400).json("error updating the store")
        })
})





///////// get stores:
/* 
*/



app.listen(3001, () => {
    console.log("app is listening on port 3001")
})