/**
 * **********************************************
 * MARKDOWN RENDER, TOGGLE DISPLAY AND SAVE INPUT
 * **********************************************
 */

/**
 * Initiate the markdown renderer
 * with specified options
 *
 * TODO: Allow user to manually config
 * these options
 */
const converter = new showdown.Converter({
    'simplifiedAutoLink': true,
    'excludeTrailingPunctuationFromURLs': true,
    'strikethrough': true,
    'tables': true,
    'tasklist': true,
    'ghCodeBlocks': true,
    'smoothLivePreview': true,
    'smartIndentationFix': true,
    'simpleLineBreaks': true,
    'openLinksInNewWindow': true,
    'emoji': true
});

/**
 * GitHub-styled markdown to allow
 * tasklists, tables, simple-line-breaks etc.
 */
converter.setFlavor('github');


const renderBox = document.querySelector('.markdown-body');
const textarea = document.querySelector('textarea');
let rawText = localStorage.getItem('rawText');

/**
 * Toggle between renderBox and textarea
 * @param n - If n = 1, display renderBox, else display textarea
 */
const toggleDisplay = (n) => {

    if (n) {
        textarea.classList.remove('nodisplay');
        renderBox.classList.add('nodisplay');
    }

    else {
        textarea.classList.add('nodisplay');
        renderBox.classList.remove('nodisplay');
    }

};

/**
 * Move the textarea caret to the start of the
 * line instead of the last line so that it is visible
 * From https://stackoverflow.com/a/8190890/
 */
const moveCaretToStart = () => {

    if (typeof textarea.selectionStart === 'number') {
        textarea.selectionStart = textarea.selectionEnd = 0;
    }

    else if (typeof textarea.createTextRange !== 'undefined') {
        textarea.focus();
        const range = textarea.createTextRange();
        range.collapse(true);
        range.select();
    }

};

// Main edit function
const edit = () => {

    toggleDisplay(1);
    moveCaretToStart();
    textarea.focus();
    textarea.scrollTop = 0;

};

// Main save function
const save = () => {

    toggleDisplay(0);
    const text = textarea.value;
    const html = converter.makeHtml(text);
    renderBox.innerHTML = html;

    if (html !== converter.makeHtml(rawText)) {
        localStorage.setItem('rawText', text);
        localStorage.setItem('lastEdited', (new Date()));
        rawText = text;
        setHistory();
    }

};

/**
 * @returns Array of history items
 */
const getHistory = () => {

    const rawHistory = localStorage.getItem('history');
    const history = rawHistory === null ? [] : JSON.parse(rawHistory);
    return history;

};

/**
 * Add new history item to history array
 * and then update `history` item in localStorage
 */
const setHistory = () => {

    const history = getHistory();
    const historyItem = {
        'date': (new Date()),
        'text': rawText
    };

    history.unshift(historyItem);
    localStorage.setItem('history', JSON.stringify(history));

};

/**
 *
 * @param {Node} item - History item for which markdown must be rendered
 */
const displayMarkdown = (item) => {

    const text = atob(item.getAttribute('data-text'));
    const mdBody = item.children[1];
    const textarea = item.children[2];
    mdBody.classList.remove('nodisplay');
    textarea.classList.add('nodisplay');
    mdBody.innerHTML = converter.makeHtml(text);

};

/**
 *
 * @param {Node} item - History item for which textarea must be populated with rawtext
 */
const displayTextarea = (item) => {

    const text = atob(item.getAttribute('data-text'));
    const mdBody = item.children[1];
    const textarea = item.children[2];
    mdBody.classList.add('nodisplay');
    textarea.classList.remove('nodisplay');
    textarea.innerHTML = text;

};

/**
 * Main revision history function
 */
const populateHistoryHtml = () => {

    let listElements = '';
    const history = getHistory();
    const length = history.length;

    history.map((item, id) => {
        const parsedDate = new Date(Date.parse(item.date));
        const formattedDate = `${(parsedDate.toDateString()).slice(4)}, ${(parsedDate.toTimeString()).slice(0,8)}`;
        const textBase64 = btoa(item.text); // Save rawtext as base64

        listElements += 
            `<div class='item' data-text='${textBase64}'>
                <div class='label flex'>
                    <div>
                        <p class='id'>#${length - id}</p>
                        <p class='date'>${formattedDate}</p>
                    </div>
                    <div class='noselect'>
                        <div class='button'>
                            <img class='nodrag' src='/assets/svg/bin.svg'/>
                        </div>
                        <div class='button'>
                            <img class='nodrag' src='/assets/svg/view.svg'/>
                        </div>
                    </div>
                </div>
                <div class='markdown-body'></div>
                <textarea class='nodisplay' readonly></textarea>
            </div>`;
    });

    document.querySelector('section.history .list').innerHTML = listElements;

    /**
     * 1. Reverse order the array of `item`s to get in suitable, rawHistory adhering order
     * 2. Render each item's rawtext to markdown and display it
     * 3. Add event listeners to the buttons of the respective elements
     */
    [...document.querySelectorAll('.item')].reverse().map((item, index) => {

        displayMarkdown(item);

        const [deleteButton, viewButton] = item.children[0].children[1].children; // Both variable gets mapped to respective elements

        deleteButton.removeEventListener('click', deleteEventListener);
        viewButton.removeEventListener('click', viewEventListener);

        const deleteEventListener = deleteButton.addEventListener('click', () => {
            history.splice(length - index - 1, 1);
            localStorage.setItem('history', JSON.stringify(history));
            populateHistoryHtml(); // Refresh the Revision History modal with updated content
        });

        const viewEventListener = viewButton.addEventListener('click', () => {
            item.children[2].classList.contains('nodisplay') ? displayTextarea(item) : displayMarkdown(item);
        });

    });

};

/**
 * 1. Get `rawText` from localStorage and populate textarea with it
 * 2. Initiate first `save` to render markdown
 */
(() => {
    textarea.value = rawText === null ? `# Hello, world!\n\nStart editing right now by clicking the *edit* button or pressing <kbd>Ctrl</kbd> + <kbd>X</kbd>.\n\nCheers!` : rawText;
    save();
})();

/**
 * Add event listeners to edit, save and modal buttons
 */
document.querySelector('#edit').addEventListener('click', () => { edit(); }, false);
document.querySelector('#save').addEventListener('click', () => { save(); }, false);
document.querySelector('#lastEdited').addEventListener('click', () => {
    populateHistoryHtml();
    document.querySelector('section.history').classList.remove('nodisplay');
}, false);
document.querySelector('#close').addEventListener('click', () => {
    document.querySelector('section.history').classList.add('nodisplay');
}, false);

/**
 * Capture keystrokes and perform respective functions:
 *
 * Ctrl + S => Save input (`save` function)
 * Ctrl + X => Edit input (`edit` function)
 *
 * Esc => Close Revision History modal
 */
document.addEventListener('keydown', (e) => {
    // Control Key
    if (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey) {
        if (e.keyCode === 83) {
            e.preventDefault();
            save();
        }
        else if (e.keyCode === 88) {
            e.preventDefault();
            edit();
        }
    }
    // Escape key to close Revision History Modal
    else if (e.keyCode === 27) {
        document.querySelector('section.history').classList.add('nodisplay');
    }
}, false);

/**
 * **************************
 * BOTTOM BAR FUNCTIONALITIES
 * **************************
 */

/**
 * Simple time-display function for the bottom bar
 */
const timeDisplay = () => {

    setInterval(function () {

        const today = new Date();
        const day = today.getDate() < 10 ? '0' + today.getDate() : today.getDate();
        const month = (today.getMonth() + 1) < 10 ? '0' + (today.getMonth() + 1) : (today.getMonth() + 1);
        const year = today.getFullYear() < 10 ? '0' + today.getFullYear() : today.getFullYear();

        const hour = today.getHours() < 10 ? '0' + today.getHours() : today.getHours();
        const minute = today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes();
        const seconds = today.getSeconds() < 10 ? '0' + today.getSeconds() : today.getSeconds();

        const output = `${day}/${month}/${year} - ${hour}:${minute}:${seconds}`;

        document.querySelector('#time').innerHTML = output;

    }, 1000);

};
timeDisplay();

/**
 * Last edited: _______
 */
setInterval(() => {
    document.querySelector('#lastEdited').innerHTML = `Last edited: ${timeago().format(Date.parse(localStorage.getItem('lastEdited')))}`;
}, 1000);

/**
 * *********
 * POWERMODE
 * *********
 */

POWERMODE.shake = false; // Disable shaking (too much of a distraction IMO)
POWERMODE.colorful = true;
textarea.addEventListener('input', POWERMODE); // Add POWERMODE function to input.