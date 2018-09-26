const presets = [
  ["@babel/env", {
    targets: {
      edge: "16",
      firefox: "61",
      chrome: "67",
      safari: "10",
      ie: "11"
    },
    useBuiltIns: "usage"
    
  }]
];

module.exports = { presets };