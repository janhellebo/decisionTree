import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import DecisionTree from './decision-tree';
import analytics from '@react-native-firebase/analytics';

const { width } = Dimensions.get('window'); // Get the screen width


const PredictMoodScreen = ({ route }) => {
  const navigation = useNavigation();

  const [steps, setSteps] = useState('');
  const [sleep, setSleep] = useState(7);
  const [exercise, setExercise] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [predictedMood, setPredictedMood] = useState('');
  const [moodSummary, setMoodSummary] = useState('');
  const [actualMood, setActualMood] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [helpModalVisible, setHelpModalVisible] = useState(false);




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

  const toggleHelpModal = () => {
    setHelpModalVisible(!helpModalVisible);
  };

  const logHelpModalPress = async () => {
    await analytics().logEvent('help_modal_press_predict', {
      email,
    });
    console.log('Help modal pressed on predict screen:', email);
  };

  const handleHelpButtonPress = () => {
    toggleHelpModal();
    logHelpModalPress();
  };  

  const { email, model } = route.params;

  const decimalHoursToHoursMinutes = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const minutes = (decimalHours - hours) * 60;
    return `${hours} hours ${Math.round(minutes)} mins`;
  };  

  const isNumber = (value) => {
    return !isNaN(value) && isFinite(value);
  };

  const isInputValid = (steps, sleep, exercise, alcohol) => {
    return (
      isNumber(steps) &&
      steps.length > 0 &&
      isNumber(exercise) &&
      exercise.length > 0 &&
      isNumber(alcohol) &&
      alcohol.length > 0 &&
      sleep !== null 
    );
  };  


  const predictMood = (updateState = true) => {
    if (isInputValid(steps, sleep, exercise, alcohol)) {
      const prediction = model.classify({
        "steps": parseFloat(steps),
        "sleep": sleep,
        "exercise": parseFloat(exercise),
        "alcohol": parseFloat(alcohol),
      });
      const mood = Object.keys(prediction)[0];
  
      if (updateState) {
        setPredictedMood(mood);
        setMoodSummary(model.generateSummary(mood, {
          steps: parseFloat(steps),
          sleep: sleep,
          exercise: parseFloat(exercise),
          alcohol: parseFloat(alcohol),
        }));
      }
  
      console.log(moodSummary);
      // alert(`Predicted mood: ${predictedMood}`);
      return {
        mood,
        summary: model.generateSummary(mood, {
          steps: parseFloat(steps),
          sleep: sleep,
          exercise: parseFloat(exercise),
          alcohol: parseFloat(alcohol),
        }),
      };
    } else {
      alert('Please provide valid input for all fields.');
    }
  };
  

  const initialPredictMood = async () => {
    if (loading) return;

    const { mood, summary } = predictMood(false);
    setPredictedMood(mood);
    console.log(mood)
    setMoodSummary(summary);

    // Check if the prediction matches the actual mood
    const isPredictionCorrect = mood === actualMood;
    setPredictedMood(`${mood} 
    (prediction ${isPredictionCorrect ? 'correct' : 'incorrect'})
    The model will improve over time as you provide more data!`);

    // Log the prediction result using Google Analytics
    await analytics().logEvent('mood_prediction_result', {
      email,
      prediction: mood,
      actual: actualMood,
      isPredictionCorrect,
    });
  };

  const logPredictMoodPress = async () => {
    await analytics().logEvent('predict_mood_press', {
      email,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentDate = new Date();
        const dateId = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
        const uniqueDocId = `${email}_${dateId}`;
        const userRef = firestore().collection(email).doc(uniqueDocId);
        const doc = await userRef.get();

        if (doc.exists) {
          const data = doc.data();
          setSteps(data.steps.toString());
          setSleep(data.sleep);
          setExercise(data.exercise.toString());
          setAlcohol(data.alcohol.toString());
          setActualMood(data.mood);

          setLoading(false); 
        } else {
          setLoading(false); 
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  
  useEffect(() => {
    initialPredictMood();
  }, [loading]);


  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleHelpButtonPress} style={styles.helpButton}>
            <Text style={styles.helpText}>Help</Text>
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>
        </View>        
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            <Text style={styles.text}>Step count: {steps}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your step-count"
              placeholderTextColor="#757575"
              keyboardType="number-pad"
              value={steps}
              onChangeText={handleStepsChange}
            />
            <Text style={styles.text}>Time asleep: {decimalHoursToHoursMinutes(sleep)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={12}
              step={0.25}
              value={sleep}
              onValueChange={handleSleepChange}
            />
            <Text style={styles.text}>Exercise: {exercise} minutes</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount of exercise done in minutes"
              placeholderTextColor="#757575"
              keyboardType="number-pad"
              value={exercise}
              onChangeText={handleExerciseChange}
            />
            <Text style={styles.text}>Alcohol consumed: {alcohol} units</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount of alcohol drank in units"
              placeholderTextColor="#757575"
              keyboardType="number-pad"
              value={alcohol}
              onChangeText={handleAlcoholChange}
            />
            <TouchableOpacity
              style={styles.predictButton}
              onPress={() => {
                logPredictMoodPress();
                predictMood();
              }}
            >
              <Text style={styles.predictButtonText}>Predict Mood</Text>
            </TouchableOpacity>
            <Text style={styles.predictedMoodText}>
              {predictedMood && `According to the previous days of data, your predicted mood is ${predictedMood}`}
            </Text>
            <Text style={styles.moodSummaryText}>
              {moodSummary}
            </Text>                        
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

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE7F6', // Add this line to change the background color
 
    // width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1, // Add this line
  },
  contentWrapper: {
    alignItems: 'center', // Add this line
    justifyContent: 'center', // Add this line
    width: '100%', // Add this line
  },
  text: {
    fontSize: 20,
    margin: 10,
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
    borderRadius: 10, // Add rounded edges
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
  predictButton: {
    backgroundColor: '#3b5998',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: width * 0.6,

  },
  predictButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center', 
  },
  predictedMoodText: {
    marginTop: 20,
    fontSize: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderColor: 'purple',
    borderWidth: 2,
    borderRadius: 10,
    textAlign: 'center',
    marginLeft: 10, 
    marginRight: 10, 
  },
  moodSummaryText: {
    marginTop: 20,
    fontSize: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderColor: 'red',
    borderWidth: 2,
    borderRadius: 10,
    textAlign: 'center',
    marginLeft: 10, 
    marginRight: 10,
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

export default PredictMoodScreen;
