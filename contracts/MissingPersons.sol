// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MissingPersons {

    enum Role { ADMIN, REPORTER, INVESTIGATOR }
    enum Status { MISSING, FOUND }
    enum Urgency { LOW, HIGH, MEDIUM }

    struct User {
        string name;
        string nid;
        string homeAddress;
        Role role;
        bool registered;
    }

    struct Person {
        uint caseId;
        string name;
        uint age;
        uint height;
        string description;
        string lastSeenDivision;
        string relativeContact;
        Status status;
        Urgency urgency;
        address reporter;
        address investigator;
    }

    struct Appointment {
        address reporter;
        uint caseId;
        string timeSlot;
        bool exists;
    }

    uint public nextCaseId = 1;

    mapping(address => User) public users;
    mapping(uint => Person) public persons;
    mapping(string => uint[]) public divisionCases;
    mapping(string => mapping(address => Appointment)) public appointments;
    mapping(address => string[]) public investigatorSchedule;

    constructor() {
        users[msg.sender] = User("Admin", "0", "Admin HQ", Role.ADMIN, true);
    }

    modifier onlyRole(Role r) {
        require(users[msg.sender].registered && users[msg.sender].role == r, "Unauthorized");
        _;
    }

    function registerUser(string memory _nid, string memory _name, string memory _address, uint _role) public {
        require(!users[msg.sender].registered, "Already registered");
        require(_role <= uint(Role.INVESTIGATOR), "Invalid role");

        users[msg.sender] = User(_name, _nid, _address, Role(_role), true);
    }

    function addMissingPerson(
        string memory _name,
        uint _age,
        uint _height,
        string memory _description,
        string memory _division,
        string memory _contact
    ) public onlyRole(Role.REPORTER) {
        Urgency urgency = (_age < 18) ? Urgency.HIGH : (_age > 50) ? Urgency.MEDIUM : Urgency.LOW;

        persons[nextCaseId] = Person(
            nextCaseId, _name, _age, _height, _description,
            _division, _contact, Status.MISSING, urgency, msg.sender, address(0)
        );

        divisionCases[_division].push(nextCaseId);
        nextCaseId++;
    }

    function updateStatus(uint caseId, uint newStatus) public onlyRole(Role.ADMIN) {
        require(caseId < nextCaseId, "Invalid case");
        require(newStatus <= uint(Status.FOUND), "Invalid status");
        require(persons[caseId].status == Status.MISSING, "Already FOUND");

        persons[caseId].status = Status(newStatus);
    }

    function assignInvestigator(uint caseId, address investigator) public onlyRole(Role.ADMIN) {
        require(users[investigator].role == Role.INVESTIGATOR, "Not an investigator");
        require(persons[caseId].investigator != investigator, "Already assigned");

        persons[caseId].investigator = investigator;
    }

    function searchByDivision(string memory _division) public view returns (uint[] memory) {
        return divisionCases[_division];
    }

    function bookAppointment(uint caseId, string memory timeSlot) public payable onlyRole(Role.REPORTER) {
        require(msg.value > 0, "Payment required");

        address investigator = persons[caseId].investigator;
        require(investigator != address(0), "Investigator not assigned");
        require(!appointments[timeSlot][investigator].exists, "Slot taken");

        appointments[timeSlot][investigator] = Appointment(msg.sender, caseId, timeSlot, true);
        investigatorSchedule[investigator].push(timeSlot);
    }

    function getSchedule(address investigator) public view returns (string[] memory) {
        return investigatorSchedule[investigator];
    }
}
