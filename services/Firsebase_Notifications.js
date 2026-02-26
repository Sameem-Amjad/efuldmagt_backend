const firebase = require('firebase-admin');
const { firebaseAdminConfig } = require('../configurations/FirebaseBaseAdminConfig');

firebase.initializeApp({
    credential: firebase.credential.cert(firebaseAdminConfig)
});

module.exports = { firebase }