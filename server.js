const express = require("express");
var firebase = require("firebase")
const cors = require('cors');
const bodyParser = require('body-parser');
var admin = require("firebase-admin");
const port = process.env.PORT;

var serviceAccount = require("my firebase admin file.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "xxxxxxxxxxxxxxxxxxxx"
});

firebase.initializeApp({
    apiKey: "xxxxxxxxxx",
    authDomain: "xxxxxxxxxx",
    databaseURL: "xxxxxxxxxxxxxxxx",
    projectId: "xxxxxxxxxxx",
    storageBucket: "xxxxxxxxxx",
    messagingSenderId: "xxxxxxxxxxxxx",
    appId: "xxxxxxxxxxx",
    measurementId: "xxxxxxxxxx"
})




var database = admin.firestore();

const app = express();

app.use(cors())
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('app is working')
})

app.post('/register', (req, res) => {
    const { email, password, name, type } = req.body
    if (!email && !password && !name && !type) {
        return res.status(400).json('Please fill the required inputs before clicking register!')
    } else {
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((user) => {
                if (user) {
                    let user = firebase.auth().currentUser
                    user.updateProfile({
                        displayName: name,
                    }).then(() => {

                        const newUser = {
                            id: user.uid,
                            name: user.displayName,
                            email: user.email,
                            type,
                            pic: "https://www.kindpng.com/picc/b/495/4952535.png",
                            joined: user.metadata.creationTime
                        }
                        res.json(newUser);
                        database.collection('users').doc(user.uid).set(newUser)
                    })
                        .catch(err => {
                            res.status(400).json('error while signing up')
                        })
                } else {
                    res.status(400).json('the server has sent an error back')
                }
            })
            .catch(err => {
                res.status(400).json(err.message)
            })
    }
})


app.post('/login', (req, res) => {
    const { email, password } = req.body
    if (!email && !password) {
        return res.status(400).json('Please fill the required inputs before logging in!')
    } else {
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(user => {
                if (user) {
                    let user = firebase.auth().currentUser
                    database.collection('users').doc(user.uid).get().then(doc => {
                        const userLogin = {
                            id: user.uid,
                            name: user.displayName,
                            email: user.email,
                            type: doc.data().type,
                            pic: doc.data().pic,
                            joined: doc.data().joined
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
    }

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


app.post('/deletestore', (req, res) => {
    const { id } = req.body;
    let newStores = []
    const dbStore = database.collection('stores')
    dbStore.doc(id).delete()
        .then(() => {
            database.collection('stores').get()
                .then(snapshot => {
                    snapshot.forEach(doc => newStores.push(doc.data()))
                    res.json(newStores)
                })
                .catch(err => {
                    res.status(400).json("error deleting store")
                })
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


app.get('/user/:id', (req, res) => {
    const { id } = req.params;
    database.collection('users').doc(id).get()
        .then(user => {
            if (user) {
                res.json(user.data())
            } else {
                res.status(400).json('User does not exist')
            }
        })
        .catch(err => {
            res.status(400).json('error getting user please login again')
        })
})

app.put('/newpassword', (req, res) => {
    const { email, password, newPassword } = req.body;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(user => {
            if (user) {
                let user = firebase.auth().currentUser
                user.updatePassword(newPassword).then(() => {
                    res.json("success")
                }).catch(() => {
                    res.status(400).json("An error has occured while updating the password")
                });
            } else {
                res.status('400').json("error")
            }
        })
        .catch(() => {
            res.status(400).json("Please verify your current password then continue")
        })
})


app.put('/newpicture', (req, res) => {
    const { id, name, email, type, joined, pic } = req.body;
    const updatedUser = { id, name, email, type, joined, pic }

    database.collection('users').doc(id).set(updatedUser)
        .then(() => {
            res.json(updatedUser)
        })
        .catch((err) => {
            res.status(400).json('an error has occured while updating the profile picture')
        })
})






app.listen(port, () => {
    console.log(`app is listening on port ${port}`)
})