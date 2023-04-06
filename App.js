import React, { useState, useEffect } from 'react';
import DecisionTree from './decision-tree';
import { Text, View, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Button, ImageBackground } from 'react-native';
import { trainingData, testData } from './data/treeData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider'
import Icon from "react-native-vector-icons/FontAwesome";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PredictMoodScreen from './PredictMoodScreen';
import { useNavigation } from '@react-navigation/native';
import {generateSummary} from './decision-tree';

// import { db } from './firebaseConfig';

import firestore from '@react-native-firebase/firestore';

import { addDoc, collection, doc, setDoc } from '@react-native-firebase/firestore';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import analytics from '@react-native-firebase/analytics';


const Stack = createStackNavigator();

GoogleSignin.configure({
  webClientId: '27440707536-o941tlubbcghbtb879srur1jcfulq88s.apps.googleusercontent.com',
});

const signInWithGoogle = async () => {
  try {
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const signInResult = await auth().signInWithCredential(googleCredential);

    return signInResult;
  } catch (error) {
    console.error(error);
  }
};

const HomeScreen = ({email}) => {
  const navigation = useNavigation();

  // Add a state for the user
  const [user, setUser] = useState(null);

  // Add an effect to listen to the auth state
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);  


  const [steps, setSteps] = useState('');
  const [sleep, setSleep] = useState(7);
  const [exercise, setExercise] = useState('');
  const [alcohol, setAlcohol] = useState('');
  // const [mood, setMood] = useState(5);
  const [mood, setMood] = useState(null);
  const [syntheticData, setSyntheticData] = useState([]);
  const [trainedModel, setTrainedModel] = useState(null);
  const [userEmail, setUserEmail] = useState(null);



  const handleStepsChange = (text) => {
    setSteps(text);
  };

  const handleSleepChange = (value) => {
    setSleep(value);
  };

  const handleExerciseChange = (text) => {
    setExercise(text);
  };

  const handleAlcoholChange = (text) => {
    setAlcohol(text);
  };

  const handleMoodChange = (value) => {
    setMood(value);
  };


  
  // const saveData = async () => {
  //   try {
  //     console.log('1. Saving data...');
  //     const usersCollection = firestore().collection('users');
  //     console.log('2. Collection reference:', usersCollection);
  
  //     // Get the current date as a string in the format 'YYYY-MM-DD'
  //     const currentDate = new Date();
  //     const dateId = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
  //     // const tempDate = '2023-3-29';

  //     // Combine the user's ID with the date to create a unique document ID
  //     const uniqueDocId = `${email}_${dateId}`;
  //     // const uniqueDocId = `${email}_${tempDate}`;

  
  //     const userRef = await usersCollection.doc(uniqueDocId);
  //     console.log('3. User reference:', userRef);
  
  //     await userRef.set({
  //       steps: parseFloat(steps),
  //       sleep: sleep,
  //       exercise: parseFloat(exercise),
  //       alcohol: parseFloat(alcohol),
  //       mood: mood,
  //     });
  
  //     console.log('4. Data saved successfully');
  //     // Log an event using Firebase Analytics
  //     await analytics().logEvent('data_saved', {
  //       steps: parseFloat(steps),
  //       sleep: sleep,
  //       exercise: parseFloat(exercise),
  //       alcohol: parseFloat(alcohol),
  //       mood: mood,
  //     });  
  //     alert('Data saved successfully!');
  //   } catch (error) {
  //     console.error('Error saving data:', error);
  //     alert(error.message);
  //   }
  // };
  
  
  const saveData = async () => {
    try {
      console.log('1. Saving data...');
      const userCollection = firestore().collection(email);
      console.log('2. Collection reference:', userCollection);
  
      // Get the current date as a string in the format 'YYYY-MM-DD'
      const currentDate = new Date();
      const dateId = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
      // const tempDate = '2023-3-29';
  
      // Combine the user's ID with the date to create a unique document ID
      const uniqueDocId = `${email}_${dateId}`;
      // const uniqueDocId = `${email}_${tempDate}`;
  
      const userRef = await userCollection.doc(uniqueDocId);
      console.log('3. User reference:', userRef);
  
      await userRef.set({
        steps: parseFloat(steps),
        sleep: sleep,
        exercise: parseFloat(exercise),
        alcohol: parseFloat(alcohol),
        mood: mood,
      });
  
      console.log('4. Data saved successfully');
      // Log an event using Firebase Analytics
      await analytics().logEvent('data_saved', {
        steps: parseFloat(steps),
        sleep: sleep,
        exercise: parseFloat(exercise),
        alcohol: parseFloat(alcohol),
        mood: mood,
      });
      alert('Data saved successfully!');

      // 2. Fetch all documents from the Firestore collection with the user's email
      const snapshot = await userCollection.get();

      // 3. Convert the fetched documents into an array of objects
      const usersData = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      console.log('usersData:', usersData);

      const filteredUsersData = usersData.filter((doc) => doc.id !== uniqueDocId);

      console.log('filteredUsersData:', filteredUsersData);

      // 4. Create a new decision tree using the fetched data
      const model = new DecisionTree(
        "mood",
        ["steps", "sleep", "exercise", "alcohol"],
        filteredUsersData
      );

      // 5. Store the trained model in the state
      setTrainedModel(model);
      setUserEmail(email);
      alert('Data saved and model trained successfully!');      

    } catch (error) {
      console.error('Error saving data:', error);
      alert(error.message);
    }
  };
  

  // const fetchData = async () => {
  //   try {
  //     const userRef = await firestore().collection('users').doc('user1');
  //     const doc = await userRef.get();
  //     if (doc.exists) {
  //       const userData = doc.data();
  //       // Use userData (an object containing steps, sleep, water, alcohol, and mood) to create a new decision tree
  //       // For example: createDecisionTree(userData);
  //     } else {
  //       console.log('No such document!');
  //     }
  //   } catch (error) {
  //     console.log('Error getting document:', error);
  //   }
  // };

  // const generateSyntheticData = (numDays) => {
  //   const syntheticData = [];
  
  //   for (let i = 0; i < numDays; i++) {
  //     const dayData = {
  //       steps: Math.floor(Math.random() * 20000), // Random step count between 0 and 20000
  //       sleep: parseFloat((Math.random() * 14).toFixed(1)), // Random hours of sleep between 0 and 14 (with 1 decimal)
  //       exercise: Math.floor(Math.random() * 60), // Random exercise duration between 0 and 60 minutes
  //       alcohol: parseFloat((Math.random() * 10).toFixed(1)), // Random alcohol intake between 0 and 10 units (with 1 decimal)
  //       mood: Math.floor(Math.random() * 3) , // Random mood rating between 0 and 2
  //     };
  //     syntheticData.push(dayData);
  //   }
  
  //   return syntheticData;
  // };

  // useEffect(() => {
  //   // Generate and set the synthetic data when the component mounts
  //   const allSyntheticData = generateSyntheticData(100);
  //   setSyntheticData(allSyntheticData);
  // }, []);

  // const allSyntheticData = generateSyntheticData(100);

  // const splitIndex = Math.floor(0.7 * allSyntheticData.length);
  // const syntheticTrainData = allSyntheticData.slice(0, splitIndex);
  // const syntheticTestData = allSyntheticData.slice(splitIndex);

  const keys = ["steps", "sleep", "exercise", "alcohol", "mood"];



  //creating tree using training data
  // const model = new DecisionTree("mood", ["steps", "sleep", "exercise", "alcohol"], syntheticTrainData);


  // prints the generated tree
  // console.log('Generated decision tree:')
  // model.printTree()

  //calculating accuracy using test data
  var correct = 0;
  var wrong = 0;

  // for (let i = 0; i < syntheticTestData.length; i++) {
  //   let steps = syntheticTestData[i]["steps"];
  //   let sleep = syntheticTestData[i]["sleep"];
  //   let exercise = syntheticTestData[i]["exercise"];
  //   let alcohol = syntheticTestData[i]["alcohol"];
  //   let actualMood = syntheticTestData[i]["mood"];

  //   let predictedMood = Object.keys(model.classify({ "steps": steps, "sleep": sleep, "exercise": exercise, "alcohol": alcohol }));

  //   if (predictedMood == actualMood) {
  //     correct++;
  //   } else {
  //     wrong++;
  //   }
  // }

  result = correct / (correct + wrong);


  // const [summary, setSummary] = useState('');

  // const handleSummary = () => {
  //   const input = {
  //     'step count': 6000,
  //     'sleep': 6,
  //     'water consumption': 1.5,
  //     'alcohol consumption': 2,
  //   };

  //   const newSummary = generateSummary(model, input);
  //   setSummary(newSummary);
  // };

  // const input = {
  //   'step count': 6000,
  //   'sleep': 6,
  //   'exercise duration': 15,
  //   'alcohol consumption': 2,
  // };
  
  // const testSummary = model.generateSummary(input);
  // console.warn(testSummary);


  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.contentWrapper}>
            {/* <View style={{
                          borderWidth: 2, borderColor: 'blue',
                          borderRadius: 10, backgroundColor: 'white',
                          padding: 5}}>
              <Text>
              Number of training data: {syntheticTrainData.length}. There were {correct} correct answers and {wrong} wrong answers.
                The accuracy is: {result}
              </Text>
            </View>
            <View style={{
                          borderWidth: 2, borderColor: 'green',
                          borderRadius: 10, backgroundColor: 'white',
                          padding: 5}}>
              <Text>
                Synthetic Data:
              </Text>
              {syntheticData.slice(0, 10).map((data, index) => ( // Display first 10 records
                <Text key={index}>
                  Day {index + 1}: Steps: {data.steps}, Sleep: {data.sleep}, Exercise: {data.exercise}, Alcohol: {data.alcohol}, Mood: {data.mood}
                </Text>
              ))}
            </View> */}
            <Text style={styles.text}>Step count: {steps}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your step-count"
              value={steps}
              onChangeText={handleStepsChange}
              // onSubmitEditing={saveData}
            />
            <Text style={styles.text}>Hours of sleep: {sleep}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={14}
              step={0.25}
              value={sleep}
              onValueChange={handleSleepChange}
              // onSlidingComplete={saveData}
            />
            <Text style={styles.text}>Exercise: {exercise} minutes</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount of exercise done in minutes"
              value={exercise}
              onChangeText={handleExerciseChange}
              // onSubmitEditing={saveData}
            />
            <Text style={styles.text}>Units of alcohol: {alcohol} units</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount of alchol drank in units"
              value={alcohol}
              onChangeText={handleAlcoholChange}
              // onSubmitEditing={saveData}
            />
            {/* Mood question */}
            <Text style={styles.text}>How are you feeling today?</Text>

            {/* Smiley face buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, mood === 'Happy' ? styles.selected : null, { backgroundColor: 'green' }]}
                onPress={() => handleMoodChange('Happy')}
              >
                <Icon name="smile-o" size={60} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, mood === 'Neutral' ? styles.selected : null, { backgroundColor: 'grey' }]}
                onPress={() => handleMoodChange('Neutral')}
              >
                <Icon name="meh-o" size={60} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, mood === 'Low mood' ? styles.selected : null, { backgroundColor: 'blue' }]}
                onPress={() => handleMoodChange('Low mood')}
              >
                <Icon name="frown-o" size={60} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.text}>You selected: {mood}</Text>

            {/* Save Data button */}
            <TouchableOpacity style={styles.saveButton} onPress={saveData}>
              <Text style={styles.saveButtonText}>Save Data</Text>
            </TouchableOpacity> 
          </View>
          <TouchableOpacity style={styles.predictMoodButton} onPress={() => navigation.navigate('PredictMood', { email: userEmail, model: trainedModel })}>
          <Text style={styles.predictMoodButtonText}>Predict Mood</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const SignInScreen = ({
  onSignIn
}) => {
  const handleSignIn = async () => {  
    try {
      const result = await signInWithGoogle();
      console.log('Signed in with Google!');
      // Log an event using Firebase Analytics
      await analytics().logEvent('signed_in_with_google', {
        email: result.user.email,
      });    
      onSignIn(result.user.email);
    } catch (e) {
      alert('Authentication failed, please try again.');
      console.error(e);
    }
  };
      
  return (
    <ImageBackground
      source={require('./WillowTree.jpg')}
      resizeMode="cover"
      style={styles.signInContainer}
    > 
      <View style={styles.signInContent}>
        <Text style={styles.signInText}>Sign in with Google</Text>
        <TouchableOpacity onPress={handleSignIn} style={styles.signInButton}>
          <Icon name="google" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </ImageBackground>   
  );
};

const App = () => {
  const [ signedIn, setSignedIn ] = useState(false);
  const [email, setEmail] = useState(null);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {signedIn ? (
          <>
            <Stack.Screen name="Home">
              {(props) => <HomeScreen {...props} email={email} />}
              </Stack.Screen>
            <Stack.Screen name="PredictMood" component={PredictMoodScreen} />
          </>
        ) : (
          <Stack.Screen name="SignIn">
            {(props) => <SignInScreen {...props} onSignIn={(userEmail) => {
              setEmail(userEmail);
              setSignedIn(true);
            }} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1, 
  },
  contentWrapper: {
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
  },
  text: {
    fontSize: 20,
    margin: 10,
  },
  slider: {
    width: 200,
    height: 40,
  },
  input: {
    width: 300,
    height: 40,
    borderColor: 'black',
    borderWidth: 1, 
    borderRadius: 10, 
    padding: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b5998",
    justifyContent: "center",
    alignItems: "center",
  },
  predictMoodButton: {
    backgroundColor: '#3b5998',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  predictMoodButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  signInText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 5,
  }, 
  signInContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 5,
  },
  smileyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  selected: {
    borderWidth: 2,
    borderColor: 'purple',
    borderRadius: 50, 
  },
  saveButton: {
    backgroundColor: 'blue',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }, 
});

export default App;