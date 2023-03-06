var expect    = require("chai").expect;
var jsIris = require("../src/jsiris");

describe("Examine the data in iris dataset", function() {
  describe("examine data structures", function() {
    
    it("has row count of 150", function() {
        
        expect(jsIris.rowCount).to.equal(150);
        expect(jsIris.data.length).to.equal(150);
        expect(jsIris.petalLength.length).to.equal(150);
        expect(jsIris.petalWidth.length).to.equal(150);
        expect(jsIris.sepalLength.length).to.equal(150);
        expect(jsIris.sepalWidth.length).to.equals(150);
        expect(jsIris.species.length).to.equals(150);
    });

    it("can print out some values after shuffle", function(){
        jsIris.shuffle();
        console.log(jsIris.petalLength);
        console.log(jsIris.species);
        console.log(jsIris.speciesClasses);
    });
  });
});