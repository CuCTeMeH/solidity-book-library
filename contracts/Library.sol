pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface LibraryInterface {
    function addBook(string memory _name, uint _copies) external;
    function removeBook(uint _bookId) external;
    function addCopies(uint _bookId, uint _copies) external;

    function getBookDetail(uint _bookId) external view returns (string memory, uint);
    function borrowBook(uint _bookId) external payable;
    function returnBook(uint _bookId) external;
    function getAllAvailableBooks() external view returns (uint[] memory);
    function getOwnerHistory(uint _bookId) external view returns (address[] memory);
}

contract Library is Ownable {
    uint private bookFee = 0.001 ether;

    struct Book {
        string name;
        uint256 availableCopies;
        uint256 ownerCount;
        mapping(uint256 => address) ownersHistory;
    }

    // Owner events.
    event NewBook(uint _bookId, string _name, uint _copies);
    event AddCopies(uint _bookId, uint _copies);
    event RemoveBook(uint _bookId, string _bookName);
    event Withdraw(address to, bool full, uint amount);

    // User events.
    event BorrowBook(address _borrower, uint _bookId, string _bookName, uint _availableCopies);
    event ReturnBook(address _borrower, uint _bookId, string _bookName, uint _availableCopies);

    mapping(uint => Book) private BookLedger;

    uint public bookCount;

    mapping(string => bool) private bookInLibrary;
    mapping(address => mapping(uint => bool)) private borrowedBooksPerUser;

    function setBookFee(uint _fee)
        external
        onlyOwner
    {
        bookFee = _fee;
    }

    modifier bookNotExists(string memory _name) {
        require(!bookInLibrary[_name], "Book Is Already In Library");
        _;
    }

    function addBook(string memory _name, uint _copies)
        external
        onlyOwner
        bookNotExists(_name)
    {
        require(bytes(_name).length != 0, "Name cannot be empty");
        bookInLibrary[_name] = true;
        uint _bookId = bookCount++;
        Book storage book = BookLedger[_bookId+1];
        book.name = _name;
        book.availableCopies = _copies;

        emit NewBook(_bookId, _name, _copies);
    }

    function removeBook(uint _bookId)
        external
        onlyOwner
    {
        Book storage book = BookLedger[_bookId];
        require(bytes(book.name).length != 0, "Book does not exist");
        delete BookLedger[_bookId];
        delete bookInLibrary[book.name];
        bookCount--;

        emit RemoveBook(_bookId, book.name);
    }

    function addCopies(uint _bookId, uint _copies)
        external
        onlyOwner
    {
        require(_copies > 0, "cannot add 0 copies");
        Book storage book = BookLedger[_bookId];
        require(bytes(book.name).length != 0, "Book does not exist");
        book.availableCopies++;

        emit AddCopies(_bookId, _copies);
    }

    function borrowBook(uint _bookId)
        external
        payable
    {
        require(msg.value == bookFee);
        require(!borrowedBooksPerUser[msg.sender][_bookId], "Book is already borrowed");
        borrowedBooksPerUser[msg.sender][_bookId] = true;
        Book storage book = BookLedger[_bookId];
        require(book.availableCopies-1 >= 0);
        book.availableCopies--;
        book.ownersHistory[book.ownerCount] = msg.sender;
        book.ownerCount++;

        emit BorrowBook(msg.sender, _bookId, book.name, book.availableCopies);
    }

    function returnBook(uint _bookId)
        external
    {
        require(borrowedBooksPerUser[msg.sender][_bookId], "Book is not borrowed");
        Book storage book = BookLedger[_bookId];
        book.availableCopies++;
        borrowedBooksPerUser[msg.sender][_bookId] = false;

        emit ReturnBook(msg.sender, _bookId, book.name, book.availableCopies);
    }

    function getAllAvailableBooks()
        external
        view
        returns (uint[] memory)
    {
        uint currentIndex = 0;
        for (uint index = 0; index <= bookCount; index++) {
            if (!borrowedBooksPerUser[msg.sender][index] && BookLedger[index].availableCopies > 0) {
                currentIndex++;
            }
        }
        uint[] memory result = new uint[](currentIndex);
        currentIndex = 0;
        for (uint index = 0; index <= bookCount; index++) {
            if (!borrowedBooksPerUser[msg.sender][index] && BookLedger[index].availableCopies > 0) {
                result[currentIndex] = index;
                currentIndex++;
            }
        }
        return result;
    }

    function getOwnerHistory(uint _bookId)
        external
        view
        returns (address[] memory)
    {
        address[] memory result = new address[](BookLedger[_bookId].ownerCount);
        for (uint index = 0; index < result.length; index++) {
            result[index] = BookLedger[_bookId].ownersHistory[index];
        }
        return result;
    }

    function getBookDetail(uint _bookId)
        external
        view
        returns (string memory, uint)
    {
        return (BookLedger[_bookId].name, BookLedger[_bookId].availableCopies);
    }

    function withdraw(address payable to, bool full, uint amount)
        external
        onlyOwner
    {
        if (full == true) {
            amount = address(this).balance;
        }

        to.transfer(amount);

        emit Withdraw(to, full, amount);
    }
}
