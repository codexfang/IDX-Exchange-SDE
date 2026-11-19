// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// The suites render whole pages and some of them wait on several async updates.
// Jest's 5s default is tight when every worker wants CPU at once, which showed up
// as random "Exceeded timeout of 5000 ms" failures in the full run while each
// suite passed on its own. Raising the ceiling keeps the assertions unchanged.
jest.setTimeout(15000);
