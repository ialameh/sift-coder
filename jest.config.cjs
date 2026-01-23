module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        astTransformers: {
          before: [
            'ts-jest/dist/legacy-compiler/transformers/import-meta-downlevel-async'
          ]
        },
        tsconfig: {
          target: 'ES2022',
          module: 'ES2022',
          moduleResolution: 'node',
          noUnusedLocals: false,
          noUnusedParameters: false
        }
      }
    ]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
