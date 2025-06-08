window.addEventListener('load', () => {
  const connectBtn = document.getElementById('btn-connect');
  const acctDiv    = document.getElementById('current-account');
  let currentAccount;
  let contract;

  // 0) Connect Wallet Handler
  connectBtn.onclick = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }
    try {
      const [acct] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      currentAccount = acct;
      acctDiv.innerText = 'Connected: ' + acct;
      connectBtn.disabled = true;
      await initDApp();
    } catch (err) {
      console.error('User denied account access', err);
      alert('Connection to MetaMask was denied');
    }
  };

  // 1) Initialize Web3, Contract, and Wire Up Forms
  async function initDApp() {
    window.web3 = new Web3(window.ethereum);

    // Load ABI + Network Address
    const response = await fetch('MissingPersons.json'); 
    const json     = await response.json();
    const netId    = Object.keys(json.networks)[0];
    const address  = json.networks[netId].address;
    contract = new web3.eth.Contract(json.abi, address);

    // 2) Register
    document.getElementById('form-register').onsubmit = async e => {
      e.preventDefault();
      try {
        await contract.methods
          .registerUser(e.target.nid.value,
                        e.target.name.value,
                        e.target.addr.value,
                        e.target.role.value)
          .send({ from: currentAccount });
        alert('Registered successfully!');
      } catch (err) {
        console.error(err);
        alert('Registration failed: ' + (err.data?.reason || err.message));
      }
    };

    // 3) Add Missing Person
    document.getElementById('form-add-case').onsubmit = async e => {
      e.preventDefault();
      try {
        await contract.methods
          .addMissingPerson(
            e.target.caseName.value,
            e.target.caseAge.value,
            e.target.caseHeight.value,
            e.target.caseDesc.value,
            e.target.caseDivision.value,
            e.target.caseContact.value
          )
          .send({ from: currentAccount });
        alert('Case added successfully!');
      } catch (err) {
        console.error(err);
        alert('Add case failed: ' + (err.data?.reason || err.message));
      }
    };

    // 4) Assign Investigator
    document.getElementById('form-assign').onsubmit = async e => {
      e.preventDefault();
      try {
        await contract.methods
          .assignInvestigator(
            e.target.assignCaseId.value,
            e.target.assignInvestigator.value
          )
          .send({ from: currentAccount });
        alert('Investigator assigned!');
      } catch (err) {
        console.error(err);
        alert('Assign failed: ' + (err.data?.reason || err.message));
      }
    };

    // 5) Update Status
    document.getElementById('form-update-status').onsubmit = async e => {
      e.preventDefault();
      try {
        await contract.methods
          .updateStatus(
            e.target.updateCaseId.value,
            e.target.updateStatus.value
          )
          .send({ from: currentAccount });
        alert('Status updated!');
      } catch (err) {
        console.error(err);
        alert('Update status failed: ' + (err.data?.reason || err.message));
      }
    };

    // 6) Search by Division
    document.getElementById('form-search').onsubmit = async e => {
      e.preventDefault();
      try {
        const results = await contract.methods
          .searchByDivision(e.target.searchDivision.value)
          .call();
        document.getElementById('search-results').innerText =
          results.length ? results.join(', ') : 'No cases found';
      } catch (err) {
        console.error(err);
        alert('Search failed: ' + err.message);
      }
    };

    // 7) Book Appointment
    document.getElementById('form-book').onsubmit = async e => {
      e.preventDefault();
      try {
        await contract.methods
          .bookAppointment(
            e.target.bookCaseId.value,
            e.target.bookTimeSlot.value
          )
          .send({
            from: currentAccount,
            value: web3.utils.toWei('0.01', 'ether')
          });
        alert('Appointment booked!');
      } catch (err) {
        console.error(err);
        alert('Booking failed: ' + (err.data?.reason || err.message));
      }
    };

    // 8) View Schedule
    document.getElementById('form-schedule').onsubmit = async e => {
      e.preventDefault();
      try {
        const sched = await contract.methods
          .getSchedule(e.target.scheduleInvestigator.value)
          .call();
        document.getElementById('schedule-results').innerText =
          sched.length ? sched.join(', ') : 'No appointments';
      } catch (err) {
        console.error(err);
        alert('Get schedule failed: ' + err.message);
      }
    };
  }
});
