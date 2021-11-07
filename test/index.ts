import { Contract } from "@ethersproject/contracts";
import {expect} from "chai";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe("Library", function () {
  let library: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;

  beforeEach(async function () {
    const Library = await ethers.getContractFactory("Library");
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    library = await Library.deploy();
    await library.deployed();
  });

  it("Adding a book with empty name", async function () {
    await expect(library.addBook("", 1))
        .to.be.revertedWith('Name cannot be empty');
  });

  it("Only Owner can add a book", async function () {
    expect(await library.addBook("test book", 1))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 1)

    expect(await library.addBook("test book 2", 2))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book 2", 2)

    expect(await library.bookCount())
        .to.equal(2)

    let bookIds = await library.getAllAvailableBooks();
    expect(bookIds[0]).to.equal(1);
    expect(bookIds[1]).to.equal(2);

    await expect(library.connect(addr1).addBook("test book", 1))
        .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("Only Owner can add copies of a book", async function () {
    expect(await library.addBook("test book", 1))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 1)

    expect(await library.addCopies(1, 2))
        .to.emit(library, 'AddCopies')
        .withArgs(1, 2)

    let bookDetails = await library.getBookDetail(1)
    expect(bookDetails[0]).to.equal("test book");
    expect(bookDetails[1]).to.equal(2);

    await expect(library.connect(addr1).addCopies(1, 2))
        .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("Owner should not be able to add same book twice", async function () {
    expect(await library.addBook("test book", 1))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 1)

    await expect(library.addBook("test book", 1))
        .to.be.revertedWith('Book Is Already In Library');
  });

  it("Users can borrow books by ID", async function () {
    expect(await library.addBook("test book", 1))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 1)

    expect(await library.connect(addr1).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr1.address, 1, "test book", 0)
  });

  it("Users cannot borrow a book with 0 copies", async function () {
    expect(await library.addBook("test book", 0))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 0)

    // not sure how to gracefully handle this panic 0.o.
    // Probably we must safe arithmetics in the code by using something like:
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol
    // Didn't want to include any extra libs in the project.
    // Only the one for ownership since it was mentioned it is okay to use in the zombies tutorial.
    await expect(library.connect(addr1).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.be.revertedWith('panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)');
  });

  it("Users can return books", async function () {
    expect(await library.addBook("test book", 2))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 2)

    expect(await library.connect(addr1).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr1.address, 1, "test book", 1)

    expect(await library.connect(addr1).returnBook(1))
        .to.emit(library, 'ReturnBook')
        .withArgs(addr1.address, 1, "test book", 2)
  });

  it("Users cannot borrow more than 1 copy of a book", async function () {
    expect(await library.addBook("test book", 2))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 2)

    expect(await library.connect(addr1).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr1.address, 1, "test book", 1)


    await expect(library.connect(addr1).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.be.revertedWith('Book is already borrowed');
  });

  it("See all book borrowers addresses", async function () {
    expect(await library.addBook("test book", 3))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 3)

    expect(await library.connect(addr1).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr1.address, 1, "test book", 2)

    expect(await library.connect(addr2).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr2.address, 1, "test book", 1)

    let expectedAddresses = [addr1.address, addr2.address];
    expect(await library.getOwnerHistory(1)).to.be.deep.equal(expectedAddresses);
  });

  it("Owner can withdraw full amount from contract to address", async function () {
    expect(await library.addBook("test book", 3))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 3)

    expect(await library.connect(addr1).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr1.address, 1, "test book", 2)

    expect(await library.connect(addr2).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr2.address, 1, "test book", 1)

    let expectedAmount = await addr3.getBalance()
    expect(expectedAmount.toString()).to.be.equal('10000000000000000000000')

    expect(await library.withdraw(addr3.address, true, 0))
        .to.emit(library, 'Withdraw')
        .withArgs(addr3.address, true, 2000000000000000)

    let expectedAmount2 = await addr3.getBalance()
    expect(expectedAmount2.toString()).to.be.equal("10000002000000000000000")
  });

  it("Owner can withdraw some amount from contract to address, but not full", async function () {
    expect(await library.addBook("test book", 3))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 3)

    expect(await library.connect(addr1).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr1.address, 1, "test book", 2)

    expect(await library.connect(addr2).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr2.address, 1, "test book", 1)

    let expectedAmount = await addr3.getBalance()
    expect(expectedAmount.toString()).to.be.equal('10000002000000000000000')

    expect(await library.withdraw(addr3.address, false, 1000000000000000))
        .to.emit(library, 'Withdraw')
        .withArgs(addr3.address, false, 1000000000000000)

    let expectedAmount2 = await addr3.getBalance()
    expect(expectedAmount2.toString()).to.be.equal('10000003000000000000000');
  });

  it("Users cannot withdraw from contract", async function () {
    expect(await library.addBook("test book", 3))
        .to.emit(library, 'NewBook')
        .withArgs(BigNumber, "test book", 3)

    expect(await library.connect(addr1).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr1.address, 1, "test book", 2)

    expect(await library.connect(addr2).borrowBook(1, {
      value: ethers.utils.parseEther('0.001'),
    }))
        .to.emit(library, 'BorrowBook')
        .withArgs(addr2.address, 1, "test book", 1)

    await expect(library.connect(addr3).withdraw(addr3.address, false, 1000000000000000))
        .to.be.revertedWith('Ownable: caller is not the owner');
  });
});
