import React, { useState } from 'react';
import DecisionTree from './decision-tree';
import { Text, View, TextInput, StyleSheet } from 'react-native';
import { trainingData, testData } from './data/treeData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider'


const App = () => {
  
  
  var iris = require('js-datasets-iris');

  // console.log(iris.data);
  // console.warn(trainingData[1]);

  //create test dataset
  var irisTest = new Array();

  for (let i=0; i<10; i++){
    irisTest.push(iris.data[i]);
    irisTest.push(iris.data[i+50]);
    irisTest.push(iris.data[i+100]);
  }

  //create training dataset
  var irisTrain = new Array();

  for (let i=0; i<40; i++){
    irisTrain.push(iris.data[i+10]);
    irisTrain.push(iris.data[i+60]);
    irisTrain.push(iris.data[i+110]);
  }

  // var irisTrain = irisTrain.slice(0, 3);


  //chatGPT
  //converting array of values into array of objects
  const keys = ["x1", "x2", "x3", "x4", "species"];

  const irisTestObj = irisTest.map((value) => {
    return value.reduce((acc, item, index) => {
      acc[keys[index]] = item;
      return acc;
    }, {});
  });

  const irisTrainObj = irisTrain.map((value) => {
    return value.reduce((acc, item, index) => {
      acc[keys[index]] = item;
      return acc;
    }, {});
  });

  // console.log(irisTestObj)
  // console.log(testData)


  //creating tree using training data
  const model = new DecisionTree('species', ['x1', 'x2', 'x3', 'x4'], irisTrainObj);


  // prints the generated tree
  // console.log('Generated decision tree:')
  // model.printTree()

  //calculating accuracy using test data
  var correct = 0;
  var wrong = 0;

  for (let i = 0; i < 30; i++){
    let X1 = irisTestObj[i]["x1"]
    let X2 = irisTestObj[i]["x2"]
    let X3 = irisTestObj[i]["x3"]
    let X4 = irisTestObj[i]["x4"]
    let Y = irisTestObj[i]["species"]

    let pred = Object.keys(model.classify({"x1":X1, "x2": X2, "x3":X3, "x4": X4}))

    if (pred == Y){
      correct++;
    }
    else {
      wrong++;
    }
  }

  // console.warn(correct);
  // console.warn(wrong);
  // console.warn(correct / (correct + wrong));

  result = correct / (correct + wrong);


  const [steps, setSteps] = useState('');
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [mood, setMood] = useState(5);


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

  // <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>

  return (
    <View style={styles.container}>
      <View style={{
                    borderWidth: 2, borderColor: 'blue',
                    borderRadius: 10, backgroundColor: 'white',
                    padding: 5}}>
        <Text>
        Number of training data: {irisTrain.length}. There were {correct} correct answers and {wrong} wrong answers.
          The accuracy is: {result}
        </Text>
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
    </View>
  
  

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default App;