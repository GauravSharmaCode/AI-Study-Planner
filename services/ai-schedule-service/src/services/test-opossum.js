const CircuitBreaker = require('opossum');

async function testAction(param) {
  throw new Error("Action failed for " + param.name);
}

const breaker = new CircuitBreaker(testAction, { errorThresholdPercentage: 1 });

breaker.fallback(function() {
  console.log("Fallback arguments:", arguments);
  return "fallback result";
});

breaker.fire({ name: "my-param" }).then(res => console.log("Result:", res)).catch(e => console.log("Error:", e));
