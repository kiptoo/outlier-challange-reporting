require('dotenv').config()
module.exports = {
  test: (process.env.TEST === 'true'),
  testData: [
    { id: 1, course: 'Calculus', grade: 50 },
    { id: 1, course: 'Microeconomics', grade: 43 },
    { id: 1, course: 'Statistics', grade: 50 },
    { id: 1, course: 'Astronomy', grade: 63 },
    { id: 2, course: 'Calculus', grade: 9 },
    { id: 2, course: 'Microeconomics', grade: 11 },
    { id: 3, course: 'Microeconomics', grade: 38 },
    { id: 4, course: 'Philosophy', grade: 79 },
    { id: 4, course: 'Calculus', grade: 1 },
    { id: 4, course: 'Microeconomics', grade: 10 },
    { id: 5, course: 'Microeconomics', grade: 69 },
    { id: 5, course: 'Philosophy', grade: 54 },
    { id: 5, course: 'Statistics', grade: 22 },
    { id: 5, course: 'Calculus', grade: 53 },
    { id: 6, course: 'Calculus', grade: 24 },
    { id: 7, course: 'Microeconomics', grade: 82 },
    { id: 7, course: 'Astronomy', grade: 37 },
    { id: 8, course: 'Statistics', grade: 62 },
    { id: 8, course: 'Calculus', grade: 25 },
    { id: 11, course: 'Calculus', grade: 66 },
    { id: 11, course: 'Philosophy', grade: 15 },
    { id: 11, course: 'Astronomy', grade: 92 },
    { id: 11, course: 'Microeconomics', grade: 30 }
  ]
}
