// // Import the functions you need from the SDKs you need
// // import { initializeApp } from "firebase/app";
// // import { getAnalytics } from "firebase/analytics";

// import * as firebase from "firebase";

// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyA8HleEjp_9ymVdaflDuPTxSUp_tBDY_tw",
//   authDomain: "healthtree-c2a24.firebaseapp.com",
//   projectId: "healthtree-c2a24",
//   storageBucket: "healthtree-c2a24.appspot.com",
//   messagingSenderId: "27440707536",
//   appId: "1:27440707536:web:0bf2ca8890daefd6932bd5",
//   measurementId: "G-9QZ26B7DX4"
// };

// // Initialize Firebase

// if (!FirebaseApp.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// }


// // const app = firebase.initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// export default firebase;


// // Import the functions you need from the SDKs you need
// import firebase from 'firebase/app';
// import { initializeApp } from "firebase/app";
// import { getFirestore } from 'firebase/firestore';
// // import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyA8HleEjp_9ymVdaflDuPTxSUp_tBDY_tw",
//   authDomain: "healthtree-c2a24.firebaseapp.com",
//   projectId: "healthtree-c2a24",
//   storageBucket: "healthtree-c2a24.appspot.com",
//   messagingSenderId: "27440707536",
//   appId: "1:27440707536:web:0bf2ca8890daefd6932bd5",
//   measurementId: "G-9QZ26B7DX4"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// export { app, db }


// // const analytics = getAnalytics(app);


// import firebase from 'firebase/app';
// import { initializeApp } from "firebase/app";
// import { getFirestore } from 'firebase/firestore';


// const firebaseConfig = {
//   apiKey: "AIzaSyA8HleEjp_9ymVdaflDuPTxSUp_tBDY_tw",
//   authDomain: "healthtree-c2a24.firebaseapp.com",
//   projectId: "healthtree-c2a24",
//   storageBucket: "healthtree-c2a24.appspot.com",
//   messagingSenderId: "27440707536",
//   appId: "1:27440707536:web:0bf2ca8890daefd6932bd5",
//   measurementId: "G-9QZ26B7DX4"
// };

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// export { app, db };



// import { initializeApp } from "@react-native-firebase/app";
// import firestore from "@react-native-firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyA8HleEjp_9ymVdaflDuPTxSUp_tBDY_tw",
//   authDomain: "healthtree-c2a24.firebaseapp.com",
//   projectId: "healthtree-c2a24",
//   storageBucket: "healthtree-c2a24.appspot.com",
//   messagingSenderId: "27440707536",
//   appId: "1:27440707536:web:0bf2ca8890daefd6932bd5",
//   measurementId: "G-9QZ26B7DX4",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = firestore();

// export { app, db };




import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA8HleEjp_9ymVdaflDuPTxSUp_tBDY_tw",
  authDomain: "healthtree-c2a24.firebaseapp.com",
  projectId: "healthtree-c2a24",
  storageBucket: "healthtree-c2a24.appspot.com",
  messagingSenderId: "27440707536",
  appId: "1:27440707536:web:0bf2ca8890daefd6932bd5",
  measurementId: "G-9QZ26B7DX4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

