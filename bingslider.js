// import React, { useState } from 'react';
// import { TextInput} from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Slider from '@react-native-community/slider'

// const App = () => {
//   // Create state variables for input value and slider value
//   const [name, setName] = useState('');
//   const [rating, setRating] = useState(5);

//   // Create functions to handle input change and slider change
//   const handleNameChange = (text) => {
//     setName(text);
//   };

//   const handleRatingChange = (value) => {
//     setRating(value);
//   };

//   // Create a function to save data to AsyncStorage
//   const saveData = async () => {
//     try {
//       await AsyncStorage.setItem('name', name);
//       await AsyncStorage.setItem('rating', rating.toString());
//       alert('Data saved successfully!');
//     } catch (error) {
//       alert(error.message);
//     }
//   };

//   return (
//     <>
//       <TextInput
//         placeholder="Enter your name"
//         value={name}
//         onChangeText={handleNameChange}
//         onSubmitEditing={saveData}
//       />
//       <Slider
//         minimumValue={1}
//         maximumValue={10}
//         step={1}
//         value={rating}
//         onValueChange={handleRatingChange}
//         onSlidingComplete={saveData}
//       />
//     </>
//   );
// };

// export default App;