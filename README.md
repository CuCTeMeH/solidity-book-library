# Project requirements
Develop a contract for book library:
- The administrator (owner) of the library should be able to add new books and the number of copies in the library.
- The administrator should not be able to add the same book twice.
- Users should be able to see the available books and borrow them by their id.
- Users should be able to return books.
- A user should not borrow more than one copy of a book at a time. The users should not be able to borrow a book more times than the copies in the libraries unless copy is returned.
- Everyone should be able to see the addresses of all people that have ever borrowed a given book.

# Project test coverage
```
--------------|----------|----------|----------|----------|----------------|
File          |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
--------------|----------|----------|----------|----------|----------------|
contracts/    |    91.11 |       75 |    81.82 |    87.27 |                |
Library.sol   |    91.11 |       75 |    81.82 |    87.27 |... 78,79,80,82 |
--------------|----------|----------|----------|----------|----------------|
All files     |    91.11 |       75 |    81.82 |    87.27 |                |
--------------|----------|----------|----------|----------|----------------|
```

# Project Tests
 To run project tests first run:
```
npm install
```
after that to run the tests execute:
```
npx hardhat test
```
 You should see:
```
  Library
    ✓ Adding a book with empty name (40ms)
    ✓ Only Owner can add a book (96ms)
    ✓ Only Owner can add copies of a book (57ms)
    ✓ Owner should not be able to add same book twice (43ms)
    ✓ Users can borrow books by ID (41ms)
    ✓ Can we borrow book with 0 copies
    ✓ Users can return books (48ms)
    ✓ Users cannot borrow more than 1 copy of a book (43ms)
    ✓ See all book borrowers addresses (49ms)
    ✓ Owner can withdraw full amount from contract to address (55ms)
    ✓ Owner can withdraw some amount from contract to address, but not full (52ms)
    ✓ Users cannot withdraw from contract (56ms)

  12 passing (2s)
```
# Other
 Project uses Github actions to run the tests on PRs and master branch commits.