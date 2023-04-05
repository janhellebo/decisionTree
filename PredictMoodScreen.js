import React, { useState } from 'react';
import { Text, View, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';

const PredictMoodScreen = ({ route }) => {
  const navigation = useNavigation();

  const [steps, setSteps] = useState('');
  const [sleep, setSleep] = useState(7);
  const [exercise, setExercise] = useState('');
  const [alcohol, setAlcohol] = useState('');

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

  const { model } = route.params;

  const predictMood = () => {
    // const prediction = model.classify({ "steps": steps, "sleep": sleep, "water": water, "alcohol": alcohol });
    const prediction = model.classify({
        "steps": parseFloat(steps),
        "sleep": sleep,
        "exercise": parseFloat(exercise),
        "alcohol": parseFloat(alcohol)
      }); 
    const predictedMood = Object.keys(prediction)[0];
    alert(`Predicted mood: ${predictedMood}`);
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
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
              onPress={predictMood}
            >
              <Text style={styles.predictButtonText}>Predict Mood</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
});

export default PredictMoodScreen;
