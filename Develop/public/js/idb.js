// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget-tracker' set it to version 1
const request = indexedDB.open('budget-tracker', 1);

// this event will emit if the database version changes(nonexistent to version 1, v1 to v2, etc)
request.onupgradeneeded = function (event) {
  //save a reference to the database
  db.createObjectStore('new_expense', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if an app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budget and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new-expense'], 'readwrite');

    // access the object store for 'new_budget
    const budgetObjectStore = transaction.objectStore('new_expense');

    // add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadBudget() {
    // open a transaction on your pending db
    const transaction = db.transaction(['new_expense'], 'readwrite');

    // access your pending object store
    const budgetObjectStore = transaction.objectStore('new_expense');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function(){
        // if there was data in indexedDB's store, let's send it to the api server
        if(getAll.result.length > 0){
            fetch('api/expenses', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse)
                }

                const transaction = db.transaction(['new_expense'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_expense');
                // clear all items in your store
                budgetObjectStore.clear();
            })
            .catch(err => {
                // set reference to redirect back here
                console.log(err)
            })
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadBudget);
