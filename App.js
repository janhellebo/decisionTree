import React, { useState, useEffect } from 'react';
import DecisionTree from './decision-tree';
import { Text, View, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { trainingData, testData } from './data/treeData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider'
import Icon from "react-native-vector-icons/FontAwesome";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PredictMoodScreen from './PredictMoodScreen';
import { useNavigation } from '@react-navigation/native';
import {generateSummary} from './decision-tree';


const Stack = createStackNavigator();

const HomeScreen = () => {
  const navigation = useNavigation();


  const [steps, setSteps] = useState('');
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState('');
  const [alcohol, setAlcohol] = useState('');
  // const [mood, setMood] = useState(5);
  const [mood, setMood] = useState(null);
  const [syntheticData, setSyntheticData] = useState([]);


  const handleStepsChange = (text) => {
    setSteps(text);
  };

  const handleSleepChange = (value) => {
    setSleep(value);
  };

  const handleWaterChange = (text) => {
    setWater(text);
  };

  const handleAlcoholChange = (text) => {
    setAlcohol(text);
  };

  const handleMoodChange = (value) => {
    setMood(value);
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('steps', steps);
      await AsyncStorage.setItem('sleep', sleep.toString());
      await AsyncStorage.setItem('water', water);
      await AsyncStorage.setItem('alchohol', alcohol);
      await AsyncStorage.setItem('mood', mood.toString());
      alert('Data saved successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  // const getData = async () => {
  //   try {
  //     const value = await AsyncStorage.getItem("@mood_value");
  //     if (value !== null) {
  //       // value previously stored
  //       return value;
  //     }
  //   } catch (e) {
  //     // error reading value
  //   }
  // };


  const generateSyntheticData = (numDays) => {
    const syntheticData = [];
  
    for (let i = 0; i < numDays; i++) {
      const dayData = {
        steps: Math.floor(Math.random() * 20000), // Random step count between 0 and 20000
        sleep: parseFloat((Math.random() * 14).toFixed(1)), // Random hours of sleep between 0 and 14 (with 1 decimal)
        water: parseFloat((Math.random() * 5).toFixed(1)), // Random water intake between 0 and 5 liters (with 1 decimal)
        alcohol: parseFloat((Math.random() * 10).toFixed(1)), // Random alcohol intake between 0 and 10 units (with 1 decimal)
        mood: Math.floor(Math.random() * 3) , // Random mood rating between 0 and 2
      };
      syntheticData.push(dayData);
    }
  
    return syntheticData;
  };

  useEffect(() => {
    // Generate and set the synthetic data when the component mounts
    const allSyntheticData = generateSyntheticData(100);
    setSyntheticData(allSyntheticData);
  }, []);

  const allSyntheticData = generateSyntheticData(100);

  const splitIndex = Math.floor(0.7 * allSyntheticData.length);
  const syntheticTrainData = allSyntheticData.slice(0, splitIndex);
  const syntheticTestData = allSyntheticData.slice(splitIndex);

  
  // Iris
  // var iris = require('js-datasets-iris');

  // //create test dataset
  // var irisTest = new Array();

  // for (let i=0; i<10; i++){
  //   irisTest.push(iris.data[i]);
  //   irisTest.push(iris.data[i+50]);
  //   irisTest.push(iris.data[i+100]);
  // }

  // //create training dataset
  // var irisTrain = new Array();

  // for (let i=0; i<40; i++){
  //   irisTrain.push(iris.data[i+10]);
  //   irisTrain.push(iris.data[i+60]);
  //   irisTrain.push(iris.data[i+110]);
  // }


  //chatGPT
  //converting array of values into array of objects

  // const keys = ["x1", "x2", "x3", "x4", "species"];

  const keys = ["steps", "sleep", "water", "alcohol", "mood"];


  // const irisTestObj = irisTest.map((value) => {
  //   return value.reduce((acc, item, index) => {
  //     acc[keys[index]] = item;
  //     return acc;
  //   }, {});
  // });

  // const irisTrainObj = irisTrain.map((value) => {
  //   return value.reduce((acc, item, index) => {
  //     acc[keys[index]] = item;
  //     return acc;
  //   }, {});
  // });


  //creating tree using training data

  // Iris
  // const model = new DecisionTree('species', ['x1', 'x2', 'x3', 'x4'], irisTrainObj);

  const model = new DecisionTree("mood", ["steps", "sleep", "water", "alcohol"], syntheticTrainData);


  // prints the generated tree
  // console.log('Generated decision tree:')
  // model.printTree()

  //calculating accuracy using test data
  var correct = 0;
  var wrong = 0;

  // Iris
  // for (let i = 0; i < 30; i++){
  //   let X1 = irisTestObj[i]["x1"]
  //   let X2 = irisTestObj[i]["x2"]
  //   let X3 = irisTestObj[i]["x3"]
  //   let X4 = irisTestObj[i]["x4"]
  //   let Y = irisTestObj[i]["species"]

  //   let pred = Object.keys(model.classify({"x1":X1, "x2": X2, "x3":X3, "x4": X4}))

  //   if (pred == Y){
  //     correct++;
  //   }
  //   else {
  //     wrong++;
  //   }
  // }



  for (let i = 0; i < syntheticTestData.length; i++) {
    let steps = syntheticTestData[i]["steps"];
    let sleep = syntheticTestData[i]["sleep"];
    let water = syntheticTestData[i]["water"];
    let alcohol = syntheticTestData[i]["alcohol"];
    let actualMood = syntheticTestData[i]["mood"];

    let predictedMood = Object.keys(model.classify({ "steps": steps, "sleep": sleep, "water": water, "alcohol": alcohol }));

    if (predictedMood == actualMood) {
      correct++;
    } else {
      wrong++;
    }
  }



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

  const input = {
    'step count': 6000,
    'sleep': 6,
    'water consumption': 1.5,
    'alcohol consumption': 2,
  };
  
  const testSummary = model.generateSummary(input);
  console.warn(testSummary);


  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.contentWrapper}>
            <View style={{
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
                  Day {index + 1}: Steps: {data.steps}, Sleep: {data.sleep}, Water: {data.water}, Alcohol: {data.alcohol}, Mood: {data.mood}
                </Text>
              ))}
            </View>
            <Text style={styles.text}>Step count: {steps}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your step-count"
              value={steps}
              onChangeText={handleStepsChange}
              onSubmitEditing={saveData}
            />
            <Text style={styles.text}>Hours of sleep: {sleep}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={14}
              step={1}
              value={sleep}
              onValueChange={handleSleepChange}
              onSlidingComplete={saveData}
            />
            <Text style={styles.text}>Water: {water} litres</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount of water drank in litres"
              value={water}
              onChangeText={handleWaterChange}
              onSubmitEditing={saveData}
            />
            <Text style={styles.text}>Units of alcohol: {alcohol} units</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount of alchol drank in units"
              value={alcohol}
              onChangeText={handleAlcoholChange}
              onSubmitEditing={saveData}
            />
            <Text style={styles.text}>Rate your mood: {mood}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={mood}
              onValueChange={handleMoodChange}
              onSlidingComplete={saveData}
            />    
            <Text style={styles.text}>How are you feeling today?</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "green" }]}
                onPress={() => {
                  setMood("happy");
                  saveData("happy");
                }}
              >
                <Icon name="smile-o" size={60} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "grey" }]}
                onPress={() => {
                  setMood("neutral");
                  saveData("neutral");
                }}
              >
                <Icon name="meh-o" size={60} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "blue" }]}
                onPress={() => {
                  setMood("sad");
                  saveData("sad");
                }}
              >
                <Icon name="frown-o" size={60} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.text}>You selected: {mood}</Text>
          </View>
          <TouchableOpacity style={styles.predictMoodButton} onPress={() => navigation.navigate('PredictMood', { model: model })}>
          <Text style={styles.predictMoodButtonText}>Predict Mood</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={handleSummary}>
           <Text>Mood summary</Text>
          </TouchableOpacity>
          <Text>{summary}</Text> */}
        </ScrollView>
      </View>
    </SafeAreaView>

  
  

  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PredictMood" component={PredictMoodScreen} />
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
});

export default App;