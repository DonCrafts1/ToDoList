var form, titleInput, bodyInput, dateInput, addTaskErrorTxt, taskContainer, taskContainerTxt;
// var test;

//Remember to always use window.onload (wait before finish loading) before initializing any sort of HTML related variables
window.onload = function() {
    taskContainer = document.getElementById("taskcontainer");
    taskContainerTxt = document.getElementById("taskcontainertxt");
    form = document.querySelector("form");
    // test = document.querySelector("#demo")
    titleInput = document.querySelector("#titleInput");
    bodyInput = document.querySelector("#bodyInput");
    dateInput = document.querySelector("#dateInput");
    addTaskErrorTxt = document.getElementById("addtaskerror");
    addTaskErrorTxt.style.opacity = 0;
    dateInput.value = Date.now();
    form.addEventListener("submit", addData);
};

// i = 0;
// function testFunction() {
//     i = i + 1
//     //document.getElementById("demo").innerHTML = i
//     test.innerHTML = i
// }

let db;
const openRequest = window.indexedDB.open("notes_db", 1);

openRequest.addEventListener("error", () => {
    console.error("Database failed to open");
});

openRequest.addEventListener("success", () => {
    console.log("Database opened successfully");
    
    //Store results in db
    db = openRequest.result;
    displayData()
    //Create function to load db data
});

//Set up database tables (if not done/if version number is previous)
openRequest.addEventListener("upgradeneeded", (error) => {
    db = error.target.result;

    //objectStore -> like a table in MySQL (autoincrementing key + data)
    const objectStore = db.createObjectStore("notes_os", {
        keyPath: "id",
        autoIncrement: true
    });

    // Define schema contents
    objectStore.createIndex("title", "title", {unique: false});
    objectStore.createIndex("body", "body", {unique: false});
    objectStore.createIndex("date", "date", {unique: false});
    objectStore.createIndex("completed", "completed", {unique: false});
});

function addData(e){
    console.log("Attempted adding data")
    e.preventDefault();
    if (dateInput.value < Date.now()){
        addTaskErrorTxt.style.opacity = 1;
        addTaskErrorTxt.innerText = "Enter a valid date!";
        console.error("Invalid date");
        return;
    } else if (titleInput.value.length == 0){
        addTaskErrorTxt.style.opacity = 1;
        addTaskErrorTxt.innerText = "Enter a title!";
        console.error("Empty title");
        return;
    }
    addTaskErrorTxt.style.opacity = 0;

    const newEventData = {
        title: titleInput.value,
        body: bodyInput.value,
        date: dateInput.value,
        completed: false
    };

    const DBtransaction = db.transaction(["notes_os"], "readwrite"); // Open r/w db transaction
    const objectStore = DBtransaction.objectStore("notes_os"); // Call database object store
    const addRequest = objectStore.add(newEventData); // Make request to add object to object store

    addRequest.addEventListener("success", () => {
        //Clear form
        titleInput.value = "";
        bodyInput.value = "";
        dateInput.value = Date.now();
    });

    DBtransaction.addEventListener("complete", () => {
        console.log("Transaction completed - DB finished modifying");
        addTaskErrorTxt.style.opacity = 0;
        //addNewTaskDiv(newEventData.title, newEventData.body, newEventData.date, taskId);
        displayData();
    });

    DBtransaction.addEventListener("error", () => {
        console.log("Transaction not opened due to error");
        addTaskErrorTxt.style.opacity = 1;
        addTaskErrorTxt.value = "Something went wrong!";
    });
}

function addNewTaskDiv(titleStr, bodyStr, date, id){
    const taskDiv = document.createElement("div");
    const title = document.createElement("h3");
    const desc = document.createElement("p");
    const taskDate = document.createElement("input");

    //Create div for each task
    taskDiv.appendChild(title);
    taskDiv.appendChild(desc);
    taskDiv.appendChild(taskDate);
    taskContainer.appendChild(taskDiv)

    //Fill content of div
    taskDiv.className = "task";
    title.textContent = titleStr;
    desc.textContent = bodyStr;
    taskDate.type = "datetime-local"
    taskDate.value = date;

    //Set an identifier for each div (for editing/deleting)
    taskDiv.setAttribute("task-id", id);

    const deleteBtn = document.createElement("button");
    taskDiv.appendChild(deleteBtn);
    deleteBtn.textContent = "Delete";

    const editBtn = document.createElement("button");
    taskDiv.appendChild(editBtn);
    editBtn.textContent = "Edit";

    deleteBtn.addEventListener("click", deleteItem)
    //Add savebtn (edit essentially) later

    taskContainerTxt.innerText = "Tasks: ";
}

function displayData(){
    taskContainerTxt.value = "Tasks";

    //Erase existing divs
    let tempList = taskContainer.getElementsByClassName("task");
    tempList = Array.from(tempList);
    tempList.forEach(element => {
        taskContainer.removeChild(element);
    });

    //Get cursor (iterate over all items in db, schema, objectStore notes_os)
    const objectStore = db.transaction("notes_os").objectStore("notes_os")
    var hasElements = false;
    objectStore.openCursor().addEventListener("success", (e) => {
        const cursor = e.target.result;
        if (cursor) { // if there's still data to iterate over
            addNewTaskDiv(cursor.value.title, cursor.value.body, cursor.value.date, cursor.value.id);
            hasElements = true;
            console.log("haselements, ", hasElements);
            cursor.continue();
        } else {
            tempList = taskContainer.getElementsByClassName("task");
            if (!hasElements) {
                //taskContainer.querySelector("task") == null
                taskContainerTxt.innerText = "Empty!";
            }
        }   
    }
)}

function deleteItem(e){
    //get ID of task to delete
    const taskId = Number(e.target.parentNode.getAttribute("task-id"));

    //open database transaction, delete task using ID
    const transaction = db.transaction(["notes_os"], "readwrite");
    const objectStore = transaction.objectStore("notes_os");
    const deleteRequest = objectStore.delete(taskId);

    transaction.addEventListener("complete", () => {
        e.target.parentNode.parentNode.removeChild(e.target.parentNode); //Remove div
        console.log("Task ${nodeId} deleted");
        const tempList = taskContainer.getElementsByClassName("task");
        if (tempList.length == 0){
            taskContainerTxt.innerText = "Empty!";
        }
    });
    
}


