const publicJeopardyAPI = "https://jeo.letz.dev/api/";
const numberOfCluesPerCategory = 5;
const numberOfCategories = 6;
/**
 * Data Format of gameData
 * Ordered Array of Objects
 * {id, title, clues_count, clues : [numberOfCluesPerCategory]}
 */
let gameData = [];

/**
 * Updates the Array gameData with a shuffled/spliced amount of categories (Category title and ID's) as queried from the API. 
 * @param {Number} amountofCategories - Amount of Categories to query the API for.
 * @return {void} Any exception will be printed in console.
 */
const getCategoryIds = amountofCategories => {
    return axios.get(publicJeopardyAPI + "categories", {
        headers: { 'Content-Type': 'application/json' },
        params: { count: amountofCategories }
    }).then(response => { return _.sampleSize(response.data.categories, numberOfCategories) }
    ).catch(exception => { console.log(exception) });
}

/**
 * Updates the Array provided with a shuffled/spliced amount of clues (questions and answers) along with the question ID as queried from the API. 
 * @param {Number} categoryId - ID of category queried previously from getCategoryIds.
 * @return {void} Any exception will be printed in console.
 */
const getCategory = categoryId => {
    // return axios.get(publicJeopardyAPI + "category", {
    return axios.get(publicJeopardyAPI + "details/" + categoryId, {
        headers: { 'Content-Type': 'application/json' },
        // params: { id: +categoryId }
    }).then(response => _.sampleSize(
        response.data.details[+categoryId].clues.map(cluesDataObject =>
            [cluesDataObject.id, cluesDataObject.question, cluesDataObject.answer]),
        numberOfCluesPerCategory)
    ).catch(exception => { console.log(exception) });
}

/**
 * Updates the DOM to show the game board with Jeopardy Answers/Questions as well as the top divider bar.
 * Data values are also labeled for each element, providing the specific question ID which was saved from the API.
 * Furthermore, additional click event listeners are added per cell in the table for the intended result during gameplay.
 * Additional analysis for the game data can be done with command "console.log(gameData)".
 * @return {void}
 */
const fillTable = () => {
    $(".spinner").remove();
    $("#gameControlStartandRestart").attr({
        class: "restartGame",
        value: "restart"
    });

    const game = $("div.gameBoard");

    // Top bar styling to implement a style which complements the game board, similar to actual Game Show.
    const tableTableTop = $("<table>")
        .addClass("jeopardyGameTop")
        .appendTo($(game));

    const tableTop = $("<tr>").appendTo($(tableTableTop));

    // CSS Styling and Layout - Additional Divider used to separate the Control Form and Game Title from Game Board
    for (let i = 0; i !== 29; i++)
        $("<th>").addClass("topbar").appendTo($(tableTop));

    //Extra line to add more space between top bar and actual game board
    $("<br>").appendTo($(game));

    const gameGridBoard = $("<table>")
        .addClass("jeopardyGame")
        .appendTo($(game));

    const trCategories = $("<tr>").appendTo($(gameGridBoard));
    const thCategories = [];

    //Create Categories Row and apply CSS styling
    do
        if (!thCategories.length)
            thCategories.push($("<th>").attr({ "class": "first" }));
        else if (thCategories.length === numberOfCategories - 1)
            thCategories.push($("<th>").attr({ "class": "last" }));
        else
            thCategories.push($("<th>").addClass("jeopardyCategory"));
    while (thCategories.length !== numberOfCategories);

    thCategories.forEach((elementIndex, currentCategoryIndex) =>
        $(elementIndex)
            //CSS Styling
            .addClass("jeopardyCategory")

            //Add to Categories Row
            .appendTo($(trCategories))

            //Set Text to current Category 
            .text(gameData[currentCategoryIndex].title)

            //"data-" Additional Data Labels for Debugging grid
            .attr({
                "data-Jeopardy-Category-ID": gameData[currentCategoryIndex].id,
                "data-Jeopardy-Category-Title": gameData[currentCategoryIndex].title
            })
    );

    for (let clueIndex = 0; clueIndex !== numberOfCluesPerCategory; clueIndex++) {
        //Create new rows
        const trRow = $("<tr>").appendTo($(gameGridBoard));
        const thRowQuestions = [];

        //Styling - Add CSS Border padding class
        do
            if (!thRowQuestions.length)
                //CSS style to retain Left Border Width
                thRowQuestions.push($("<td>").attr({ "class": "first" }));
            else if (thRowQuestions.length === numberOfCluesPerCategory)
                //CSS style to retain Right Border Width
                thRowQuestions.push($("<td>").attr({ "class": "last" }));
            else
                thRowQuestions.push($("<td>"));
        while (thRowQuestions.length !== numberOfCluesPerCategory + 1);

        //Variables used:
        //clueIndex = Current Index to access Number of Clues Index Array within the gameData Object.
        //elementIndex = Element Object on currently selected row
        //columnIndex = Current Index of column on row
        thRowQuestions.forEach((elementIndex, columnIndex) => {
            $(elementIndex).appendTo($(trRow))

                //CSS style to retain Bottom Border
                .addClass(numberOfCategories - 2 === clueIndex ? "bottom" : undefined)

                //Extra information (for debugging)
                .attr({
                    "data-Jeopardy-Question-ID": gameData[columnIndex].clues[clueIndex][0],
                    "data-Jeopardy-Question-Title": gameData[columnIndex].title
                })

                //Question Mark Icon from Font Awesome
                .append($("<i>").addClass("fa-solid fa-question fa-2xl"))

                //First Click - Provide 'Answer'
                .on("click", () => $(elementIndex).html(gameData[columnIndex].clues[clueIndex][1])

                    //Second Click - Provide 'Question'
                    .on("click", () => $(elementIndex)
                        .attr({ "id": "itemProgressionQuestion" })
                        .html(gameData[columnIndex].clues[clueIndex][2])
                    )
                )
        });
    }

    //append the game object to the main div.
    $(gameGridBoard).appendTo($(game));

    //Finally, enable the click again.
    $("#gameControlStartandRestart").on("click", (event) => {
        event.preventDefault();
        //Disable click to prevent async from creating multiple the game boards.
        $("#gameControlStartandRestart").off('click');
        setupAndStart();
        showLoadingView();
    });
}
/**
 * Clears the game board and show a spinners a spinner to the user.
 * Updates the Game control button to show that the game is loading.
 * @return {void}
 */
const showLoadingView = () => {
    $(".gameBoard").empty();
    $(".gameBoard").append(
        $("<div>").addClass("spinner")
            //Use Font Awesome Spinner Icon
            .append($("<i>").addClass("fa-sharp fa-solid fa-spinner fa-spin-pulse")));
    $("#gameControlStartandRestart").attr({ class: "buttonLoading", value: "loading" })
}

/**
 * Asynchronously grab all game data and shuffle/slice the necessary categories
 * Create another async thread to call hideLoadingView, which then populates the game with all retrieved data.
 * @return {void}
 */
const setupAndStart = () => {
    //14 is currently the maximum amount of categories which can be supplied by the API.
    //Lodash will shuffle then splice it into amount set by numberOfCategories.
    getCategoryIds(14).then(response => {
        gameData = response;
        let waitArray = [];
        for (let i = 0; i !== response.length; i++) {
            waitArray.push(getCategory(gameData[i].id)
                .then(cluesData => {
                    gameData[i].clues = cluesData;
                }));
        }
        Promise.all(waitArray).then(() => fillTable());
    });
}

/**
 * Load onto the window and set the game to populate from clicking the start button.
 * Disables the click until the game is fully loaded, to prevent the user from populating multiple game boards.
 */
$(window).on("load", () =>
    $("#gameControlStartandRestart").on("click", (e) => {
        e.preventDefault();
        //Disable click to prevent async from creating multiple the game boards.
        $("#gameControlStartandRestart").off('click');
        setupAndStart();
        showLoadingView();
    })
);