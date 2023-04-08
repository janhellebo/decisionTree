import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal, TouchableWithoutFeedback } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import DecisionTree from './decision-tree';
import analytics from '@react-native-firebase/analytics';



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

  const { email, model } = route.params;




  const predictMood = (updateState = true) => {
    if (steps !== '' && exercise !== '' && alcohol !== '') {
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
    setPredictedMood(`${mood} (prediction ${isPredictionCorrect ? 'correct' : 'incorrect'})`);

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
          <TouchableOpacity onPress={toggleHelpModal} style={styles.helpButton}>
            <Text style={styles.helpText}>Help</Text>
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>
        </View>        
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.contentWrapper}>
            <Text style={styles.text}>Step count: {steps}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your step-count"
              value={steps}
              onChangeText={handleStepsChange}
            />
            <Text style={styles.text}>Hours of sleep: {sleep}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={14}
              step={0.25}
              value={sleep}
              onValueChange={handleSleepChange}
            />
            <Text style={styles.text}>Exercise: {exercise} minutes</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount of exercise done in minutes"
              value={exercise}
              onChangeText={handleExerciseChange}
            />
            <Text style={styles.text}>Units of alcohol: {alcohol} units</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount of alchol drank in units"
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
              {predictedMood && `According to your previous days of data, your predicted mood is ${predictedMood}`}
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
    width: 200,
    height: 40,
  },
  input: {
    width: 300,
    height: 40,
    borderColor: 'black',
    borderWidth: 1, 
    borderRadius: 10, // Add rounded edges
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
  predictButton: {
    backgroundColor: '#3b5998',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  predictButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  predictedMoodText: {
    marginTop: 20,
    fontSize: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderColor: 'purple',
    borderWidth: 2,
    borderRadius: 5,
    textAlign: 'center',
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
