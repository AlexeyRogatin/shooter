module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useDefineForClassFields: true,
        experimentalDecorators: false,
      },
    ],
  },
  moduleFileExtensions: ["ts", "js"],
};
