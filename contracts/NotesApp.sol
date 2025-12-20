// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NotesApp {
    // here's where all your secret notes live
    struct Note {
        address owner;  // who wrote this (only they can decrypt it)
        string title;   // note title
        bytes32 encryptedContent; // encrypted content (looks like garbage but it's not!)
        string tags;    // tags separated by comma, like "work, personal, ideas"
        bool isFavourite; // star or no star
        uint256 createdAt;  // when it was created
        uint256 updatedAt;  // last time it was edited
        bool exists;    // deleted or not (soft delete, cuz blockchain never forgets)
    }

    // each address has its own array of notes
    mapping(address => Note[]) public userNotes;
    // note counter (just in case we need it)
    mapping(address => uint256) public noteCount;

    // events for frontend so it knows what's happening
    event NoteCreated(address indexed owner, uint256 indexed noteId, string title);
    event NoteUpdated(address indexed owner, uint256 indexed noteId, string title);
    event NoteDeleted(address indexed owner, uint256 indexed noteId);
    event NoteFavouriteToggled(address indexed owner, uint256 indexed noteId, bool isFavourite);

    // create a new note (gotta sign the transaction)
    function createNote(
        string memory title,
        bytes32 encryptedContent,
        string memory tags,
        bytes calldata /* attestation */
    ) external {
        require(bytes(title).length > 0, "Title required");
        require(encryptedContent != bytes32(0), "Content required");

        uint256 noteId = userNotes[msg.sender].length;
        userNotes[msg.sender].push(Note({
            owner: msg.sender,
            title: title,
            encryptedContent: encryptedContent,
            tags: tags,
            isFavourite: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        }));

        noteCount[msg.sender]++;
        emit NoteCreated(msg.sender, noteId, title);
    }

    // edit an existing note
    function updateNote(
        uint256 noteId,
        string memory title,
        bytes32 encryptedContent,
        string memory tags,
        bytes calldata /* attestation */
    ) external {
        require(noteId < userNotes[msg.sender].length, "Note does not exist");
        require(userNotes[msg.sender][noteId].exists, "Note deleted");
        require(userNotes[msg.sender][noteId].owner == msg.sender, "Not your note");

        userNotes[msg.sender][noteId].title = title;
        userNotes[msg.sender][noteId].encryptedContent = encryptedContent;
        userNotes[msg.sender][noteId].tags = tags;
        userNotes[msg.sender][noteId].updatedAt = block.timestamp;

        emit NoteUpdated(msg.sender, noteId, title);
    }

    // delete a note (actually just mark it as deleted, cuz blockchain)
    function deleteNote(uint256 noteId) external {
        require(noteId < userNotes[msg.sender].length, "Note does not exist");
        require(userNotes[msg.sender][noteId].exists, "Note already deleted");
        require(userNotes[msg.sender][noteId].owner == msg.sender, "Not your note");

        userNotes[msg.sender][noteId].exists = false;
        noteCount[msg.sender]--;

        emit NoteDeleted(msg.sender, noteId);
    }

    // toggle the star (add/remove from favorites)
    function toggleFavourite(uint256 noteId) external {
        require(noteId < userNotes[msg.sender].length, "Note does not exist");
        require(userNotes[msg.sender][noteId].exists, "Note deleted");
        require(userNotes[msg.sender][noteId].owner == msg.sender, "Not your note");

        userNotes[msg.sender][noteId].isFavourite = !userNotes[msg.sender][noteId].isFavourite;
        
        emit NoteFavouriteToggled(msg.sender, noteId, userNotes[msg.sender][noteId].isFavourite);
    }

    // get all notes for a user (for frontend)
    function getUserNotes(address user) external view returns (Note[] memory) {
        return userNotes[user];
    }

    // get a specific note by ID
    function getNote(address user, uint256 noteId) external view returns (Note memory) {
        require(noteId < userNotes[user].length, "Note does not exist");
        return userNotes[user][noteId];
    }

    // how many notes does user have (might be useful)
    function getUserNoteCount(address user) external view returns (uint256) {
        return noteCount[user];
    }
}

