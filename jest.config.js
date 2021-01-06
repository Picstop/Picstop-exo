module.exports = {
    preset: '@shelf/jest-mongodb',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    verbose: true,
    testPathIgnorePatterns: [
        '/node_modules/',
    ],
};
