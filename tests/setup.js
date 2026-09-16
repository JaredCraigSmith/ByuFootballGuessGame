// BYU Football Guess Game - Test Suite Setup & Initialization
// Ensures network interceptors are active before any test execution.

import { mockNetwork } from './mock-network.js';

// Install interceptor globally immediately upon import
mockNetwork.install();
mockNetwork.setupStandardSupabaseMocks();

export { mockNetwork };
