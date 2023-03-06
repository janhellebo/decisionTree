# js-datasets-iris

Package provides the "Iris dataset for javascript

# Install

```bash
npm install js-datasets-iris
```

# Usage

In nodejs 


```javascript
var iris = require('js-datasets-iris')

// == PRITN ROW COUNT == //
console.log(iris.rowCount);

// == PRINT ALL DATA in the format of [[sepalLength, sepalWidth, petalLength, petalWidth, specisies], ...] == //
console.log(iris.data);

// == PRINT the sepalLength == //
console.log(iris.sepalLength);

// == PRINT the sepalWidth == //
console.log(iris.sepalWidth);

// == PRINT the petalLength == //
console.log(iris.petalLength);

// == PRINT the petalWidth == //
console.log(iris.petalWidth);

// == shuffle the data rows in the iris dataset == //
iris.shuffle();

```

In HTML

Include the "node_modules/js-datasets-iris/build/jsiris.min.js" (or "node_modules/js-datasets-iris/src/jsiris.js") in your HTML \<script\> tag

The sample code can be found in the [example.html](https://rawgit.com/chen0040/js-datasets-iris/master/example.html)


