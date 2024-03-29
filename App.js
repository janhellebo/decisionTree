import React, { useState, useEffect, useCallback } from 'react';
import DecisionTree from './decision-tree';
import { Text, View, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Button, ImageBackground, Modal, TouchableWithoutFeedback, Dimensions, Keyboard, FlatList, ActivityIndicator, LogBox } from 'react-native';
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
import ProgressBar from 'react-native-progress/Bar';
import {Table, Row, Rows} from 'react-native-table-component';


LogBox.ignoreLogs(['Invalid prop textStyle of type array supplied to Cell']);
LogBox.ignoreLogs(['Invalid prop `textStyle` of type `array` supplied to `Cell`, expected `object`.']);


const Stack = createStackNavigator();

const { width } = Dimensions.get('window'); 

const helpModalText = `Welcome to Willow! Here's a brief tutorial on how to use the home screen (note to enter yesterday's data for all except mood)

Step count: Input yesterday's steps.

Time asleep: Slide to set last night's sleep hours.

Exercise: Input minutes exercised yesterday.

Alcohol: Input units consumed yesterday.
On average, 1 shot of spirits is 1 unit, a standard glass of wine is 2.1 units, and a pint of beer is 2.3 units.

Mood: Pick a smiley for today's mood.

Save Data: Press to save your inputs.

Predict Mood: Save 7 days of data for a mood prediction.`;

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

// Allow users to see their data
const UserDataScreen = ({route}) => {
  const {email} = route.params;
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      const userCollection = firestore().collection(email);
      const snapshot = await userCollection.get();
      const usersData = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setUserData(usersData);
      console.log(usersData);
      setIsLoading(false);
    };
    fetchData();
  }, [email]);

  const decimalHoursToHoursMinutes = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const minutes = (decimalHours - hours) * 60;
    return `${hours} hours ${Math.round(minutes)} mins`;
  };  

  // Extract and format date from id
  const formattedUserData = userData.map((data) => {
    const [email, date] = data.id.split("_");
    return {...data, id: date};
  });

  // Update the renderItem function
  const renderItem = ({item}) => (
    <View style={styles.userDataItem}>
      <Table borderStyle={styles.tableBorder} style={styles.table}>
        <Row
          data={['Attribute', 'Data']} // Add a header row
          style={styles.tableHeader}
          textStyle={styles.tableHeaderText}
        />
        <Rows
          data={[
            [`Date`, `${item.id}`],
            [`Steps`, `${item.steps} steps`],
            [`Sleep`, `${decimalHoursToHoursMinutes(item.sleep)}`],
            [`Exercise`, `${item.exercise} minutes`],
            [`Alcohol`, `${item.alcohol} units`],
            [`Mood`, `${item.mood}`],
          ]}
          textStyle={styles.tableText}
        />
      </Table>
    </View>
  );


  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <Text style={styles.text}>Your Data:</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="purple" /> // Show loading indicator when isLoading is true
        ) : formattedUserData.length > 0 ? (
          <FlatList
            data={formattedUserData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <Text style={styles.noDataText}>No data saved yet</Text>
        )}
      </View>
    </SafeAreaView>
  );
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
  const [mood, setMood] = useState("No mood selected");
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

  const logYourDataButtonPress = async () => {
    await analytics().logEvent('your_data_button_press_home', {
      email,
    });
    console.log('Logged your data button press (home screen) event');
  };

  const handleHelpButtonPress = () => {
    toggleHelpModal();
    logHelpModalPress();
  };  

  const handleYourDataButtonPress = () => {
    logYourDataButtonPress();
    navigation.navigate('UserData', {email});
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
      mood !== null &&
      mood !== "No mood selected"
    );
  };  

  // Checks if user has submitted data for today
  const fetchTodaysData = useCallback(async () => {
    const currentDate = new Date();
    const dateId = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    const uniqueDocId = `${email}_${dateId}`;
    const userCollection = firestore().collection(email);
    const todaysDoc = await userCollection.doc(uniqueDocId).get();

    if (todaysDoc.exists) {
      const todaysData = todaysDoc.data();
      setSteps(todaysData.steps.toString());
      setSleep(todaysData.sleep);
      setExercise(todaysData.exercise.toString());
      setAlcohol(todaysData.alcohol.toString());
      setMood(todaysData.mood);
      setIsDataSavedToday(true);
      setUserEmail(email);

      // Fetch all documents from the Firestore collection with the user's email
      const snapshot = await userCollection.get();
      // Convert the fetched documents into an array of objects
      const usersData = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  
      console.log('usersData:', usersData);
  
      const filteredUsersData = usersData.filter((doc) => doc.id !== uniqueDocId);
  
      console.log('filteredUsersData:', filteredUsersData);
  
      // Create a new decision tree using the fetched data
      const model = new DecisionTree(
        "mood",
        ["steps", "sleep", "exercise", "alcohol"],
        filteredUsersData
      );

      setTrainedModel(model);

      // Update the total number of days data is saved
      setTotalDataDays(snapshot.docs.length);

      // Update daysMessage based on totalDataDays
      if (snapshot.docs.length < 7) {
        const dayString = snapshot.docs.length === 1 ? 'day' : 'days';
        setDaysMessage(`You have submitted ${snapshot.docs.length} ${dayString} of data! When you reach 7 days, you will unlock the Predict Mood screen.`);
      } else {
        setDaysMessage(`You have submitted ${snapshot.docs.length} days of data.`);
      }
    }
  }, [email]);  

  // Add the useEffect hook that calls fetchTodaysData when the component mounts
  useEffect(() => {
    fetchTodaysData();
  }, [fetchTodaysData]);  

  const saveData = async () => {
    if (isInputValid(steps, sleep, exercise, alcohol, mood)) {
      try {
        console.log('1. Saving data...');
        const userCollection = firestore().collection(email);
        console.log('2. Collection reference:', userCollection);
    
        // Get the current date as a string in the format 'YYYY-MM-DD'
        const currentDate = new Date();
        const dateId = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
        // const tempDate = '2023-5-13';
    
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
          email,
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

        model.printTree();
  
        // 5. Store the trained model in the state
        setTrainedModel(model);
        setUserEmail(email);
        console.log('SetUserEmail works:', userEmail);
        // alert('Data saved and model trained successfully!');     
        
        // Update today's data saved state
        setIsDataSavedToday(true);
  
        // Update the total number of days data is saved
        setTotalDataDays(usersData.length); 
        
        // Update daysMessage based on totalDataDays
        if (usersData.length < 7) {
          const dayString = usersData.length === 1 ? 'day' : 'days';
          setDaysMessage(`You have submitted ${usersData.length} ${dayString} of data! When you reach 7 days, you will unlock the Predict Mood screen.`);
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

  const progressValue = totalDataDays >= 7 ? 1 : totalDataDays / 7;



  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.leftContainer}>
            <TouchableOpacity onPress={handleYourDataButtonPress} style={styles.yourDataButton}>
              <Text style={styles.yourDataText}>Your data</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rightContainer}>
            <TouchableOpacity onPress={handleHelpButtonPress} style={styles.helpButton}>
              <Text style={styles.helpText}>Help</Text>
              <Text style={styles.helpIcon}>?</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          onTouchStart={Keyboard.dismiss}
        >
          <View style={styles.contentWrapper}>
            <Text style={styles.text}>Step count: {steps} steps</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your step-count"
              placeholderTextColor="#757575"
              keyboardType="number-pad"
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
              placeholderTextColor="#757575"
              keyboardType="number-pad"
              value={exercise}
              onChangeText={handleExerciseChange}
              // onSubmitEditing={saveData}
            />
            <Text style={styles.text}>Alcohol consumed: {alcohol} units</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount of alcohol drank in units"
              placeholderTextColor="#757575"
              keyboardType="decimal-pad"
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
            <Text style={styles.daysText}>{daysMessage}</Text> 
            <ProgressBar
              progress={progressValue}
              width={width * 0.5}
              height={10}
              borderRadius={5}
              borderWidth={0}
              color={'green'}
              unfilledColor={'#e0e0e0'}
              animationType="timing"
            />
            <TouchableOpacity
              style={[
                styles.predictMoodButton,
                isDataSavedToday && totalDataDays >= 7 ? styles.predictMoodButtonEnabled : styles.predictMoodButtonDisabled
              ]}
              onPress={() => {
                if (isDataSavedToday && totalDataDays >= 7) {
                  console.log('userEmail:', userEmail);
                  navigation.navigate('PredictMood', { email: userEmail, model: trainedModel });
                }
              }}
            >
              <Text style={styles.predictMoodButtonText}>Predict Mood</Text>
            </TouchableOpacity>            
          </View>
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
                  {helpModalText}
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
            <Stack.Screen name="UserData" component={UserDataScreen} />
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
    // alignItems: 'center',
    // justifyContent: 'center',
    // width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1, 
  },
  contentWrapper: {
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    marginBottom: 10,
  },
  text: {
    fontSize: 20,
    margin: 10,
  },
  daysText: {
    fontSize: 12,
    margin: 10,
    textAlign: 'center', 
    paddingHorizontal: 10, 
    alignSelf: 'center', 
  },
  slider: {
    width: width * 0.7,
    height: 40,
  },
  input: {
    width: width * 0.8,
    height: 40,
    borderColor: 'black',
    borderWidth: 1, 
    borderRadius: 10, 
    padding: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: width * 0.8,
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
    width: width * 0.6
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
    textAlign: 'center', // Center the text

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
    // alignSelf: 'flex-end',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  leftContainer: {
    flex: 1,
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
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
    width: width * 0.8,
  },
  modalText: {
    fontSize: 14,
  }, 
  yourDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // position: 'absolute',
    // top: 5,
    // left: 10,
  },
  yourDataText: {
    fontSize: 18,
    color: 'blue',
  },
  tableBorder: {
    borderWidth: 0.5,
    borderColor: '#c8c7cc',
  },
  userDataItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#c8c7cc',
  },
  tableText: {
    fontSize: 14,
    padding: 5,
  },
  tableHeader: {
    backgroundColor: '#f1f8ff',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 5,
  },
  table: {
    width: '100%',
  },
  noDataText: {
    fontSize: 18,
    color: 'grey',
  },
});

export default App;