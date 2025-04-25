# FoundFund Tests

This directory contains tests for the FoundFund application. The tests are organized by API endpoint and functionality.

## Test Structure

- `__tests__/setup.ts`: Sets up the test environment, including an in-memory MongoDB server
- `__tests__/api/campaigns/`: Tests for campaign-related APIs
- `__tests__/api/contributions/`: Tests for contribution-related APIs
- `__tests__/api/users/`: Tests for user-related APIs
- `__tests__/api/upload/`: Tests for file upload API

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode (useful during development):

```bash
npm run test:watch
```

To run tests with coverage report:

```bash
npm run test:coverage
```

To run a specific test file:

```bash
npm test -- __tests__/api/campaigns/campaigns.test.ts
```

## Test Coverage

The tests cover the following functionality:

1. **Campaigns**
   - Creating a new campaign
   - Retrieving all campaigns
   - Filtering campaigns by creator, category, etc.
   - Retrieving a specific campaign by ID
   - Updating a campaign

2. **Contributions**
   - Making a contribution to a campaign
   - Retrieving all contributions
   - Filtering contributions by user, campaign, etc.
   - Verifying that campaign funding amounts are updated

3. **Users**
   - Creating a new user
   - Retrieving all users
   - Filtering users by username, email, etc.
   - Validating user data

4. **File Upload**
   - Uploading image files
   - Validating file types and sizes
   - Handling error cases

## Adding New Tests

When adding new functionality to the application, please add corresponding tests following the existing patterns. Each test file should:

1. Import the necessary modules and functions
2. Set up mock data
3. Test both successful and error cases
4. Clean up after tests

## Mocking

The tests use Jest's mocking capabilities to mock:

- MongoDB (using mongodb-memory-server)
- File system operations
- FormData and File objects for upload tests

This allows tests to run quickly and without side effects.
