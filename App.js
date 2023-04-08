import React, { useState, useEffect } from 'react';
import DecisionTree from './decision-tree';
import { Text, View, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Button, ImageBackground, Modal, TouchableWithoutFeedback } from 'react-native';
import { trainingData, testData } from './data/treeData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider'
import Icon from "react-native-vector-icons/FontAwesome";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PredictMoodScreen from './PredictMoodScreen';
import { useNavigation } from '@react-navigation/native';
import {generateSummary} from './decision-tree';

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
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [isDataSavedToday, setIsDataSavedToday] = useState(false);
  const [totalDataDays, setTotalDataDays] = useState(0);
  const [daysMessage, setDaysMessage] = useState('Please enter and save your data!'); 



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

  const toggleHelpModal = () => {
    setHelpModalVisible(!helpModalVisible);
  };

  const logHelpModalPress = async () => {
    await analytics().logEvent('help_modal_press_home', {
      email,
    });
    console.log('Logged help modal press (home screen) event');
  };

  const handleHelpButtonPress = () => {
    toggleHelpModal();
    logHelpModalPress();
  };  

  const decimalHoursToHoursMinutes = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const minutes = (decimalHours - hours) * 60;
    return `${hours} hours ${Math.round(minutes)} mins`;
  };  

  const isNumber = (value) => {
    return !isNaN(value) && isFinite(value);
  };
  
  const isInputValid = (steps, sleep, exercise, alcohol, mood) => {
    return (
      isNumber(steps) &&
      steps.length > 0 &&
      isNumber(exercise) &&
      exercise.length > 0 &&
      isNumber(alcohol) &&
      alcohol.length > 0 &&
      sleep !== null &&
      mood !== null
    );
  };  

  const saveData = async () => {
    if (isInputValid(steps, sleep, exercise, alcohol, mood)) {
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
        // alert('Data saved and model trained successfully!');     
        
        // Update today's data saved state
        setIsDataSavedToday(true);
  
        // Update the total number of days data is saved
        setTotalDataDays(usersData.length); 
        
        // Update daysMessage based on totalDataDays
        if (usersData.length < 7) {
          setDaysMessage(`You have submitted ${usersData.length} days of data. When you reach 7 days, you will unlock the Predict Mood screen.`);
        } else {
          setDaysMessage(`You have submitted ${usersData.length} days of data.`);
        }      
  
      } catch (error) {
        console.error('Error saving data:', error);
        alert(error.message);
      }
    } else {
      alert('Please provide valid input for all fields.');
    }
  };
    

  const keys = ["steps", "sleep", "exercise", "alcohol", "mood"];

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleHelpButtonPress} style={styles.helpButton}>
            <Text style={styles.helpText}>Help</Text>
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.contentWrapper}>
            <Text style={styles.text}>Step count: {steps} steps</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your step-count"
              value={steps}
              onChangeText={handleStepsChange}
              // onSubmitEditing={saveData}
            />
            <Text style={styles.text}>Time asleep: {decimalHoursToHoursMinutes(sleep)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={12}
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
            <Text style={styles.text}>{daysMessage}</Text> 
          </View>
          <TouchableOpacity
            style={[
              styles.predictMoodButton,
              isDataSavedToday && totalDataDays >= 7 ? styles.predictMoodButtonEnabled : styles.predictMoodButtonDisabled
            ]}
            onPress={() => {
              if (isDataSavedToday && totalDataDays >= 7) {
                navigation.navigate('PredictMood', { email: userEmail, model: trainedModel });
              }
            }}
          >
            <Text style={styles.predictMoodButtonText}>Predict Mood</Text>
          </TouchableOpacity>
        </ScrollView>
        <Modal
          animationType="fade"
          transparent
          visible={helpModalVisible}
          onRequestClose={toggleHelpModal}
        >
          <TouchableWithoutFeedback onPress={toggleHelpModal}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>
                  Now adjust the values to see how your predicted mood changes with different habits!
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  predictMoodButtonDisabled: {
    backgroundColor: 'grey',
  },
  predictMoodButtonEnabled: {
    backgroundColor: 'purple',
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
  header: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 5,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 18,
    color: 'grey',
  },
  helpIcon: {
    fontSize: 22,
    color: 'grey',
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalText: {
    fontSize: 18,
  }, 
});

export default App;