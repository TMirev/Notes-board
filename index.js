const notesContainer = document.querySelector(".notes-container");

const createBtn = document.querySelector(".btn");

let nextOrder = 1;

function sortNotes() {
    const notes = Array.from(notesContainer.querySelectorAll(".input-box"));
    notes.sort((a, b) => {
        const aPinned = a.classList.contains("pinned");
        const bPinned = b.classList.contains("pinned");
        if (aPinned !== bPinned) return bPinned - aPinned; // pinned notes first

        // Keep original "line" order using a persistent data-order attribute.
        const aOrder = parseInt(a.dataset.order || "0", 10);
        const bOrder = parseInt(b.dataset.order || "0", 10);
        return aOrder - bOrder;
    });
    notes.forEach(note => notesContainer.appendChild(note));
}

function ensureNoteOrders() {
    const notes = Array.from(notesContainer.querySelectorAll(".input-box"));
    let maxOrder = 0;

    notes.forEach((note, idx) => {
        // Older saved notes may not have a data-order attribute.
        if (!note.dataset.order) note.dataset.order = String(idx);
        const order = parseInt(note.dataset.order || "0", 10);
        if (!Number.isNaN(order)) maxOrder = Math.max(maxOrder, order);
    });

    nextOrder = maxOrder + 1;
}

function createPinButton() {
    const pinBtn = document.createElement("span");
    pinBtn.className = "pin-btn";
    pinBtn.setAttribute("contenteditable", "false");
    pinBtn.setAttribute("aria-label", "Pin note");
    // Emoji is the most universally recognizable "pinned" sign.
    pinBtn.innerHTML = "📌";
    return pinBtn;
}

function createCompleteButton() {
    const completeBtn = document.createElement("span");
    completeBtn.className = "complete-btn";
    completeBtn.setAttribute("contenteditable", "false");
    completeBtn.setAttribute("aria-label", "Mark note as completed");
    completeBtn.innerHTML = "✔️";
    return completeBtn;
}

function ensurePinButtons() {
    const notes = Array.from(notesContainer.querySelectorAll(".input-box"));
    notes.forEach(note => {
        // Remove old task/checklist icons from previous versions.
        note.querySelectorAll(".checklist-btn, .task-done-btn").forEach(el => el.remove());

        // Ensure delete icon exists (older saved notes might not have it).
        let deleteImg = note.querySelector("img");
        if (!deleteImg) {
            deleteImg = document.createElement("img");
            deleteImg.src = "images/delete.png";
            deleteImg.setAttribute("contenteditable", "false");
            deleteImg.setAttribute("aria-hidden", "true");
            note.appendChild(deleteImg);
        }

        const existingCompleteBtn = note.querySelector(".complete-btn");
        if (!existingCompleteBtn) {
            note.insertBefore(createCompleteButton(), deleteImg || note.firstChild);
        } else {
            existingCompleteBtn.innerHTML = createCompleteButton().innerHTML;
            existingCompleteBtn.setAttribute("contenteditable", "false");
        }

        const existingPinBtn = note.querySelector(".pin-btn");

        // Backward compatibility: older stored notes won't have the pin element,
        // or it might still contain old text instead of the icon.
        if (!existingPinBtn) {
            note.insertBefore(createPinButton(), deleteImg || note.firstChild);
        } else {
            existingPinBtn.innerHTML = createPinButton().innerHTML;
            existingPinBtn.setAttribute("contenteditable", "false");
        }

        // The delete icon is inside the contenteditable note, so make it non-editable too.
        deleteImg.setAttribute("contenteditable", "false");
        deleteImg.setAttribute("aria-hidden", "true");
    });
}

function isNoteEmpty(note) {
    // Ignore pin + delete UI; only check the real user text.
    const clone = note.cloneNode(true);
    clone.querySelectorAll(".pin-btn, .complete-btn, img").forEach(el => el.remove());
    return clone.textContent.trim().length === 0;
}

function placeCaretAtStart(note) {
    note.focus();
    const range = document.createRange();
    range.selectNodeContents(note);
    range.collapse(true); // start of the note
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function showNotes() {
    const storedNotes = localStorage.getItem("notes");

    if (storedNotes) {
        notesContainer.innerHTML = storedNotes;
    }

    ensureNoteOrders();
    ensurePinButtons();
    sortNotes();
    // Persist generated data-order and upgraded controls.
    updateStorage();
}
showNotes();


function updateStorage() {
    localStorage.setItem("notes", notesContainer.innerHTML);

}

createBtn.addEventListener("click", () => {
    let inputBox = document.createElement("p");
    let img = document.createElement("img");
    inputBox.className = "input-box";
    inputBox.setAttribute("contenteditable", "true");
    inputBox.dataset.order = String(nextOrder++);
    img.src = "images/delete.png";
    img.setAttribute("contenteditable", "false");
    img.setAttribute("aria-hidden", "true");
    inputBox.appendChild(img);

    inputBox.insertBefore(createCompleteButton(), img);
    inputBox.insertBefore(createPinButton(), img);

    notesContainer.appendChild(inputBox);

    updateStorage();


})

notesContainer.addEventListener("click", function (e) {
    const completeBtn = e.target.closest ? e.target.closest(".complete-btn") : null;
    if (completeBtn) {
        const note = completeBtn.closest(".input-box");
        if (!note) return;

        note.classList.toggle("completed");
        updateStorage();
        return;
    }

    const pinBtn = e.target.closest ? e.target.closest(".pin-btn") : null;
    if (pinBtn) {
        const note = pinBtn.closest(".input-box");
        if (!note) return;

        note.classList.toggle("pinned");
        sortNotes();
        updateStorage();
        return;
    }

    // If the note is empty and the user clicks the note surface (not icons),
    // move caret to the start so typing starts at the top.
    const clickedNote = e.target.closest ? e.target.closest(".input-box") : null;
    if (clickedNote && e.target.tagName === "P" && isNoteEmpty(clickedNote)) {
        placeCaretAtStart(clickedNote);
        return;
    }

    if (e.target.tagName === "IMG") {
        e.target.parentElement.remove();
        updateStorage();
    }
});

// Persist note edits when the user types.
notesContainer.addEventListener("input", updateStorage);

document.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        document.execCommand("insertLineBreak");
        event.preventDefault();
    }

})

fetch("/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "My first SQL note" })
});

async function loadNotes() {
    const res = await fetch("/api/notes");
    const notes = await res.json();

    const container = document.getElementById("notes");
    container.innerHTML = "";

    notes.forEach(n => {
        const div = document.createElement("div");
        div.className = "note";
        div.textContent = n.text;
        container.appendChild(div);
    });
}

document.getElementById("addBtn").onclick = async () => {
    const text = document.getElementById("noteInput").value;
    if (!text.trim()) return;

    await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });

    document.getElementById("noteInput").value = "";
    loadNotes();
};

loadNotes();

