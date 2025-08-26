# Changelog

## 2025-08-26 20:42

- Set up Vitest testing framework with comprehensive test suites
- Switch from sqlite3 to better-sqlite3 for synchronous database operations
- Add 50 unit tests covering Cache and LocalStorage APIs
  - Test edge cases including unicode, special characters, and capacity management
  - Test LRU eviction and subscriber patterns
  - Test type conversions for number and boolean values

## 2025-08-26 17:00

- Implement Cache API from @raycast/api
  - Support for synchronous get/set/remove operations 
  - LRU eviction when capacity exceeded
  - Namespace support for command-specific caching
  - Subscriber pattern for cache updates
- Implement LocalStorage API from @raycast/api  
  - Async methods for getItem/setItem/removeItem
  - Support for string, number, and boolean values
  - allItems() method to retrieve all stored values
  - clear() method to remove all values
- Both APIs use SQLite for persistent storage in ~/.termcast.db and ~/.termcast-cache.db